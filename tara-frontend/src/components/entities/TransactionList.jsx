import { useNavigate } from 'react-router-dom'
import { formatDateTime, formatNairaShort } from '@/utils/formatters'
import { SquadBadge } from '@/components/ui/SquadBadge'
import { Spinner } from '@/components/ui/Spinner'

const FLAG_COLORS = {
  STRUCTURING: 'text-red-600',
  RAPID_MOVEMENT: 'text-amber-600',
  CIRCULAR: 'text-red-600',
}

export function TransactionList({ transactions, isLoading, showEntityLinks = false }) {
  const navigate = useNavigate()

  if (isLoading) {
    return <div className="flex justify-center py-8"><Spinner /></div>
  }

  if (!transactions?.length) {
    return (
      <div className="py-8 text-center text-[#8A8580] text-sm">No transactions found</div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[#E8E5E0]">
      <table className="w-full text-sm">
        <thead className="bg-[#F0EEEA]">
          <tr>
            {['Date', 'From', 'To', 'Amount', 'Channel', 'Flag'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-[#8A8580] font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E8E5E0]">
          {transactions.map((tx) => {
            const fromLabel = tx.fromEntityName ?? tx.fromEntity
            const toLabel = tx.toEntityName ?? tx.toEntity

            return (
              <tr key={tx.id} className="bg-[#FFFFFF] hover:bg-[#F0EEEA] transition-colors">
                <td className="px-4 py-3 text-[#6B6660] font-mono text-xs whitespace-nowrap">{formatDateTime(tx.date)}</td>
                <td className="px-4 py-3 font-mono text-xs max-w-[140px] truncate">
                  {showEntityLinks && tx.fromEntity ? (
                    <button
                      onClick={() => navigate(`/entities/${tx.fromEntity}`)}
                      className="text-[#0D9488] hover:underline truncate block max-w-full"
                      title={fromLabel}
                    >
                      {fromLabel}
                    </button>
                  ) : (
                    <span className="text-[#6B6660]" title={fromLabel}>{fromLabel}</span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs max-w-[140px] truncate">
                  {showEntityLinks && tx.toEntity ? (
                    <button
                      onClick={() => navigate(`/entities/${tx.toEntity}`)}
                      className="text-[#0D9488] hover:underline truncate block max-w-full"
                      title={toLabel}
                    >
                      {toLabel}
                    </button>
                  ) : (
                    <span className="text-[#6B6660]" title={toLabel}>{toLabel}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-[#1B1A17] font-mono text-xs whitespace-nowrap">{formatNairaShort(tx.amount)}</td>
                <td className="px-4 py-3 text-xs">
                  {tx.channel === 'squad' ? (
                    <SquadBadge />
                  ) : (
                    <span className="text-[#6B6660]">{tx.channel}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs">
                  <span className={`font-mono font-medium ${FLAG_COLORS[tx.flag] ?? 'text-[#6B6660]'}`}>
                    {tx.flag ?? '—'}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
