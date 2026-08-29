import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3101'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// Attach access token on every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('sanguis_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401: try the refresh token before forcing logout
let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    // Avoid concurrent refresh attempts: queue other 401s until refresh resolves
    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push((newToken: string) => {
          original.headers.Authorization = `Bearer ${newToken}`
          resolve(api(original))
        })
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const refreshToken = await SecureStore.getItemAsync('sanguis_refresh_token')
      if (!refreshToken) throw new Error('no_refresh_token')

      const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken })
      const { accessToken, refreshToken: newRefresh } = data

      await SecureStore.setItemAsync('sanguis_token', accessToken)
      await SecureStore.setItemAsync('sanguis_refresh_token', newRefresh)

      original.headers.Authorization = `Bearer ${accessToken}`

      // Resume queued requests with the new token
      refreshQueue.forEach((cb) => cb(accessToken))
      refreshQueue = []

      return api(original)
    } catch {
      // Refresh failed — clear session
      await SecureStore.deleteItemAsync('sanguis_token')
      await SecureStore.deleteItemAsync('sanguis_refresh_token')
      await SecureStore.deleteItemAsync('sanguis_donor_id')
      refreshQueue = []
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  },
)
