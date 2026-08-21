import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BellIcon, MagnifyingGlassIcon, ArrowRightOnRectangleIcon, Bars3Icon } from '@heroicons/react/24/outline'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useGraph } from '@/hooks/useGraph'
import { useConnectionStore } from '@/store/connectionStore'
import { useBackendWarmup } from '@/hooks/useBackendWarmup'

// Client-side search over the already-loaded identity graph — there is no
// server-side search endpoint for TARA, and the graph is small (~24 nodes),
// so filtering in the browser is simpler than adding a backend query param.
function useIdentitySearch(q) {
  const { data: graphData } = useGraph()
  return useMemo(() => {
    const query = q.trim().toLowerCase()
    if (query.length < 2) return []
    const nodes = graphData?.nodes ?? []
    return nodes
      .filter((n) => n.label?.toLowerCase().includes(query) || n.id.toLowerCase().includes(query))
      .slice(0, 6)
  }, [graphData, q])
}

export function TopBar() {
  const [search, setSearch] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)
  const logout = useAuthStore((s) => s.logout)
  const notifications = useUIStore((s) => s.notifications)
  const clearNotifications = useUIStore((s) => s.clearNotifications)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const connectionMode = useConnectionStore((s) => s.mode)
  const { checking, retry } = useBackendWarmup()
  const navigate = useNavigate()

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setOpen(debouncedQ.length >= 2)
  }, [debouncedQ])

  useEffect(() => {
    function handler(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const results = useIdentitySearch(debouncedQ)

  function go(path) {
    navigate(path)
    setSearch('')
    setOpen(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-[#FFFFFF] border-b border-[#E8E5E0] flex flex-col shrink-0">
      <div className="h-0.5 w-full brand-gradient-bg" />
    <div className="h-13 flex items-center px-4 lg:px-6 gap-3">
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-2 rounded-md text-[#6B6660] hover:text-[#1B1A17] hover:bg-[#F0EEEA] transition-colors"
      >
        <Bars3Icon className="w-5 h-5" />
      </button>

      <div className="flex-1 max-w-md relative" ref={wrapperRef}>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8580]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => debouncedQ.length >= 2 && setOpen(true)}
            onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
            placeholder="Search identities..."
            className="w-full bg-[#F0EEEA] border border-[#E8E5E0] rounded-md pl-9 pr-4 py-1.5 text-sm text-[#1B1A17] placeholder:text-[#8A8580] focus:outline-none focus:border-[#0D9488]/50 font-mono"
          />
        </div>

        {open && (
          <div className="absolute top-full mt-1 w-full bg-[#FFFFFF] border border-[#E8E5E0] rounded-lg shadow-xl z-50 overflow-hidden">
            {results.length === 0 ? (
              <p className="px-4 py-3 text-xs text-[#8A8580]">No results for &quot;{debouncedQ}&quot;</p>
            ) : (
              <div>
                <p className="px-4 pt-2 pb-1 text-[10px] text-[#8A8580] uppercase tracking-wider font-medium">Identities</p>
                {results.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => go(`/identities/${n.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F0EEEA] transition-colors text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-[#1B1A17] truncate">{n.label}</p>
                      <p className="text-[10px] text-[#8A8580] font-mono truncate">{n.id}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {connectionMode === 'demo' ? (
          <button
            onClick={retry}
            disabled={checking}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-colors disabled:opacity-70"
            title={
              checking
                ? 'Checking the live backend — it can take up to a minute to wake up on a cold start.'
                : "TARA's live backend didn't respond in time, so this session is running on realistic demo data. Click to try connecting again."
            }
          >
            <span className={`w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0 ${checking ? 'animate-pulse' : ''}`} />
            <span className="text-[10px] font-bold text-amber-600 tracking-wide uppercase">
              {checking ? 'Reconnecting…' : 'Demo Data · Retry'}
            </span>
          </button>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0D9488]/10 border border-[#0D9488]/30" title="Connected to TARA's live backend">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] shrink-0" />
            <span className="text-[10px] font-bold text-[#0D9488] tracking-wide uppercase">Live</span>
          </div>
        )}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full brand-gradient-bg glow-brand">
          <span className="text-[10px] font-bold text-white tracking-wide uppercase">TiT 6.0 · QoreID Track</span>
        </div>

        <button
          onClick={clearNotifications}
          className="relative p-2 rounded-md text-[#6B6660] hover:text-[#1B1A17] hover:bg-[#F0EEEA] transition-colors"
        >
          <BellIcon className="w-4 h-4" />
          {notifications > 0 && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#FF4C1D] rounded-full" />
          )}
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-[#E8E5E0]">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF4C1D]/30 to-[#9B0063]/30 border border-[#FF4C1D]/30 flex items-center justify-center">
            <span className="text-xs font-semibold text-[#FF8560]">AO</span>
          </div>
          <span className="hidden sm:block text-sm text-[#6B6660]">Akeem Jr.</span>
          <button onClick={handleLogout} className="p-1 rounded text-[#8A8580] hover:text-red-600 transition-colors ml-1" title="Logout">
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
    </header>
  )
}
