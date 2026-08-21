import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useVerdict } from '@/hooks/useIdentities'
import { useGraph } from '@/hooks/useGraph'
import { verdictLabel, verdictToRiskLevel } from '@/utils/verdict'
import { riskTextColor, riskBorderColor } from '@/utils/riskColors'
import { formatNaira, formatDateTime } from '@/utils/formatters'
import { useAmountsStore } from '@/store/amountsStore'
import { useDecisionsStore } from '@/store/decisionsStore'
import { useAuthStore } from '@/store/authStore'
import { taraAudio } from '@/lib/taraAudio'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

const VERDICT_MEANING = {
  APPROVE: 'No shared-attribute, fragmentation, or coordinated-onboarding signal fired for this identity. It looks independent — nothing further is needed.',
  REVIEW: 'This identity shares something with other verified identities that goes beyond normal coincidence. That is not proof of fraud — a reviewer should look at the evidence below before deciding.',
  REJECT_REVIEW: 'Multiple strong signals point the same way. TARA still will not decide this alone: a person should confirm the evidence below before any action is taken.',
}

export default function VerdictDetail() {
  const { id } = useParams()
  const { data: verdict, isLoading, isError, error } = useVerdict(id)
  const { data: graphData } = useGraph()
  const localAmount = useAmountsStore((s) => s.amounts[id])
  const decision = useDecisionsStore((s) => s.decisions[id])
  const setDecision = useDecisionsStore((s) => s.setDecision)
  const clearDecision = useDecisionsStore((s) => s.clearDecision)
  const reviewerName = useAuthStore((s) => s.user?.name) ?? 'Reviewer'

  const identityNode = graphData?.nodes?.find((n) => n.id === id)
  const identityLabel = identityNode?.label ?? id
  const requestedAmount = identityNode?.requested_amount_ngn ?? localAmount ?? null

  const decide = (outcome) => {
    setDecision(id, outcome, reviewerName)
    if (outcome === 'approved') taraAudio.playVerifiedTick()
    else taraAudio.playVerdictStamp()
  }

  // Plays once per verdict, not on every re-render (React Query can
  // refetch this in the background) — a flagged identity gets the full
  // reveal sting followed by the closing stamp; a clean one just gets a
  // quiet confirmation tick.
  const playedForRef = useRef(null)
  useEffect(() => {
    if (!verdict?.verdict || playedForRef.current === id) return
    playedForRef.current = id
    if (verdict.verdict === 'APPROVE') {
      taraAudio.playVerifiedTick()
    } else if (verdict.verdict === 'REVIEW' || verdict.verdict === 'REJECT_REVIEW') {
      taraAudio.playReveal()
      setTimeout(() => taraAudio.playVerdictStamp(), 1500)
    }
  }, [verdict?.verdict, id])

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  if (isError) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-red-600 mb-1">Failed to load verdict</p>
        <p className="text-xs text-[#8A8580] font-mono">{error?.response?.data?.detail ?? error?.message}</p>
      </div>
    )
  }

  if (verdict.verdict == null) {
    // Graceful fallback shape (src/mocks/identityMocks.js getMockVerdict)
    // for an identity the currently-active data source doesn't know about
    // — e.g. it was created while the backend was live, which has since
    // gone offline. Say so plainly rather than rendering a broken score.
    return (
      <div className="max-w-3xl space-y-4">
        <PageHeader backTo="/graph" title="Trust Verdict" subtitle={identityLabel} />
        <Card className="p-8 text-center">
          <p className="text-sm text-[#6B6660]">{verdict.explanation}</p>
        </Card>
      </div>
    )
  }

  const riskLevel = verdictToRiskLevel(verdict.verdict)
  const color = riskTextColor[riskLevel] ?? riskTextColor.NONE
  const border = riskBorderColor[riskLevel.toLowerCase()] ?? riskBorderColor.none

  return (
    <div className="max-w-3xl space-y-4">
      <PageHeader backTo="/graph" title="Trust Verdict" subtitle={identityLabel} />

      <Card className="p-8 text-center" style={{ borderColor: border, borderWidth: 2 }}>
        <p
          className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide mb-4"
          style={{ color, backgroundColor: color + '1A', border: `1px solid ${color}80` }}
        >
          {verdictLabel(verdict.verdict)}
        </p>
        <p className="text-6xl font-bold font-mono" style={{ color }}>
          {Math.round(verdict.trust_score * 100)}%
        </p>
        <p className="text-xs text-[#8A8580] mt-2 uppercase tracking-wider">Risk Score</p>
        {requestedAmount != null && (
          <p className="text-sm text-[#6B6660] mt-4 pt-4 border-t border-[#E8E5E0]">
            Requested amount on file: <span className="text-[#1B1A17] font-semibold">{formatNaira(requestedAmount)}</span>
          </p>
        )}
      </Card>

      <Card className="p-5">
        <p className="text-xs text-[#8A8580] uppercase tracking-wider font-medium mb-1">What this means</p>
        <p className="text-sm text-[#6B6660] leading-relaxed mb-4">
          {VERDICT_MEANING[verdict.verdict] ?? 'This verdict has no plain-language summary on file.'}
        </p>
        <p className="text-xs text-[#8A8580] uppercase tracking-wider font-medium mb-3">Evidence</p>
        {verdict.evidence.length === 0 ? (
          <p className="text-base text-[#6B6660] leading-relaxed">{verdict.explanation}</p>
        ) : (
          <ul className="space-y-3">
            {/* Two identities can each independently pair against several
                others in the same cluster, producing the same evidence
                sentence more than once — dedupe so a reviewer doesn't read
                the same line four times in a row. */}
            {[...new Set(verdict.evidence)].map((point, i) => (
              <li key={i} className="flex items-start gap-3 text-lg text-[#1B1A17] leading-snug">
                <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {verdict.verdict !== 'APPROVE' && (
        <Card className="p-5">
          <p className="text-xs text-[#8A8580] uppercase tracking-wider font-medium mb-3">Reviewer Decision</p>
          {decision ? (
            <div className={`flex flex-wrap items-center gap-3 p-3 rounded-lg border ${
              decision.decision === 'approved'
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              {decision.decision === 'approved' ? (
                <CheckIcon className="w-4 h-4 text-green-600 shrink-0" />
              ) : (
                <XMarkIcon className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <p className={`text-sm font-medium ${decision.decision === 'approved' ? 'text-green-700' : 'text-red-700'}`}>
                {decision.decision === 'approved' ? 'Approved' : 'Rejected'} by {decision.reviewer}
              </p>
              <p className="text-xs text-[#8A8580] sm:ml-auto">{formatDateTime(decision.decidedAt)}</p>
              <button
                onClick={() => clearDecision(id)}
                className="text-xs text-[#8A8580] hover:text-[#0D9488] underline transition-colors w-full sm:w-auto"
              >
                Change decision
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-[#6B6660] leading-relaxed mb-4">
                Review the evidence above, then record the call. Nothing here is decided automatically —
                this identity stays flagged until a person makes this choice.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" onClick={() => decide('approved')} className="bg-green-600 hover:bg-green-700">
                  <CheckIcon className="w-4 h-4" /> Approve
                </Button>
                <Button variant="danger" onClick={() => decide('rejected')}>
                  <XMarkIcon className="w-4 h-4" /> Reject
                </Button>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  )
}
