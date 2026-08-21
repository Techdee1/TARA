// Frontend-only demo engine for TARA.
//
// This is what the app falls back to when the real backend doesn't answer
// in time (see api/fallback.js) — a self-contained copy of the same three
// detection patterns the backend runs (shared-attribute clusters, identity
// fragmentation, coordinated onboarding) and a seed dataset shaped like a
// realistic loan-stacking ring, so a demo never goes dark just because a
// venue's wifi does. Thresholds are kept identical to the backend
// (backend/app/services/pattern_service.py) so the story — "8 identities,
// one device, one address, verified within 48 hours" — holds up the same
// way whether the graph came from the server or from here.

const STORAGE_KEY = 'tara-demo-graph-v1'

// ─── Seed dataset — a 24-identity graph: an 8-person loan-stacking ring
// plus 16 independent identities, so the ring reads as a needle in a real
// graph rather than the only thing in the room. ─────────────────────────
const SEED_IDENTITIES = [
  { name: 'Adaeze Nwankwo', device_id: 'DEV-9F31A', address: '14 Allen Ave, Ikeja', phone: '08031234501', employer: 'Zenta Logistics Ltd', verified_at: '2026-08-21T06:12:00', requested_amount_ngn: 350000 },
  { name: 'Adaeze N. Nwankwo', device_id: 'DEV-9F31A', address: '14 Allen Ave, Ikeja', phone: '08031234502', employer: 'Zenta Logistics Ltd', verified_at: '2026-08-21T06:40:00', requested_amount_ngn: 300000 },
  { name: 'Chidinma Okoro', device_id: 'DEV-9F31A', address: '14 Allen Ave, Ikeja', phone: '08031234503', employer: 'Zenta Logistics Ltd', verified_at: '2026-08-21T07:05:00', requested_amount_ngn: 400000 },
  { name: 'Ifeoma Balogun', device_id: 'DEV-7C112', address: '14 Allen Ave, Ikeja', phone: '08031234504', employer: 'Zenta Logistics Ltd', verified_at: '2026-08-21T07:38:00', requested_amount_ngn: 280000 },
  { name: 'Tobenna Eze', device_id: 'DEV-9F31A', address: '14 Allen Ave, Ikeja', phone: '08031234505', employer: 'Zenta Logistics Ltd', verified_at: '2026-08-21T08:10:00', requested_amount_ngn: 320000 },
  { name: 'Uchenna Madu', device_id: 'DEV-7C112', address: '14 Allen Ave, Ikeja', phone: '08031234506', employer: 'Zenta Logistics Ltd', verified_at: '2026-08-21T09:02:00', requested_amount_ngn: 450000 },
  { name: 'Blessing Nwosu', device_id: 'DEV-3A882', address: '14 Allen Ave, Ikeja', phone: '08031234507', employer: 'Zenta Logistics Ltd', verified_at: '2026-08-21T10:15:00', requested_amount_ngn: 375000 },
  { name: 'Grace Chukwu', device_id: 'DEV-3A882', address: '14 Allen Ave, Ikeja', phone: '08031234508', employer: 'Zenta Logistics Ltd', verified_at: '2026-08-21T11:30:00', requested_amount_ngn: 310000 },
  { name: 'Emeka Obiora', device_id: 'DEV-1B441', address: '22 Herbert Macaulay Way, Yaba', phone: '08051230001', employer: 'Coastline Freight Co', verified_at: '2026-08-18T09:15:00', requested_amount_ngn: 150000 },
  { name: 'Funmilayo Adeyemi', device_id: 'DEV-2C552', address: '5 Bode Thomas St, Surulere', phone: '08061230002', employer: 'Meridian Retail Group', verified_at: '2026-08-19T13:42:00', requested_amount_ngn: 200000 },
  { name: 'Kelechi Umeh', device_id: 'DEV-3D663', address: '17 Admiralty Way, Lekki Phase 1', phone: '08071230003', employer: 'Harborview Consulting', verified_at: '2026-08-20T08:05:00', requested_amount_ngn: null },
  { name: 'Ngozi Eze', device_id: 'DEV-4E774', address: '9 Ajose Adeogun St, Victoria Island', phone: '08081230004', employer: 'Palmgrove Textiles', verified_at: '2026-08-17T16:20:00', requested_amount_ngn: 500000 },
  { name: 'Ibrahim Suleiman', device_id: 'DEV-5F885', address: '31 Wharf Rd, Apapa', phone: '08091230005', employer: 'Nordbay Shipping Agency', verified_at: '2026-08-21T05:50:00', requested_amount_ngn: null },
  { name: 'Aisha Bello', device_id: 'DEV-6A996', address: '44 Ikorodu Rd, Maryland', phone: '08101230006', employer: 'Sunrise EdTech Ltd', verified_at: '2026-08-16T11:05:00', requested_amount_ngn: 120000 },
  { name: 'Oluwaseun Fashola', device_id: 'DEV-7B107', address: '3 Iju Rd, Ogba', phone: '08111230007', employer: 'Craneworks Engineering', verified_at: '2026-08-19T14:35:00', requested_amount_ngn: null },
  { name: 'Chiamaka Okafor', device_id: 'DEV-8C218', address: '26 Isolo Rd, Isolo', phone: '08121230008', employer: 'Delta Pharma Distributors', verified_at: '2026-08-20T18:12:00', requested_amount_ngn: 260000 },
  { name: 'Yakubu Danladi', device_id: 'DEV-9D329', address: '12 Church St, Ikorodu', phone: '08131230009', employer: null, verified_at: '2026-08-15T10:00:00', requested_amount_ngn: 90000 },
  { name: 'Temitope Ojo', device_id: 'DEV-0E430', address: '8 Randle Ave, Surulere', phone: '08141230010', employer: 'Brightline Media House', verified_at: '2026-08-21T07:22:00', requested_amount_ngn: null },
  { name: 'Chukwuemeka Ibe', device_id: 'DEV-1F541', address: "19 Oduduwa Cres, Ikeja GRA", phone: '08151230011', employer: 'Vantage Power Systems', verified_at: '2026-08-14T15:48:00', requested_amount_ngn: 175000 },
  { name: 'Halima Musa', device_id: 'DEV-2G652', address: '27 Egbeda Rd, Egbeda', phone: '08161230012', employer: 'Goldcrest Insurance', verified_at: '2026-08-18T12:30:00', requested_amount_ngn: null },
  { name: 'Segun Aluko', device_id: 'DEV-3H763', address: "6 Alaba Int'l Market Rd, Alaba", phone: '08171230013', employer: 'Ridgeway Auto Parts', verified_at: '2026-08-20T09:55:00', requested_amount_ngn: 220000 },
  { name: 'Patience Etim', device_id: 'DEV-4I874', address: '15 Diya St, Gbagada', phone: '08181230014', employer: 'Lakeside Hospitality Group', verified_at: '2026-08-19T17:10:00', requested_amount_ngn: null },
  { name: 'Abdulrahman Yusuf', device_id: 'DEV-5J985', address: '10 Oshodi-Apapa Expy, Oshodi', phone: '08191230015', employer: 'Kingsbridge Logistics', verified_at: '2026-08-13T08:40:00', requested_amount_ngn: 130000 },
  { name: 'Ebele Nnamdi', device_id: 'DEV-6K096', address: '21 Ojuelegba Rd, Mushin', phone: '08201230016', employer: 'Copperline Real Estate', verified_at: '2026-08-21T06:58:00', requested_amount_ngn: null },
].map((record, i) => ({ id: `mock-${String(i + 1).padStart(2, '0')}`, ...record }))

