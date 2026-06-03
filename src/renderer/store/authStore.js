// Stub — auth removed (no Spotify login required)
import { create } from 'zustand'
export const useAuthStore = create(() => ({
  isAuthenticated: true,
  user: null,
  initialize: () => {},
  logout: () => {},
}))
