import { cn } from '@/utils/cn'

export function Card({ className, children, interactive, ...props }) {
  return (
    <div
      className={cn(
        'bg-[#FFFFFF] border border-[#E8E5E0] rounded-xl shadow-soft',
        interactive && 'hover-lift cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