const SHARED_ATTRIBUTES = ['device_id', 'address', 'employer']

// ─── Persisted mutable store ──────────────────────────────────────────────
// A live "Verify Identity" submission in demo mode should still add a real
// node to the graph and stick around on refresh, so the demo can show the
// full verify → graph → verdict loop without a reachable backend.
function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* corrupted or inaccessible storage — fall through to a fresh seed */
  }
  return { identities: SEED_IDENTITIES, nextIndex: SEED_IDENTITIES.length + 1 }
}

let store = loadStore()

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    /* private browsing / storage full — demo still works for this tab */
  }
}

export function resetMockGraph() {
  store = { identities: SEED_IDENTITIES, nextIndex: SEED_IDENTITIES.length + 1 }
  persist()
}

// ─── String similarity — a small dependency-free stand-in for the
// backend's RapidFuzz token_sort_ratio, close enough to fire on the same
// near-duplicate-name cases (e.g. "Adaeze Nwankwo" vs "Adaeze N. Nwankwo"). ─
function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 0; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
    }
  }
  return dp[a.length][b.length]
}

function tokenSortRatio(a, b) {
  const sort = (s) => s.toLowerCase().split(/\s+/).filter(Boolean).sort().join(' ')
  const sa = sort(a)
  const sb = sort(b)
  const total = sa.length + sb.length
  if (total === 0) return 100
  const dist = levenshtein(sa, sb)
  return Math.round(((total - dist) / total) * 100)
}

