import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useVerifyIdentity } from '@/hooks/useIdentities'
import { formatNaira } from '@/utils/formatters'
import { useAmountsStore } from '@/store/amountsStore'
import { taraAudio } from '@/lib/taraAudio'
import { normalizeQoreIdResponse } from '@/utils/qoreid'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

function SummaryRow({ label, value, mono }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-[10px] text-[#8A8580] uppercase tracking-wider mb-0.5">{label}</dt>
      <dd className={`text-sm text-[#1B1A17] font-medium ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  )
}

const EMPTY_FORM = {
  full_name: '',
  id_number: '',
  device_id: '',
  address: '',
  employer: '',
  requested_amount_ngn: '',
}

// NIN and BVN are both 11-digit Nigerian identifiers, so the same shape
// check covers either — the ID type toggle only changes which field name
// the number is sent under.
function validate(form) {
  const errors = {}
  if (!form.full_name.trim()) errors.full_name = 'Required'
  if (!form.id_number.trim()) errors.id_number = 'Required'
  else if (!/^\d{11}$/.test(form.id_number.trim())) errors.id_number = 'Must be 11 digits'
  return errors
}

// Splits "Adaeze N. Nwankwo" -> first_name "Adaeze N.", last_name "Nwankwo" —
// the backend rejoins these with a single space, so this round-trips exactly.
function splitName(fullName) {
  const trimmed = fullName.trim()
  const lastSpace = trimmed.lastIndexOf(' ')
  if (lastSpace === -1) return { first_name: trimmed, last_name: '' }
  return { first_name: trimmed.slice(0, lastSpace), last_name: trimmed.slice(lastSpace + 1) }
}

export default function VerifyIdentity() {
  const navigate = useNavigate()
  const [idType, setIdType] = useState('bvn')
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [result, setResult] = useState(null)
  const [showRaw, setShowRaw] = useState(false)
  const verifyMutation = useVerifyIdentity()
  const setAmount = useAmountsStore((s) => s.setAmount)

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    if (errors[field]) setErrors((err) => ({ ...err, [field]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }

    const { first_name, last_name } = splitName(form.full_name)
    const idNumber = form.id_number.trim()
    try {
      const data = await verifyMutation.mutateAsync({
        [idType]: idNumber,
        first_name,
        last_name,
        device_id: form.device_id.trim() || undefined,
        address: form.address.trim() || undefined,
        employer: form.employer.trim() || undefined,
        requested_amount_ngn: form.requested_amount_ngn.trim() || undefined,
      })
      setResult(data)
      const amountValue = form.requested_amount_ngn.trim()
      if (data.status === 'verified' && amountValue && !Number.isNaN(Number(amountValue))) {
        setAmount(data.identity_id, Number(amountValue))
      }
      if (data.status === 'verified') {
        taraAudio.playPop() // the identity landing in the graph
        setTimeout(() => taraAudio.playVerifiedTick(), 160)
      } else {
        taraAudio.playAlert()
      }
    } catch (err) {
      const detail = err?.response?.data?.detail
      setResult({ status: 'error', reason: typeof detail === 'string' ? detail : 'Verification request failed' })
      taraAudio.playAlert()
    }
  }

  const handleReset = () => {
    setForm(EMPTY_FORM)
    setErrors({})
    setResult(null)
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Verify Identity" subtitle="Runs a live QoreID verification and adds the identity to the graph" />

      <Card className="p-4 sm:p-5">
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Kosisochukwu Nwachukwu"
            value={form.full_name}
            onChange={set('full_name')}
            error={errors.full_name}
            disabled={verifyMutation.isPending}
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-[#6B6660] font-medium uppercase tracking-wider">
                {idType === 'bvn' ? 'BVN' : 'NIN'}
              </label>
              <div className="flex rounded-md border border-[#E8E5E0] overflow-hidden text-[10px] font-medium">
                {[
                  ['bvn', 'BVN'],
                  ['nin', 'NIN'],
                ].map(([value, text]) => (
                  <button
                    key={value}
                    type="button"
                    disabled={verifyMutation.isPending}
                    onClick={() => setIdType(value)}
                    className={
                      idType === value
                        ? 'px-2.5 py-1 bg-[#0D9488]/15 text-[#0D9488]'
                        : 'px-2.5 py-1 bg-[#F0EEEA] text-[#8A8580] hover:text-[#6B6660]'
                    }
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
            <Input
              placeholder={idType === 'bvn' ? '11-digit Bank Verification Number' : '11-digit National Identification Number'}
              value={form.id_number}
              onChange={set('id_number')}
              error={errors.id_number}
              disabled={verifyMutation.isPending}
              inputMode="numeric"
            />
            <p className="text-[11px] text-[#8A8580] mt-1.5">
              {idType === 'bvn'
                ? "No bank account yet? Switch to NIN — it doesn't require one."
                : 'Works for anyone with a National ID, bank account or not.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Device ID"
              placeholder="e.g. DEV-9F31A"
              value={form.device_id}
              onChange={set('device_id')}
              disabled={verifyMutation.isPending}
            />
            <Input
              label="Employer"
              placeholder="e.g. Zenta Logistics Ltd"
              value={form.employer}
              onChange={set('employer')}
              disabled={verifyMutation.isPending}
            />
          </div>
          <Input
            label="Address"
            placeholder="e.g. 14 Allen Ave, Ikeja"
            value={form.address}
            onChange={set('address')}
            disabled={verifyMutation.isPending}
          />
          <div>
            <Input
              label="Requested Amount (₦) · optional"
              placeholder="e.g. 350000"
              value={form.requested_amount_ngn}
              onChange={set('requested_amount_ngn')}
              disabled={verifyMutation.isPending}
              inputMode="numeric"
            />
            <p className="text-[11px] text-[#8A8580] mt-1.5">
              A loan, wallet top-up, or listing value — shown on the verdict so a reviewer sees what's at stake, not used in detection.
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="ghost" onClick={handleReset} disabled={verifyMutation.isPending}>
              Reset
            </Button>
            <Button type="submit" variant="primary" loading={verifyMutation.isPending}>
              {verifyMutation.isPending ? 'Verifying…' : 'Verify Identity'}
            </Button>
          </div>
        </form>
      </Card>

      {result && (
        <Card className="p-4 sm:p-5 mt-4">
          {result.status === 'verified' ? (() => {
            const summary = normalizeQoreIdResponse(result.qoreid_raw)
            return (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <span className="text-green-600 text-sm font-medium">✓ Verified via QoreID</span>
                <span className="text-xs text-[#8A8580] font-mono sm:ml-auto break-all">{result.identity_id}</span>
              </div>

              {summary && (
                <div className="rounded-xl border border-[#E8E5E0] bg-[#F8F7F5] p-4">
                  <div className="flex items-center justify-between mb-3.5">
                    <p className="text-xs uppercase tracking-wider font-semibold text-[#8A8580]">Verification Summary</p>
                    {summary.matchLabel && (
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#0D9488]/10 text-[#0D9488]">
                        {summary.matchLabel}
                      </span>
                    )}
                  </div>

                  <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                    <SummaryRow label="Full Name" value={summary.fullName} />
                    <SummaryRow label="ID Type" value={summary.idType} />
                    <SummaryRow label="ID Number" value={summary.idNumber} mono />
                    <SummaryRow label="Phone" value={summary.phone} />
                    <SummaryRow label="Gender" value={summary.gender} />
                    <SummaryRow label="Date of Birth" value={summary.dob} />
                    {summary.confidence != null && (
                      <SummaryRow label="Confidence" value={`${Math.round(summary.confidence * 100)}%`} />
                    )}
                  </dl>

                  {summary.fieldMatches && summary.fieldMatches.length > 0 && (
                    <div className="mt-3.5 pt-3.5 border-t border-[#E8E5E0] flex flex-wrap gap-1.5">
                      {summary.fieldMatches.map(({ field, matched }) => (
                        <span
                          key={field}
                          className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            matched ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                          }`}
                        >
                          {matched ? <CheckIcon className="w-2.5 h-2.5" /> : <XMarkIcon className="w-2.5 h-2.5" />}
                          {field}
                        </span>
                      ))}
                    </div>
                  )}

                  {summary.isFallback && (
                    <p className="mt-3.5 pt-3.5 border-t border-[#E8E5E0] text-[11px] text-amber-700 leading-relaxed">
                      This used TARA&apos;s offline verification stub, not a live QoreID lookup
                      {summary.fallbackReason ? ` — ${summary.fallbackReason}` : '.'}
                    </p>
                  )}
                </div>
              )}

              {form.requested_amount_ngn.trim() && !Number.isNaN(Number(form.requested_amount_ngn)) && (
                <p className="text-sm text-[#6B6660]">
                  Requested amount on file: <span className="text-[#1B1A17] font-medium">{formatNaira(Number(form.requested_amount_ngn))}</span>
                </p>
              )}

              <div>
                <button
                  onClick={() => setShowRaw((v) => !v)}
                  className="text-xs text-[#8A8580] hover:text-[#0D9488] transition-colors"
                >
                  {showRaw ? '− Hide' : '+ Show'} technical response (raw JSON)
                </button>
                {showRaw && (
                  <pre className="mt-2 bg-[#F5F4F1] border border-[#E8E5E0] rounded-md p-3 text-[11px] text-[#6B6660] font-mono overflow-x-auto whitespace-pre-wrap break-all max-h-64 overflow-y-auto">
                    {JSON.stringify(result.qoreid_raw, null, 2)}
                  </pre>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="primary" size="sm" onClick={() => navigate(`/identities/${result.identity_id}`)}>
                  View Identity →
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate(`/verdict/${result.identity_id}`)}>
                  View Verdict →
                </Button>
                <Button variant="ghost" size="sm" className="sm:ml-auto" onClick={handleReset}>
                  Verify Another
                </Button>
              </div>
            </div>
            )
          })() : (
            <div className="flex flex-wrap items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <span className="text-red-600 text-sm font-medium">
                ✗ {result.status === 'rejected' ? 'Identity not verified' : 'Request failed'}
              </span>
              <span className="text-xs text-[#6B6660] sm:ml-auto">{result.reason}</span>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
