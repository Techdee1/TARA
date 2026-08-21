import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { API_ORIGIN } from '@/api/client'
import { useConnectionStore } from '@/store/connectionStore'

// Render's free tier spins an idle instance down; the first request after
// a while can take 20-50s to cold-start. api/fallback.js gives every
// real screen a short, snappy timeout so the UI never just hangs — but
// that means a cold start alone is enough to drop the session into demo
// mode. This pings /health in the background with a much longer timeout,
// and if the backend answers after the fact, upgrades the session from
// demo back to live and refetches — so a slow cold start costs a few
// seconds of demo data, not the rest of the session.
const WARMUP_TIMEOUT_MS = 55000

async function ping() {
  await axios.get(`${API_ORIGIN}/health`, { timeout: WARMUP_TIMEOUT_MS })
}

// Module-level, not per-component: several components (App's boot-time
// warmup, the topbar's retry control) call this hook, but the automatic
// on-load ping should only ever fire once per session regardless of how
// many of them are mounted.
let autoAttempted = false
let sharedInFlight = false

export function useBackendWarmup({ auto = false } = {}) {
  const queryClient = useQueryClient()
  const [checking, setChecking] = useState(sharedInFlight)
  const inFlight = useRef(false)

  const attempt = () => {
    if (sharedInFlight) return
    sharedInFlight = true
    inFlight.current = true
    setChecking(true)
    ping()
      .then(() => {
        if (useConnectionStore.getState().mode === 'demo') {
          useConnectionStore.getState().setMode('live')
          queryClient.invalidateQueries({ queryKey: ['graph'] })
          queryClient.invalidateQueries({ queryKey: ['verdict'] })
        }
      })
      .catch(() => {
        // Genuinely unreachable, not just cold — every screen already has
        // a demo-data fallback, so there's nothing further to do here.
      })
      .finally(() => {
        sharedInFlight = false
        inFlight.current = false
        setChecking(false)
      })
  }

  // One automatic attempt on app load, to wake a cold instance early —
  // only the caller that opts in with `auto: true` (App.jsx) triggers this.
  useEffect(() => {
    if (auto && !autoAttempted) {
      autoAttempted = true
      attempt()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto])

  return { checking, retry: attempt }
}
