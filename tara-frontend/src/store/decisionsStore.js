import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// TARA's whole design principle is that it never decides on its own — the
// highest-confidence verdict it produces is "needs review," and a human
// makes the actual Approve/Reject call. There's no backend endpoint for
// that decision (out of scope for this build), so it's recorded locally,
// per browser, keyed by identity_id — enough to demo the human-in-the-loop
// step end to end without a review-queue backend.
export const useDecisionsStore = create(
  persist(
    (set, get) => ({
      decisions: {},
      setDecision: (identityId, decision, reviewer) =>
        set((s) => ({
          decisions: {
            ...s.decisions,
            [identityId]: { decision, reviewer, decidedAt: new Date().toISOString() },
          },
        })),
      clearDecision: (identityId) =>
        set((s) => {
          const next = { ...s.decisions }
          delete next[identityId]
          return { decisions: next }
        }),
      getDecision: (identityId) => get().decisions[identityId],
    }),
    { name: 'tara-review-decisions' }
  )
)
