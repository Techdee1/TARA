import { useQuery } from '@tanstack/react-query'
import { auditApi } from '@/api/audit'
import { normaliseAuditEntry } from '@/hooks/useAudit'
import { formatDateTime } from '@/utils/formatters'
import { Spinner } from '@/components/ui/Spinner'

const ACTION_COLORS = {
  STR_GENERATED:        { dot: 'bg-[#0D9488]', label: 'text-[#0D9488]' },
  STR_DECISION_UPDATED: { dot: 'bg-blue-600',  label: 'text-blue-600'  },
  STR_FILED:            { dot: 'bg-green-600', label: 'text-green-600' },
}

function useSTRAuditEntries(strId) {
  return useQuery({
    queryKey: ['audit', 'str', strId],
    queryFn: async () => {
      const data = await auditApi.getAll(100)
      const items = data.items ?? data.entries ?? data
      const all = Array.isArray(items) ? items.map(normaliseAuditEntry) : []
      return all.filter((e) => e.target === strId || e.metadata?.str_id === strId)
    },
    enabled: !!strId,
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
}

export function AuditTrail({ strId }) {
  const { data: entries, isLoading } = useSTRAuditEntries(strId)

  return (
    <div className="bg-[#FFFFFF] border border-[#E8E5E0] rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-[#F0EEEA] border-b border-[#E8E5E0] flex items-center justify-between">
        <span className="text-xs text-[#8A8580] uppercase tracking-wider">Audit Trail</span>
        {!isLoading && (
          <span className="text-xs text-[#8A8580]">{entries?.length ?? 0} events</span>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6"><Spinner /></div>
      ) : !entries?.length ? (
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-[#8A8580]">No audit events recorded yet</p>
        </div>
      ) : (
        <div className="px-4 py-4 relative">
          <div className="absolute left-[23px] top-4 bottom-4 w-px bg-[#E8E5E0]" />
          <div className="space-y-4">
            {entries.map((ev) => {
              const colors = ACTION_COLORS[ev.action] ?? { dot: 'bg-[#8A8580]', label: 'text-[#6B6660]' }
              return (
                <div key={ev.id} className="flex gap-3 relative">
                  <div className={`w-3 h-3 rounded-full shrink-0 mt-0.5 ${colors.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-mono font-medium ${colors.label}`}>{ev.action}</p>
                    <p className="text-xs text-[#6B6660] mt-0.5">{ev.user}</p>
                    <p className="text-[10px] text-[#8A8580] font-mono mt-0.5">
                      {formatDateTime(ev.timestamp)}
                    </p>
                    {ev.hash && ev.hash !== '—' && (
                      <p className="text-[10px] text-[#E8E5E0] font-mono truncate mt-0.5" title={ev.hash}>
                        {ev.hash}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
