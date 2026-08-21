import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from '@/router'
import { taraAudio } from '@/lib/taraAudio'
import { useBackendWarmup } from '@/hooks/useBackendWarmup'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

function AudioArmer() {
  useEffect(() => {
    // Browsers block audio until a real user gesture — this arms the
    // shared AudioContext on the very first click/tap/keypress anywhere in
    // the app, so every sound effect after that point can just play
    // without each call site needing to know about the gesture rule.
    const arm = () => {
      taraAudio.init()
      window.removeEventListener('pointerdown', arm)
      window.removeEventListener('keydown', arm)
    }
    window.addEventListener('pointerdown', arm)
    window.addEventListener('keydown', arm)
    return () => {
      window.removeEventListener('pointerdown', arm)
      window.removeEventListener('keydown', arm)
    }
  }, [])
  return null
}

function BackendWarmup() {
  // Pings the live backend in the background on load (and lets the
  // connection badge retry it) — see useBackendWarmup.js. Rendered here,
  // inside QueryClientProvider, because it needs useQueryClient() to
  // refetch once a cold backend wakes up.
  useBackendWarmup({ auto: true })
  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AudioArmer />
      <BackendWarmup />
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
