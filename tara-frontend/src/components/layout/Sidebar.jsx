import { NavLink } from 'react-router-dom'
import {
  Squares2X2Icon, ChartBarIcon, UserPlusIcon, Cog6ToothIcon, ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/utils/cn'
import { useUIStore } from '@/store/uiStore'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
  { to: '/dashboard', icon: Squares2X2Icon, label: 'Dashboard' },
  { to: '/graph',     icon: ChartBarIcon,   label: 'Graph Explorer' },
  { to: '/verify',    icon: UserPlusIcon,   label: 'Verify Identity' },
]

function SidebarContent({ onClose }) {
  return (
    <aside className="w-64 h-full bg-white border-r border-[#E8E5E0] flex flex-col relative overflow-hidden">
      {/* Logo area */}
      <div className="px-4 pt-5 pb-4">
        <NavLink to="/" onClick={onClose} className="flex items-center gap-2 group mb-3.5">
          <div className="w-7 h-7 rounded-lg brand-gradient-bg flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-[11px] font-bold text-white">T</span>
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-lg font-bold tracking-tight text-[#1B1A17]">TA</span>
            <span className="text-lg font-bold tracking-tight text-brand-gradient">RA</span>
          </div>
          <span className="text-[9px] text-[#ACA79E] font-mono bg-[#F0EEEA] px-1.5 py-0.5 rounded ml-auto">v1.0</span>
        </NavLink>

        {/* Track badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full brand-gradient-bg shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse shrink-0" />
          <span className="text-[9px] font-bold text-white tracking-wide uppercase">Digital Identity &amp; Trust</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-150',
              isActive
                ? 'bg-[#171613] text-white shadow-sm'
                : 'text-[#6B6660] hover:bg-[#F0EEEA] hover:text-[#1B1A17]'
            )}
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-[#0D9488]' : '')} />
                <span className="font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Trust footer card */}
      <div className="px-3 pb-3">
        <div className="rounded-xl bg-[#171613] p-3.5 text-white mb-1">
          <div className="flex items-center gap-1.5 mb-1.5">
            <ShieldCheckIcon className="w-3.5 h-3.5 text-[#0D9488]" />
            <span className="text-[10px] font-bold uppercase tracking-wide text-white/60">Verification Layer</span>
          </div>
          <p className="text-xs text-white/85 leading-snug mb-2.5">
            Every identity here passed real verification through QoreID before entering the graph.
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-[#2DD4BF] font-semibold">
            <span className="relative flex w-1.5 h-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2DD4BF] opacity-60" />
              <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-[#2DD4BF]" />
            </span>
            QoreID Connected
          </div>
        </div>

        <NavLink
          to="/settings"
          onClick={onClose}
          className={({ isActive }) => cn(
            'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all',
            isActive
              ? 'bg-[#F0EEEA] text-[#1B1A17]'
              : 'text-[#8A8580] hover:text-[#1B1A17] hover:bg-[#F0EEEA]'
          )}
        >
          <Cog6ToothIcon className="w-4 h-4" />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  )
}

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:flex shrink-0 h-screen">
        <SidebarContent />
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={toggleSidebar}
            />
            <motion.div
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="fixed left-0 top-0 h-full z-50 lg:hidden shadow-2xl"
            >
              <SidebarContent onClose={toggleSidebar} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
