import { useConnectionStore } from '@/store/connectionStore'

// Render's free tier can take 20-50s to cold-start an idle instance, but
// making every screen wait that long would feel broken. This timeout is a
// deliberate middle ground: long enough to succeed against an
// already-warm backend, short enough that a cold one falls back to demo
// data quickly instead of hanging. useBackendWarmup.js pings the backend
// in the background with a much longer timeout in parallel, so a slow
// cold start still upgrades the session to live once it finishes — see
// that file for the recovery half of this story.
const DEFAULT_TIMEOUT_MS = 9000

// Runs a real API call with a timeout; if it's already known to have
// failed this session, times out, or errors, transparently resolves with
// locally-computed demo data instead of rejecting.
//
// This is what keeps the product usable at a venue with flaky wifi or a
// backend that's momentarily unreachable: every screen that depends on
// live data keeps working, just against a realistic local dataset, and
// the UI is told which mode it's in (connectionStore) so it can say so
// honestly rather than silently pretending everything is live.
export async function withFallback(realCall, fallbackCall, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const { mode, setMode } = useConnectionStore.getState()

  if (mode === 'demo') return fallbackCall()

  try {
    const result = await Promise.race([
      realCall(),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('TARA backend did not respond in time')), timeoutMs)
      }),
    ])
    setMode('live')
    return result
  } catch {
    setMode('demo')
    return fallbackCall()
  }
}
