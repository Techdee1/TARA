import { create } from 'zustand'

// Tracks whether the app is currently talking to a live TARA backend or has
// fallen back to local demo data because the backend didn't answer in time
// (see api/fallback.js). Once a request fails, every API call this session
// skips the network and goes straight to demo data — fast, and it doesn't
// spend a mobile data budget retrying a backend that's already known to be
// unreachable. A fresh page load always re-tries the real backend first.
export const useConnectionStore = create((set, get) => ({
  mode: 'live', // 'live' | 'demo'
  lastSwitchedAt: null,

  setMode: (mode) => {
    if (get().mode === mode) return
    set({ mode, lastSwitchedAt: Date.now() })
  },
}))
