import { cn } from '@/utils/cn'
import { forwardRef } from 'react'

const variants = {
  primary:   'bg-[#0D9488] text-white font-semibold shadow-sm hover:bg-[#0C8377] hover:shadow-md',
  secondary: 'bg-[#F0EEEA] border border-[#E8E5E0] text-[#1B1A17] hover:bg-white hover:border-[#D8D4CC]',
  outline:   'bg-white border border-[#E8E5E0] text-[#1B1A17] hover:bg-[#F0EEEA] hover:border-[#D8D4CC]',
  danger:    'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100',
  ghost:     'text-[#6B6660] hover:text-[#1B1A17] hover:bg-[#F0EEEA]',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-xl',
}

export const Button = forwardRef(({ className, variant = 'secondary', size = 'md', loading, children, disabled, ...props }, ref) => (
  <button
    ref={ref}
    disabled={disabled || loading}
    className={cn(
      'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 cursor-pointer active:scale-[0.98]',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
      variants[variant], sizes[size], className
    )}
    {...props}
  >
    {loading && (
      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    )}
    {children}
  </button>
))

Button.displayName = 'Button'
