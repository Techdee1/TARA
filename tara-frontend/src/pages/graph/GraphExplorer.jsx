import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { GraphCanvas } from '@/components/graph/GraphCanvas'
import { GraphControls } from '@/components/graph/GraphControls'
import { useGraphLayout } from '@/components/graph/useGraphLayout'
import { useIdentityGraph } from '@/hooks/useIdentityGraph'
import { RiskBadge } from '@/components/ui/RiskBadge'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { verdictLabel } from '@/utils/verdict'
import { formatNaira } from '@/utils/formatters'
import { taraAudio } from '@/lib/taraAudio'
import { XMarkIcon } from '@heroicons/react/24/outline'

const LEGEND = [
  ['Needs Review', '#EF4444'],
  ['Review', '#F59E0B'],
  ['Approved', '#22C55E'],
  ['Verifying…', '#3B82F6'],
]

export default function GraphExplorer() {
  const navigate = useNavigate()
  const [riskFilter, setRiskFilter] = useState('ALL')
  const [selectedNode, setSelectedNode] = useState(null)
  const [key, setKey] = useState(0)

  const { nodes: rawNodes, links: rawLinks, isLoading, isError, error } = useIdentityGraph()
  const { nodes, links } = useGraphLayout(riskFilter, { nodes: rawNodes, links: rawLinks })

  return (
    <div className="flex flex-col h-full -m-4 sm:-m-6">
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-0">
        <PageHeader
          title="Graph Explorer"
          subtitle={`${nodes.length} identities · ${links.length} shared-attribute links`}
        />
      </div>

      <GraphControls
        riskFilter={riskFilter}
        onRiskFilterChange={(r) => { setRiskFilter(r); setKey((k) => k + 1) }}
        onReset={() => { setRiskFilter('ALL'); setKey((k) => k + 1) }}
      />

      <div className="flex flex-1 overflow-hidden min-h-0 gap-3 p-3 sm:p-4">
        {/* Dark "spotlight" canvas — a deliberate contrast panel within the
            light shell so node glow and connection lines pop the way they
            would on a real network-monitoring surface. */}
        <div className="flex-1 bg-[#12110E] rounded-2xl relative min-h-0 overflow-hidden shadow-soft-lg">
          {isError ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-red-400">
              <p className="text-sm">Failed to load the identity graph</p>
              <p className="text-xs font-mono text-white/40">{error?.message}</p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-full"><Spinner size="lg" /></div>
          ) : nodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-white/40">
              <p className="text-sm">No identities in the graph yet</p>
              <p className="text-xs font-mono">Verify an identity to add it</p>
            </div>
          ) : (
            <GraphCanvas
              key={key}
              nodes={nodes}
              links={links}
              onNodeClick={(n) => { taraAudio.playPop(); setSelectedNode(n) }}
            />
          )}

          <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-3 flex flex-col gap-1.5">
            {LEGEND.map(([label, color]) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: color, backgroundColor: color + '33' }} />
                <span className="text-[10px] text-white/60 font-mono">{label}</span>
              </div>
            ))}
          </div>

          <p className="absolute top-3 right-3 text-[10px] text-white/30 font-mono hidden sm:block">
            scroll to zoom · drag to pan · drag a node to pin it
          </p>
        </div>

        {/* Detail panel — a side rail on large screens, a bottom sheet on
            small ones (a fixed side column next to the canvas would either
            crush the graph or overflow on a phone). */}
        {selectedNode && (
          <>
            <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSelectedNode(null)} />
            <div className="fixed inset-x-0 bottom-0 z-50 max-h-[75vh] rounded-t-2xl lg:static lg:z-auto lg:max-h-none lg:rounded-2xl w-full lg:w-80 bg-white border border-[#E8E5E0] shadow-soft-lg p-4 overflow-y-auto shrink-0">
              <div className="w-10 h-1 rounded-full bg-[#E8E5E0] mx-auto mb-3 lg:hidden" />
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-[#8A8580] uppercase tracking-wider font-medium">Node Details</p>
                <button onClick={() => setSelectedNode(null)} className="p-1 rounded text-[#8A8580] hover:text-[#1B1A17] hover:bg-[#F0EEEA] transition-colors">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-base font-semibold text-[#1B1A17]">{selectedNode.label}</p>
                  <p className="text-xs text-[#8A8580] font-mono mt-0.5 break-all">{selectedNode.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedNode.verdict ? (
                    <Badge>{verdictLabel(selectedNode.verdict)}</Badge>
                  ) : (
                    <Badge>Verifying…</Badge>
                  )}
                  <RiskBadge level={selectedNode.risk} />
                </div>
                {selectedNode.trustScore !== null && (
                  <p className="text-xs text-[#6B6660]">
                    Trust score: <span className="font-mono text-[#1B1A17]">{(selectedNode.trustScore * 100).toFixed(0)}%</span>
                  </p>
                )}
                {selectedNode.requested_amount_ngn != null && (
                  <p className="text-xs text-[#6B6660]">
                    Requested amount: <span className="font-medium text-[#1B1A17]">{formatNaira(selectedNode.requested_amount_ngn)}</span>
                  </p>
                )}
                <div className="pt-3 border-t border-[#E8E5E0] flex flex-col gap-2">
                  <Button variant="primary" size="sm" className="w-full" onClick={() => navigate(`/identities/${selectedNode.id}`)}>
                    View Identity →
                  </Button>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => navigate(`/verdict/${selectedNode.id}`)}>
                    View Verdict →
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
