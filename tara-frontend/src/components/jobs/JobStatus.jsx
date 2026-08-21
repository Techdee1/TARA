import { useJob } from '@/hooks/useJobs'
import { Spinner } from '@/components/ui/Spinner'
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline'

const STATUS_CONFIG = {
  queued:     { icon: ClockIcon,        color: 'text-amber-600',  label: 'Queued' },
  processing: { icon: Spinner,          color: 'text-[#0D9488]',  label: 'Processing' },
  completed:  { icon: CheckCircleIcon,  color: 'text-green-600',  label: 'Completed' },
  failed:     { icon: XCircleIcon,      color: 'text-red-600',    label: 'Failed' },
}

export function JobStatus({ jobId }) {
  const { data: job, isLoading } = useJob(jobId)

  if (isLoading || !job) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#6B6660]">
        <Spinner className="w-4 h-4" />
        <span>Loading job…</span>
      </div>
    )
  }

  const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.queued
  const Icon = cfg.icon
  const pct = job.total_records > 0 ? Math.round((job.processed_records / job.total_records) * 100) : null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${cfg.color}`} />
        <span className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</span>
        {pct !== null && <span className="ml-auto text-xs font-mono text-[#6B6660]">{pct}%</span>}
      </div>

      {pct !== null && (
        <div className="w-full bg-[#F0EEEA] rounded-full h-1.5">
          <div
            className="bg-[#0D9488] h-1.5 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {job.total_records > 0 && (
        <p className="text-xs text-[#8A8580]">
          {job.processed_records} / {job.total_records} records
        </p>
      )}

      {job.error_message && (
        <p className="text-xs text-red-600">{job.error_message}</p>
      )}
    </div>
  )
}
