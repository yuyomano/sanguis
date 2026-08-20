import { create } from 'zustand'
import { api } from '../services/api'
import { Donor } from '../types'

interface DonorState {
  profile: Donor | null
  isLoading: boolean
  fetchProfile: () => Promise<void>
  clearProfile: () => void
}

export const useDonorStore = create<DonorState>((set) => ({
  profile: null,
  isLoading: false,

  fetchProfile: async () => {
    set({ isLoading: true })
    try {
      const { data } = await api.get('/donors/me')
      set({ profile: data })
    } catch {
      // token might be invalid
    } finally {
      set({ isLoading: false })
    }
  },

  clearProfile: () => set({ profile: null }),
}))
