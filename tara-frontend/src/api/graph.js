import { apiClient } from './client'
import { withFallback } from './fallback'
import { getMockGraph } from '@/mocks/identityMocks'

export const graphApi = {
  getFullGraph: () =>
    withFallback(
      () => apiClient.get('/graph').then((r) => r.data),
      () => getMockGraph()
    ),
}
