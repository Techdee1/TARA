import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MetricCard } from '@/components/ui/MetricCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { RiskBadge } from '@/components/ui/RiskBadge'
import { Spinner } from '@/components/ui/Spinner'
import { useIdentityGraph } from '@/hooks/useIdentityGraph'
import { verdictLabel } from '@/utils/verdict'
import { formatNairaShort } from '@/utils/formatters'
import { taraAudio } from '@/lib/taraAudio'

export default function Dashboard() {
  const navigate = useNavigate()
  const { nodes, verdictById, isLoading, verdictsLoading } = useIdentityGraph()

  const stats = useMemo(() => {
    const evidenceSignals = new Set()
    let underReview = 0
    let verdictsPending = 0
    let exposureFlagged = 0
    for (const node of nodes) {
      if (node.verdict === 'REVIEW') underReview += 1
      if (node.verdict === 'REJECT_REVIEW') verdictsPending += 1
      if ((node.verdict === 'REVIEW' || node.verdict === 'REJECT_REVIEW') && node.requested_amount_ngn) {
        exposureFlagged += Number(node.requested_amount_ngn)
      }
    }
    // Every member of a flagged cluster shares the identical evidence_summary
    // string, so deduping evidence text across all verdicts approximates the
    // number of distinct flagged clusters without a backend aggregate endpoint.
    for (const verdict of verdictById.values()) {
      for (const line of verdict.evidence ?? []) evidenceSignals.add(line)
    }
    return {
      identitiesVerified: nodes.length,
      flaggedClusters: evidenceSignals.size,
      underReview,
      verdictsPending,
      exposureFlagged,
    }
  }, [nodes, verdictById])

  const flaggedIdentities = useMemo(
    () =>
      nodes
        .filter((n) => n.verdict === 'REVIEW' || n.verdict === 'REJECT_REVIEW')
        .sort((a, b) => (b.trustScore ?? 0) - (a.trustScore ?? 0))
        .slice(0, 5),
    [nodes]
  )

  // One alert per pending-count change, not one per render — React Query
  // can silently refetch this data in the background, and the alert
  // should only fire when there's actually something new to flag.
  const lastAlertedCountRef = useRef(null)
  useEffect(() => {
    if (isLoading || verdictsLoading) return
    if (stats.verdictsPending > 0 && lastAlertedCountRef.current !== stats.verdictsPending) {
      taraAudio.playAlert()
    }
    lastAlertedCountRef.current = stats.verdictsPending
  }, [stats.verdictsPending, isLoading, verdictsLoading])

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Identity trust overview · Live"
        actions={
          <Button variant="primary" onClick={() => navigate('/graph')}>
            Open Graph Explorer →
          </Button>
        }
      />

      {!isLoading && !verdictsLoading && stats.verdictsPending > 0 && (
        <div className="mb-5 bg-red-500/5 border border-red-500/20 rounded-lg p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
            <span className="text-red-600 text-lg font-bold">!</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#1B1A17]">
              {stats.verdictsPending} identity {stats.verdictsPending === 1 ? 'network needs' : 'networks need'} human review
            </p>
            <p className="text-xs text-[#6B6660] mt-0.5">
              TARA is monitoring {stats.identitiesVerified} verified identities in real time
            </p>
          </div>
          <button
            onClick={() => navigate('/graph')}
            className="text-xs text-red-600 border border-red-500/30 rounded-md px-3 py-1.5 hover:bg-red-500/10 transition-colors shrink-0"
          >
            Review in graph →
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <MetricCard
          label="Identities Verified"
          value={isLoading ? '…' : stats.identitiesVerified}
          note="Live"
          variant="dark"
        />
        <MetricCard
          label="Flagged Clusters"
          value={verdictsLoading ? '…' : stats.flaggedClusters}
          note="Shared-attribute & fragmentation signals"
          accent="high"
        />
        <MetricCard
          label="Identities Under Review"
          value={verdictsLoading ? '…' : stats.underReview}
          note="Amber verdicts"
          accent="medium"
        />
        <MetricCard
          label="Verdicts Pending"
          value={verdictsLoading ? '…' : stats.verdictsPending}
          note="Awaiting human decision"
          accent="high"
        />
      </div>

      {!isLoading && !verdictsLoading && stats.exposureFlagged > 0 && (
        <div className="mb-6 rounded-lg p-4 flex flex-wrap items-center gap-4 bg-gradient-to-r from-[#FF4C1D]/10 to-[#9B0063]/10 border border-[#FF4C1D]/20">
          <div className="min-w-0">
            <p className="text-xs text-[#8A8580] uppercase tracking-widest font-medium mb-1">Exposure Flagged Before Disbursement</p>
            <p className="text-2xl font-semibold font-mono text-[#1B1A17]">{formatNairaShort(stats.exposureFlagged)}</p>
          </div>
          <p className="text-xs text-[#6B6660] max-w-md sm:ml-auto">
            Requested across every identity currently under review — money not yet released to a cluster TARA flagged as coordinated.
          </p>
        </div>
      )}

      <div className="bg-[#FFFFFF] border border-[#E8E5E0] rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-[#8A8580] uppercase tracking-wider font-medium">Flagged Identities</p>
          <button onClick={() => navigate('/graph')} className="text-xs text-[#0D9488] hover:underline">Open graph →</button>
        </div>
        {isLoading || verdictsLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : flaggedIdentities.length === 0 ? (
          <p className="text-sm text-[#8A8580] py-4 text-center">No flagged identities — every identity in the graph is independent.</p>
        ) : (
          <div className="divide-y divide-[#E8E5E0]">
            {flaggedIdentities.map((n) => (
              <button
                key={n.id}
                onClick={() => navigate(`/verdict/${n.id}`)}
                className="w-full flex items-center justify-between py-2.5 hover:bg-[#F0EEEA] transition-colors text-left px-2 -mx-2 rounded"
              >
                <div className="min-w-0 mr-4">
                  <p className="text-sm text-[#1B1A17] truncate">{n.label}</p>
                  <p className="text-xs text-[#8A8580] font-mono truncate">{n.id}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono text-[#6B6660]">{Math.round((n.trustScore ?? 0) * 100)}%</span>
                  <RiskBadge level={n.risk} />
                  <span className="text-xs text-[#8A8580]">{verdictLabel(n.verdict)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
