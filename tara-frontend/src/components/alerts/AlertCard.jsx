import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { RiskBadge } from '@/components/ui/RiskBadge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PATTERN_LABELS, formatNairaShort } from '@/utils/formatters'

export function AlertCard({ alert }) {
  return (
    <Link
      to={`/alerts/${alert.id}`}
      className="group block bg-[#FFFFFF] border border-[#E8E5E0] rounded-lg p-4 hover:border-[#0D9488]/40 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <RiskBadge level={alert.riskLevel} />
          <div>
            <p className="text-sm font-medium text-[#1B1A17] group-hover:text-[#0D9488] transition-colors">
              {PATTERN_LABELS[alert.patternType] ?? alert.patternType}
            </p>
            <p className="text-xs text-[#8A8580] font-mono mt-0.5">
              {alert.entityCount} entities · {formatNairaShort(alert.totalVolume)}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={alert.status} />
          <span className="text-[10px] text-[#8A8580]">
            {formatDistanceToNow(new Date(alert.detectedAt), { addSuffix: true })}
          </span>
        </div>
      </div>
    </Link>
  )
}
