import { useMemo } from 'react'
import { PATTERN_LABELS } from '@/utils/formatters'

export function AlertFilters({ filters, onChange, alerts = [] }) {
  const patternTypes = useMemo(() => {
    const seen = new Set(alerts.map((a) => a.patternType).filter(Boolean))
    return [...seen].sort()
  }, [alerts])

  return (
    <div className="flex flex-wrap gap-3 p-4 bg-[#FFFFFF] border border-[#E8E5E0] rounded-lg mb-4">
      <select
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value })}
        className="bg-[#F0EEEA] border border-[#E8E5E0] rounded-md px-3 py-1.5 text-sm text-[#1B1A17] focus:outline-none focus:border-[#0D9488]/50"
      >
        <option value="">All Statuses</option>
        <option value="OPEN">Open</option>
        <option value="IN_REVIEW">In Review</option>
        <option value="STR_FILED">STR Filed</option>
        <option value="DISMISSED">Dismissed</option>
      </select>

      <select
        value={filters.riskLevel}
        onChange={(e) => onChange({ ...filters, riskLevel: e.target.value })}
        className="bg-[#F0EEEA] border border-[#E8E5E0] rounded-md px-3 py-1.5 text-sm text-[#1B1A17] focus:outline-none focus:border-[#0D9488]/50"
      >
        <option value="">All Risk Levels</option>
        <option value="HIGH">High</option>
        <option value="MEDIUM">Medium</option>
        <option value="LOW">Low</option>
      </select>

      <select
        value={filters.patternType}
        onChange={(e) => onChange({ ...filters, patternType: e.target.value })}
        className="bg-[#F0EEEA] border border-[#E8E5E0] rounded-md px-3 py-1.5 text-sm text-[#1B1A17] focus:outline-none focus:border-[#0D9488]/50"
      >
        <option value="">All Patterns</option>
        {patternTypes.map((pt) => (
          <option key={pt} value={pt}>{PATTERN_LABELS[pt] ?? pt}</option>
        ))}
      </select>
    </div>
  )
}
