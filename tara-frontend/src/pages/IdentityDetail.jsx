import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { GraphCanvas } from '@/components/graph/GraphCanvas'
import { Spinner } from '@/components/ui/Spinner'
import { useGraph } from '@/hooks/useGraph'
import { useAmountsStore } from '@/store/amountsStore'
import { formatNaira } from '@/utils/formatters'

const ATTRIBUTE_LABELS = {
  device_id: 'Device',
  address: 'Address',
  employer: 'Employer',
}

export default function IdentityDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: graphData, isLoading, isError } = useGraph()
  const localAmount = useAmountsStore((s) => s.amounts[id])

  const { identity, edges, connected } = useMemo(() => {
    const nodes = graphData?.nodes ?? []
    const links = graphData?.links ?? []
    const nodeById = new Map(nodes.map((n) => [n.id, n]))
    const identity = nodeById.get(id)
    const edges = links.filter((l) => l.source === id || l.target === id)
    const connected = edges
      .map((edge) => {
        const otherId = edge.source === id ? edge.target : edge.source
        return { node: nodeById.get(otherId), attribute_type: edge.attribute_type, attribute_value: edge.attribute_value }
      })
      .filter((c) => c.node)
    return { identity, edges, connected }
  }, [graphData, id])

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  if (isError) return <div className="text-center py-16 text-red-600">Failed to load the identity graph</div>
  if (!identity) return <div className="text-center py-16 text-[#8A8580]">Identity not found</div>

  const requestedAmount = identity.requested_amount_ngn ?? localAmount ?? null

  const hopNodes = [
    { id: identity.id, label: identity.label, risk: 'NONE' },
    ...connected.map((c) => ({ id: c.node.id, label: c.node.label, risk: 'NONE' })),
  ]
  const hopLinks = connected.map((c) => ({ source: id, target: c.node.id }))

  return (
    <div className="space-y-4">
      <PageHeader backTo="/graph" title={identity.label} subtitle={identity.id} />

      <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
        <span className="text-green-600 text-sm font-medium">✓ Verified via QoreID</span>
        <Button variant="outline" size="sm" className="ml-auto" onClick={() => navigate(`/verdict/${identity.id}`)}>
          View Trust Verdict →
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-xs text-[#8A8580] uppercase tracking-wider font-medium mb-3">Identity Attributes</p>
          <dl className="space-y-2.5">
            {[
              ['Device ID', identity.device_id],
              ['Address', identity.address],
              ['Employer', identity.employer],
              ['Requested Amount', requestedAmount != null ? formatNaira(requestedAmount) : null],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <dt className="text-[#8A8580]">{label}</dt>
                <dd className="text-[#1B1A17] text-right">{value ?? '—'}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <div className="bg-[#FFFFFF] border border-[#E8E5E0] rounded-lg overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 border-b border-[#E8E5E0] shrink-0 flex items-center justify-between">
            <p className="text-xs text-[#8A8580] uppercase tracking-wider font-medium">Connected Identities</p>
            <span className="text-[10px] font-mono text-[#8A8580]">{connected.length} connection{connected.length !== 1 ? 's' : ''}</span>
          </div>
          {hopNodes.length > 1 ? (
            <GraphCanvas
              nodes={hopNodes}
              links={hopLinks}
              height={220}
              onNodeClick={(n) => n.id !== id && navigate(`/identities/${n.id}`)}
            />
          ) : (
            <div className="flex items-center justify-center h-40">
              <p className="text-xs text-[#8A8580]">No connected identities found</p>
            </div>
          )}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[#E8E5E0]">
          <p className="text-xs text-[#8A8580] uppercase tracking-wider font-medium">Relationship Signals</p>
        </div>
        {connected.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-[#8A8580]">No shared attributes with other identities — appears independent.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E8E5E0]">
            {connected.map((c, i) => (
              <button
                key={`${c.node.id}-${i}`}
                onClick={() => navigate(`/identities/${c.node.id}`)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#F0EEEA] transition-colors text-left"
              >
                <div className="min-w-0 mr-4">
                  <p className="text-sm text-[#1B1A17] truncate">{c.node.label}</p>
                  <p className="text-xs text-[#8A8580] font-mono truncate">{c.node.id}</p>
                </div>
                <div className="text-right shrink-0">
                  <Badge>{ATTRIBUTE_LABELS[c.attribute_type] ?? c.attribute_type}</Badge>
                  <p className="text-[10px] text-[#8A8580] mt-1 max-w-40 truncate">{c.attribute_value}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
