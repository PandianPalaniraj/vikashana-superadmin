import { create } from 'zustand'
import api from '../api/client'

const stored = localStorage.getItem('superadmin_user')

const useAuthStore = create((set) => ({
  user:  stored ? JSON.parse(stored) : null,
  token: localStorage.getItem('superadmin_token') || null,

  login: async (email, password) => {
    const res = await api.post('auth/login', { login: email, password })
    const { token, user } = res.data.data
    localStorage.setItem('superadmin_token', token)
    localStorage.setItem('superadmin_user', JSON.stringify(user))
    set({ token, user })
    return user
  },

  logout: () => {
    localStorage.removeItem('superadmin_token')
    localStorage.removeItem('superadmin_user')
    set({ token: null, user: null })
  },
}))

export default useAuthStore
