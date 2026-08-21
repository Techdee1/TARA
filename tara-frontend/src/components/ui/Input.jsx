import { cn } from '@/utils/cn'
import { forwardRef } from 'react'

export const Input = forwardRef(({ className, label, error, ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-xs text-[#6B6660] font-medium uppercase tracking-wider">{label}</label>}
    <input
      ref={ref}
      className={cn(
        'w-full bg-[#F8F7F5] border border-[#E8E5E0] rounded-lg px-3 py-2.5 text-sm text-[#1B1A17]',
        'placeholder:text-[#ACA79E] focus:outline-none focus:bg-white focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/15 transition-all',
        error && 'border-red-400 focus:border-red-500 focus:ring-red-500/15',
        className
      )}
      {...props}
    />
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
))

Input.displayName = 'Input'
