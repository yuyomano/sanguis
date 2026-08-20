import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import { api } from '../services/api'

interface AuthState {
  token: string | null
  donorId: string | null
  isLoading: boolean
  isRestored: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: Record<string, string>) => Promise<void>
  logout: () => Promise<void>
  restoreSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  donorId: null,
  isLoading: false,
  isRestored: false,

  restoreSession: async () => {
    const token = await SecureStore.getItemAsync('sanguis_token')
    const donorId = await SecureStore.getItemAsync('sanguis_donor_id')
    set({ token, donorId, isRestored: true })
  },

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const { data } = await api.post('/auth/donor/login', { email, password })
      await SecureStore.setItemAsync('sanguis_token', data.access_token)
      await SecureStore.setItemAsync('sanguis_donor_id', data.donor.id)
      set({ token: data.access_token, donorId: data.donor.id })
    } finally {
      set({ isLoading: false })
    }
  },

  register: async (formData) => {
    set({ isLoading: true })
    try {
      const { data } = await api.post('/auth/donor/register', formData)
      await SecureStore.setItemAsync('sanguis_token', data.access_token)
      await SecureStore.setItemAsync('sanguis_donor_id', data.donor.id)
      set({ token: data.access_token, donorId: data.donor.id })
    } finally {
      set({ isLoading: false })
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('sanguis_token')
    await SecureStore.deleteItemAsync('sanguis_donor_id')
    set({ token: null, donorId: null })
  },
}))
