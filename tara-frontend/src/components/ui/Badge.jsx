import { cn } from '@/utils/cn'

export function Badge({ children, className }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-[#E8E5E0] bg-[#F0EEEA] text-[#6B6660]', className)}>
      {children}
    </span>
  )
}
