import { apiClient } from './client'
import { withFallback } from './fallback'
import { mockVerifyIdentity, getMockVerdict } from '@/mocks/identityMocks'

// Response shape for POST /identities/verify:
// { status: 'verified' | 'rejected', identity_id, qoreid_raw, reason }
// Response shape for GET /verdict/{id}:
// { identity_id, trust_score, verdict, evidence: [], explanation }
//
// Every method falls back to the local demo engine (src/mocks/identityMocks.js)
// if the real backend doesn't answer in time — see api/fallback.js.
export const identitiesApi = {
  verify: (payload) =>
    withFallback(
      () => apiClient.post('/identities/verify', payload).then((r) => r.data),
      () => mockVerifyIdentity(payload)
    ),
  getVerdict: (identityId) =>
    withFallback(
      () => apiClient.get(`/verdict/${identityId}`).then((r) => r.data),
      () => getMockVerdict(identityId)
    ),
}
