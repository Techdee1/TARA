import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { cn } from '@/utils/cn'

function AnimatedNumber({ value }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => {
    if (typeof value === 'string') return value
    return Math.round(v).toLocaleString()
  })
  const ref = useRef(null)

  useEffect(() => {
    if (typeof value !== 'number') return
    const controls = animate(count, value, { duration: 1, ease: 'easeOut' })
    return controls.stop
  }, [value])

  if (typeof value === 'string') return <span>{value}</span>
  return <motion.span>{rounded}</motion.span>
}

// variant="dark" renders a bold, near-black "hero" card — the same
// spotlight pattern a light dashboard often uses for its single most
// important number, so it doesn't get lost among otherwise-identical
// white metric cards.
export function MetricCard({ label, value, delta, deltaPositive, accent, note, variant = 'light' }) {
  const accentDot = {
    high:   'bg-red-500',
    medium: 'bg-amber-500',
    low:    'bg-green-500',
    accent: 'bg-[#0D9488]',
  }

  const isDark = variant === 'dark'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'rounded-xl p-4 border shadow-soft hover-lift',
        isDark
          ? 'bg-[#171613] border-[#171613] text-white'
          : 'bg-white border-[#E8E5E0] text-[#1B1A17]'
      )}
    >
      <div className="flex items-center gap-1.5 mb-2">
        {accent && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', accentDot[accent])} />}
        <p className={cn('text-xs uppercase tracking-widest font-medium', isDark ? 'text-white/50' : 'text-[#8A8580]')}>
          {label}
        </p>
      </div>
      <p className={cn('text-3xl font-semibold font-mono', isDark ? 'text-white' : 'text-[#1B1A17]')}>
        <AnimatedNumber value={value} />
      </p>
      {delta && (
        <p className={cn('text-xs mt-1.5 font-medium', deltaPositive ? 'text-green-600' : 'text-red-600')}>
          {deltaPositive ? '↑' : '↓'} {delta} vs yesterday
        </p>
      )}
      {note && !delta && (
        <p className={cn('text-xs mt-1.5', isDark ? 'text-white/40' : 'text-[#8A8580]')}>{note}</p>
      )}
    </motion.div>
  )
}
