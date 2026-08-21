import { cn } from '@/utils/cn'

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse bg-[#F0EEEA] rounded', className)} />
}
