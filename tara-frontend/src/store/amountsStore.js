import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// TARA's backend doesn't (and shouldn't have to) store a requested-amount
// field on an identity — it's a frontend-only framing device: what a
// lender or marketplace has at stake in this specific verification. This
// keeps a local, per-browser map of identity_id -> amount for identities
// verified live through this app, so the figure survives a refresh
// without any backend change. The demo dataset (src/mocks/identityMocks.js)
// carries its own amounts directly and doesn't need this.
export const useAmountsStore = create(
  persist(
    (set) => ({
      amounts: {},
      setAmount: (identityId, amount) =>
        set((s) => ({ amounts: { ...s.amounts, [identityId]: amount } })),
    }),
    { name: 'tara-requested-amounts' }
  )
)
