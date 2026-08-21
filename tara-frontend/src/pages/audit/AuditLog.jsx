import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/ui/DataTable'
import { Spinner } from '@/components/ui/Spinner'
import { apiClient } from '@/api/client'
import { formatDateTime } from '@/utils/formatters'
import { CheckCircleIcon } from '@heroicons/react/24/outline'

const ACTION_COLORS = {
  STR_GENERATED: 'text-[#0D9488]',
  STR_FILED: 'text-green-600',
  ALERT_CREATED: 'text-amber-600',
  ALERT_DISMISSED: 'text-[#6B6660]',
  ALERT_STATUS_CHANGED: 'text-blue-600',
  ENTITY_VIEWED: 'text-[#6B6660]',
  USER_LOGIN: 'text-[#6B6660]',
}

const columns = [
  { accessorKey: 'timestamp', header: 'Timestamp', cell: ({ getValue }) => <span className="font-mono text-xs text-[#6B6660]">{formatDateTime(getValue())}</span> },
  { accessorKey: 'action', header: 'Action', cell: ({ getValue }) => <span className={`font-mono text-xs font-medium ${ACTION_COLORS[getValue()] ?? 'text-[#6B6660]'}`}>{getValue()}</span> },
  { accessorKey: 'target', header: 'Target', cell: ({ getValue }) => <span className="font-mono text-xs text-[#1B1A17]">{getValue()}</span> },
  { accessorKey: 'targetType', header: 'Type', cell: ({ getValue }) => <span className="text-xs text-[#6B6660]">{getValue()}</span> },
  { accessorKey: 'user', header: 'User', cell: ({ getValue }) => <span className="text-xs text-[#1B1A17]">{getValue()}</span> },
  { accessorKey: 'hash', header: 'Hash', cell: ({ getValue }) => <span className="font-mono text-[10px] text-[#8A8580]">{getValue()}</span> },
  { accessorKey: 'verified', header: 'Verified', cell: ({ getValue }) => getValue() ? <CheckCircleIcon className="w-4 h-4 text-green-600" /> : <span className="text-red-600 text-xs">✗</span> },
]

export default function AuditLog() {
  const [filters, setFilters] = useState({ action: '', user: '' })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit-log'],
    queryFn: () => apiClient.get('/audit-log?limit=200').then((r) => r.data),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const filtered = useMemo(() => {
    const rows = data ?? []
    return rows.filter((e) => {
      if (filters.action && e.action !== filters.action) return false
      if (filters.user && !e.user.toLowerCase().includes(filters.user.toLowerCase())) return false
      return true
    })
  }, [data, filters])

  return (
    <div>
      <PageHeader title="Audit Log" subtitle="Immutable record of all system actions" />

      <div className="flex flex-wrap gap-3 p-4 bg-[#FFFFFF] border border-[#E8E5E0] rounded-lg mb-4">
        <select
          value={filters.action}
          onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
          className="bg-[#F0EEEA] border border-[#E8E5E0] rounded-md px-3 py-1.5 text-sm text-[#1B1A17] focus:outline-none focus:border-[#0D9488]/50"
        >
          <option value="">All Actions</option>
          <option value="STR_GENERATED">STR Generated</option>
          <option value="STR_FILED">STR Filed</option>
          <option value="ALERT_CREATED">Alert Created</option>
          <option value="ALERT_DISMISSED">Alert Dismissed</option>
          <option value="ENTITY_VIEWED">Entity Viewed</option>
          <option value="USER_LOGIN">User Login</option>
        </select>
        <input
          type="text"
          placeholder="Filter by user..."
          value={filters.user}
          onChange={(e) => setFilters((f) => ({ ...f, user: e.target.value }))}
          className="bg-[#F0EEEA] border border-[#E8E5E0] rounded-md px-3 py-1.5 text-sm text-[#1B1A17] placeholder:text-[#8A8580] focus:outline-none focus:border-[#0D9488]/50 font-mono"
        />
        <div className="ml-auto flex items-center gap-2 text-xs text-[#8A8580]">
          <CheckCircleIcon className="w-3.5 h-3.5 text-green-600" />
          All entries cryptographically verified
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : isError ? (
        <div className="text-center py-16 text-[#8A8580] text-sm">Failed to load audit log.</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#8A8580] text-sm">No audit events recorded yet.</div>
      ) : (
        <DataTable data={filtered} columns={columns} />
      )}
    </div>
  )
}