// ─── Detection patterns — same shape and thresholds as pattern_service.py ─
function detectSharedAttributeClusters(nodes, minClusterSize = 4) {
  const clusters = new Map()
  for (const node of nodes) {
    for (const attr of SHARED_ATTRIBUTES) {
      const value = node[attr]
      if (!value) continue
      const key = `${attr}:${value}`
      if (!clusters.has(key)) clusters.set(key, [])
      clusters.get(key).push(node.id)
    }
  }
  const findings = []
  for (const [key, members] of clusters) {
    if (members.length < minClusterSize) continue
    const [attrType, attrVal] = key.split(':')
    findings.push({
      pattern_type: 'shared_attribute_cluster',
      shared_attribute: attrType,
      value: attrVal,
      identity_ids: members,
      evidence_summary: `${members.length} verified identities share the same ${attrType.replace('_', ' ')}: ${attrVal}`,
    })
  }
  return findings
}

function detectIdentityFragmentation(nodes, similarityThreshold = 85) {
  const findings = []
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i]
      const b = nodes[j]
      const score = tokenSortRatio(a.name, b.name)
      if (score < similarityThreshold || a.id === b.id) continue
      const sameContext =
        (a.address && a.address === b.address) ||
        ((a.phone ?? '').slice(0, 4) === (b.phone ?? '').slice(0, 4) && (a.phone ?? '').length > 0)
      if (!sameContext) continue
      findings.push({
        pattern_type: 'identity_fragmentation',
        identity_ids: [a.id, b.id],
        similarity_score: score,
        evidence_summary: `'${a.name}' and '${b.name}' are ${score}% name-similar and share context — likely the same person under two verified identities`,
      })
    }
  }
  return findings
}

function detectCoordinatedOnboarding(nodes, windowHours = 48, minGroupSize = 4) {
  const groups = new Map()
  for (const node of nodes) {
    const key = node.device_id || node.referral_source
    if (!key) continue
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(node)
  }
  const findings = []
  for (const members of groups.values()) {
    if (members.length < minGroupSize) continue
    const times = members.map((m) => new Date(m.verified_at).getTime()).filter(Number.isFinite).sort((a, b) => a - b)
    if (!times.length) continue
    const spreadHours = (times[times.length - 1] - times[0]) / 3_600_000
    if (spreadHours > windowHours) continue
    findings.push({
      pattern_type: 'coordinated_onboarding',
      identity_ids: members.map((m) => m.id),
      window_hours: windowHours,
      evidence_summary: `${members.length} identities verified within ${windowHours} hours, sharing device or referral source`,
    })
  }
  return findings
}

function computeTrustScore(identityId, findings) {
  const direct = findings.filter((f) => f.identity_ids.includes(identityId))
  if (!direct.length) return { score: 0.05, verdict: 'APPROVE', evidence: [] }

  const baseScore = Math.min(0.95, 0.35 + 0.2 * direct.length)
  let verdict
  if (baseScore >= 0.7) verdict = 'REJECT_REVIEW' // never auto-reject — always human review
  else if (baseScore >= 0.4) verdict = 'REVIEW'
  else verdict = 'APPROVE'

  return { score: Math.round(baseScore * 100) / 100, verdict, evidence: direct.map((f) => f.evidence_summary) }
}

function buildExplanation(evidence) {
  if (!evidence.length) return 'No relationship signals found. This identity appears independent.'
  return 'Flagged because: ' + evidence.join(' Also: ')
}

function runDetection(nodes) {
  return [
    ...detectSharedAttributeClusters(nodes),
    ...detectIdentityFragmentation(nodes),
    ...detectCoordinatedOnboarding(nodes),
  ]
}

function toVerdict(identityId, findings) {
  const result = computeTrustScore(identityId, findings)
  return {
    identity_id: identityId,
    trust_score: result.score,
    verdict: result.verdict,
    evidence: result.evidence,
    explanation: buildExplanation(result.evidence),
  }
}

