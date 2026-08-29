import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import { api } from '../services/api'

interface AuthState {
  token: string | null
  donorId: string | null
  isLoading: boolean
  isRestored: boolean
  login: (identifier: string, password: string) => Promise<void>
  register: (data: Record<string, any>) => Promise<void>
  logout: () => Promise<void>
  restoreSession: () => Promise<void>
}

function parseSubFromJwt(token: string): string | null {
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(
      decodeURIComponent(
        atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
    )
    return decoded.sub ?? null
  } catch {
    return null
  }
}

async function secureGet(key: string): Promise<string | null> {
  try { return await SecureStore.getItemAsync(key) } catch { return null }
}

async function secureSet(key: string, value: string): Promise<void> {
  try { await SecureStore.setItemAsync(key, value) } catch {}
}

async function secureDel(key: string): Promise<void> {
  try { await SecureStore.deleteItemAsync(key) } catch {}
}

async function saveTokenPair(accessToken: string, refreshToken: string): Promise<string | null> {
  const donorId = parseSubFromJwt(accessToken)
  await secureSet('sanguis_token', accessToken)
  await secureSet('sanguis_refresh_token', refreshToken)
  if (donorId) await secureSet('sanguis_donor_id', donorId)
  return donorId
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  donorId: null,
  isLoading: false,
  isRestored: false,

  restoreSession: async () => {
    const token = await secureGet('sanguis_token')
    const donorId = await secureGet('sanguis_donor_id')
    set({ token, donorId, isRestored: true })
  },

  login: async (identifier, password) => {
    set({ isLoading: true })
    try {
      const isEmail = identifier.includes('@')
      const body = isEmail ? { email: identifier, password } : { idNumber: identifier, password }
      const { data } = await api.post('/auth/donor/login', body)
      const donorId = await saveTokenPair(data.accessToken, data.refreshToken)
      set({ token: data.accessToken, donorId })
    } finally {
      set({ isLoading: false })
    }
  },

  register: async (formData) => {
    set({ isLoading: true })
    try {
      const { data } = await api.post('/auth/donor/register', formData)
      const donorId = await saveTokenPair(data.accessToken, data.refreshToken)
      set({ token: data.accessToken, donorId })
    } finally {
      set({ isLoading: false })
    }
  },

  logout: async () => {
    // Revoke the refresh token server-side before clearing local state
    const refreshToken = await secureGet('sanguis_refresh_token')
    if (refreshToken) {
      try { await api.post('/auth/logout', { refreshToken }) } catch {}
    }
    await secureDel('sanguis_token')
    await secureDel('sanguis_refresh_token')
    await secureDel('sanguis_donor_id')
    set({ token: null, donorId: null })
  },
}))
