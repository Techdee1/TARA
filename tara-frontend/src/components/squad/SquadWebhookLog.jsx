import { formatDateTime } from '@/utils/formatters'
import { Spinner } from '@/components/ui/Spinner'
import { useSquadWebhookEvents } from '@/hooks/useSquad'
import { ExclamationCircleIcon } from '@heroicons/react/24/outline'

export function SquadWebhookLog() {
  const { data: events, isLoading, isError } = useSquadWebhookEvents()

  return (
    <div className="bg-[#FFFFFF] border border-[#E8E5E0] rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-[#E8E5E0] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-xs text-[#8A8580] uppercase tracking-wider font-medium">Webhook Events</p>
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        </div>
        <span className="text-xs text-[#8A8580]">{events?.length ?? 0} events</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : isError ? (
        <div className="flex flex-col items-center py-10 gap-2">
          <ExclamationCircleIcon className="w-6 h-6 text-red-600" />
          <p className="text-xs text-red-600">Failed to load webhook events</p>
        </div>
      ) : !events?.length ? (
        <div className="py-10 text-center">
          <p className="text-sm text-[#6B6660]">No webhook events yet</p>
          <p className="text-xs text-[#8A8580] mt-1">Inbound Squad webhooks will appear here</p>
        </div>
      ) : (
        <div className="divide-y divide-[#E8E5E0] max-h-[320px] overflow-y-auto">
          {events.map((ev) => (
            <div key={ev.id} className="px-4 py-3 hover:bg-[#F0EEEA] transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-blue-600">{ev.action}</span>
                <span className="text-[10px] text-[#8A8580] font-mono">{formatDateTime(ev.timestamp)}</span>
              </div>
              <p className="text-xs text-[#6B6660] font-mono truncate" title={ev.target}>
                {ev.target}
              </p>
              {ev.hash && ev.hash !== '—' && (
                <p className="text-[10px] text-[#8A8580] font-mono truncate mt-0.5" title={ev.hash}>
                  Hash: {ev.hash}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
