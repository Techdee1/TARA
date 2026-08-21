// Normalizes a QoreID verification response into one flat, predictable
// shape the UI can render without caring which of several possible raw
// shapes actually came back:
//
//   - Real QoreID NIN/BVN lookups (`raw.nin` / `raw.bvn` + `raw.summary.*`
//     + `raw.status.{state,status}` + `raw.applicant`)
//   - The backend's own offline stub, used when its QoreID call fails
//     (`raw.data.*` + top-level `raw.status` + `raw.fallback`)
//   - The frontend's demo-mode stub (src/mocks/identityMocks.js), same
//     shape as the backend stub minus a couple of fields
//
// Every field below is best-effort — missing fields render as "—" rather
// than breaking the summary, since which fields exist depends entirely on
// which of the above shapes answered.
export function normalizeQoreIdResponse(raw) {
  if (!raw || typeof raw !== 'object') return null

  // Real QoreID response: the identity record lives under `nin` or `bvn`,
  // keyed by whichever check ran.
  const idRecord = raw.nin ?? raw.bvn ?? null
  const idKey = raw.nin ? 'nin' : raw.bvn ? 'bvn' : null
  const summary = raw.summary?.[`${idKey}_check`] ?? null

  if (idRecord) {
    const fullName = [idRecord.firstname, idRecord.middlename, idRecord.lastname]
      .filter(Boolean)
      .join(' ')
    const fieldMatches = summary?.fieldMatches
      ? Object.entries(summary.fieldMatches).map(([field, matched]) => ({ field, matched: !!matched }))
      : null

    return {
      verified: raw.status?.status === 'verified' || raw.status?.state === 'complete',
      matchLabel: summary?.status ? formatMatchLabel(summary.status) : null,
      fullName: fullName || null,
      idType: idKey.toUpperCase(),
      idNumber: idRecord[idKey] ?? null,
      phone: idRecord.phone ?? null,
      gender: idRecord.gender ?? null,
      dob: idRecord.birthdate ?? idRecord.dateOfBirth ?? null,
      confidence: null,
      fieldMatches,
      photoDataUrl: toPhotoDataUrl(idRecord),
      isFallback: false,
      fallbackReason: null,
      source: 'qoreid',
    }
  }

  // Stub shape (backend offline fallback, or the frontend's own demo mode).
  if (raw.data || raw.status === 'verified' || raw.status === 'rejected') {
    const d = raw.data ?? {}
    return {
      verified: raw.status === 'verified',
      matchLabel: raw.fallback ? 'Stubbed (no live check)' : null,
      fullName: d.fullName ?? null,
      idType: d.idType ? d.idType.toUpperCase() : null,
      idNumber: d.idNumber ?? null,
      phone: d.phoneNumber ?? null,
      gender: null,
      dob: d.dateOfBirth ?? null,
      confidence: typeof raw.confidence === 'number' ? raw.confidence : null,
      fieldMatches: null,
      photoDataUrl: toPhotoDataUrl(d),
      isFallback: !!raw.fallback || raw.provider === 'qoreid_stub_offline',
      fallbackReason: raw.fallback_reason ?? null,
      source: raw.provider ?? 'stub',
    }
  }

  return null
}

// QoreID (and providers like it) name the base64 photo field differently
// depending on the check — try every field name it's known to use, and
// return a ready-to-render `data:` URL. The raw value can arrive either
// bare (just the base64 payload) or already wrapped in a data URL — this
// normalizes to the latter either way, and returns null rather than a
// broken <img> if nothing usable is present.
const PHOTO_FIELDS = ['photo', 'photoBase64', 'image', 'img', 'picture', 'passportPhoto', 'photograph', 'base64Image']

function toPhotoDataUrl(record) {
  if (!record) return null
  for (const field of PHOTO_FIELDS) {
    const value = record[field]
    if (typeof value !== 'string' || value.length < 100) continue // too short to be real image data
    return value.startsWith('data:') ? value : `data:image/jpeg;base64,${value}`
  }
  return null
}

function formatMatchLabel(status) {
  // "EXACT_MATCH" -> "Exact Match"
  return status
    .toLowerCase()
    .split('_')
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(' ')
}