// ─── Public mock API — shaped exactly like the real endpoints it stands
// in for, so callers never need to know which one answered. ──────────────
export function getMockGraph() {
  const nodes = store.identities.map((n) => ({
    id: n.id,
    label: n.name,
    device_id: n.device_id,
    address: n.address,
    employer: n.employer,
    requested_amount_ngn: n.requested_amount_ngn ?? null,
  }))

  const links = []
  for (let i = 0; i < store.identities.length; i++) {
    for (let j = i + 1; j < store.identities.length; j++) {
      const a = store.identities[i]
      const b = store.identities[j]
      for (const attr of SHARED_ATTRIBUTES) {
        if (a[attr] && a[attr] === b[attr]) {
          links.push({ source: a.id, target: b.id, attribute_type: attr, attribute_value: a[attr] })
        }
      }
    }
  }
  return { nodes, links }
}

export function computeAllVerdicts(nodes) {
  // Accepts either the mock store's rich node shape or the leaner nodes
  // returned by getMockGraph() — falls back to the stored records for
  // fields (phone, verified_at) the graph payload doesn't carry.
  const byId = new Map(store.identities.map((n) => [n.id, n]))
  const enriched = (nodes?.length ? nodes : store.identities).map((n) => ({ ...byId.get(n.id), ...n }))
  const findings = runDetection(enriched)
  const result = {}
  for (const n of enriched) result[n.id] = toVerdict(n.id, findings)
  return result
}

export function getMockVerdict(identityId) {
  const findings = runDetection(store.identities)
  if (!store.identities.some((n) => n.id === identityId)) {
    // A verdict was requested for an id the demo dataset doesn't know
    // about (e.g. the backend was live when the identity was created, but
    // has since gone offline) — degrade gracefully instead of throwing.
    return {
      identity_id: identityId,
      trust_score: null,
      verdict: null,
      evidence: [],
      explanation: 'Verdict unavailable while running on demo data.',
    }
  }
  return toVerdict(identityId, findings)
}

// Deterministic pseudo-verification, mirroring the backend's QoreID stub
// (backend/app/services/qoreid_service.py) closely enough that the "raw
// response" panel looks the same regardless of which one produced it.
async function fakeHash(input) {
  try {
    const data = new TextEncoder().encode(input)
    const digest = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('')
  } catch {
    // crypto.subtle needs a secure context — fall back to a simple string
    // hash so the demo still works over plain http (e.g. a local network
    // demo without TLS).
    let h = 0
    for (let i = 0; i < input.length; i++) h = (Math.imul(31, h) + input.charCodeAt(i)) | 0
    return Math.abs(h).toString(16).padStart(8, '0').repeat(8).slice(0, 64)
  }
}

export async function mockVerifyIdentity(payload) {
  const idNumber = (payload.bvn || payload.nin || '').trim()
  const fullName = [payload.first_name, payload.last_name].filter(Boolean).join(' ').trim()

  if (!idNumber || !fullName) {
    return { status: 'rejected', reason: 'identity_not_verified' }
  }

  const digest = await fakeHash(idNumber)
  const confidence = Math.round((0.85 + (parseInt(digest.slice(0, 4), 16) % 1500) / 10000) * 10000) / 10000
  const raw = {
    status: 'verified',
    confidence,
    data: {
      fullName,
      idNumber,
      idType: payload.bvn ? 'bvn' : 'nin',
    },
    verifiedAt: new Date().toISOString(),
    provider: 'qoreid_stub_offline',
  }

  const requestedAmount = payload.requested_amount_ngn
  const parsedAmount = requestedAmount != null && requestedAmount !== '' && !Number.isNaN(Number(requestedAmount))
    ? Number(requestedAmount)
    : null

  const node = {
    id: `mock-${String(store.nextIndex).padStart(2, '0')}-${Date.now().toString(36)}`,
    name: fullName,
    device_id: payload.device_id || null,
    address: payload.address || null,
    phone: null,
    employer: payload.employer || null,
    referral_source: payload.referral_source || null,
    verified_at: new Date().toISOString(),
    requested_amount_ngn: parsedAmount,
  }
  store.identities.push(node)
  store.nextIndex += 1
  persist()

  return { status: 'verified', identity_id: node.id, qoreid_raw: raw }
}
