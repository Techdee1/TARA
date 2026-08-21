import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { useVerdict } from '@/hooks/useIdentities'
import { useGraph } from '@/hooks/useGraph'
import { verdictLabel, verdictToRiskLevel } from '@/utils/verdict'
import { riskTextColor, riskBorderColor } from '@/utils/riskColors'
import { formatNaira } from '@/utils/formatters'
import { useAmountsStore } from '@/store/amountsStore'
import { taraAudio } from '@/lib/taraAudio'

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

  const identityNode = graphData?.nodes?.find((n) => n.id === id)
  const identityLabel = identityNode?.label ?? id
  const requestedAmount = identityNode?.requested_amount_ngn ?? localAmount ?? null

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
        <p className="text-xs text-[#8A8580] mt-2 uppercase tracking-wider">Trust Score</p>
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
            {verdict.evidence.map((point, i) => (
              <li key={i} className="flex items-start gap-3 text-lg text-[#1B1A17] leading-snug">
                <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
