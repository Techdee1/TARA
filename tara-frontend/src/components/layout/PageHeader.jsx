import { useNavigate } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { cn } from '@/utils/cn'

export function PageHeader({ title, subtitle, backTo, actions, className }) {
  const navigate = useNavigate()
  return (
    <div className={cn('flex items-start justify-between mb-6', className)}>
      <div className="flex items-start gap-3">
        {backTo && (
          <button
            onClick={() => navigate(backTo)}
            className="mt-0.5 p-1.5 rounded-md text-[#8A8580] hover:text-[#1B1A17] hover:bg-[#F0EEEA] transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
        )}
        <div>
          <h1 className="text-xl font-semibold text-[#1B1A17]">{title}</h1>
          {subtitle && <p className="text-sm text-[#6B6660] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
