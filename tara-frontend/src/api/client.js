import axios from 'axios'

// Live TARA backend, deployed on Render's free tier. Render spins the
// instance down after a period of inactivity, so the first request after
// a while can take 20-50s to "cold start" — see useBackendWarmup.js, which
// pings this in the background on app load so a slow cold start upgrades
// the session from demo data to live without the user having to do
// anything, rather than the app just quietly staying on demo data forever.
const DEFAULT_API_BASE_URL = 'https://tara-x1mm.onrender.com/api/v1'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL
// The health endpoint lives at the API root, one level above /api/v1.
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, '')

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('grace_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('grace_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
