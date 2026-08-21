import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { identitiesApi } from '@/api/identities'
import { verdictToRiskLevel } from '@/utils/verdict'
import { useGraph } from './useGraph'
import { useConnectionStore } from '@/store/connectionStore'
import { useAmountsStore } from '@/store/amountsStore'
import { computeAllVerdicts } from '@/mocks/identityMocks'

// Combines GET /graph with a verdict for every node to drive both the
// dashboard's stat cards and the graph explorer's node coloring.
//
// The two connection modes take genuinely different paths, not just a
// different data source:
//   - demo mode: the local dataset carries everything detection needs, so
//     every verdict is computed in one local pass — zero extra requests.
//   - live mode: the backend only exposes one identity's verdict at a
//     time, so this asks for each one — the same N-requests pattern the
//     backend supports today — but every request is individually
//     resilient (api/fallback.js), so one slow identity can't hang the
//     whole page.
export function useIdentityGraph() {
  const { data: graphData, isLoading: graphLoading, isError, error } = useGraph()
  const mode = useConnectionStore((s) => s.mode)
  const amounts = useAmountsStore((s) => s.amounts)
  const nodeIds = graphData?.nodes?.map((n) => n.id) ?? []

  const demoVerdicts = useMemo(
    () => (mode === 'demo' ? computeAllVerdicts(graphData?.nodes ?? []) : null),
    [mode, graphData]
  )

  const verdictQueries = useQueries({
    queries:
      mode === 'demo'
        ? []
        : nodeIds.map((id) => ({
            queryKey: ['verdict', id],
            queryFn: () => identitiesApi.getVerdict(id),
            staleTime: 30_000,
            enabled: !!id,
          })),
  })

  const verdictById = new Map()
  if (mode === 'demo') {
    for (const [id, v] of Object.entries(demoVerdicts ?? {})) verdictById.set(id, v)
  } else {
    nodeIds.forEach((id, i) => {
      const v = verdictQueries[i]?.data
      if (v) verdictById.set(id, v)
    })
  }

  const nodes = (graphData?.nodes ?? []).map((n) => {
    const verdict = verdictById.get(n.id)
    return {
      ...n,
      label: n.label ?? n.id,
      risk: verdict ? verdictToRiskLevel(verdict.verdict) : 'NONE',
      trustScore: verdict?.trust_score ?? null,
      verdict: verdict?.verdict ?? null,
      requested_amount_ngn: n.requested_amount_ngn ?? amounts[n.id] ?? null,
    }
  })

  const nodeIdSet = new Set(nodes.map((n) => n.id))
  const links = (graphData?.links ?? [])
    .filter((l) => nodeIdSet.has(l.source) && nodeIdSet.has(l.target))
    .map((l) => ({
      source: l.source,
      target: l.target,
      attribute_type: l.attribute_type,
      attribute_value: l.attribute_value,
    }))

  const verdictsLoading = mode === 'demo' ? false : verdictQueries.some((q) => q.isLoading)

  return {
    nodes,
    links,
    verdictById,
    isLoading: graphLoading,
    verdictsLoading,
    isError,
    error,
  }
}
