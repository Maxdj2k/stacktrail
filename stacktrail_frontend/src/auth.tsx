import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import * as api from '@/api/client'

const AuthContext = createContext<{
  token: string | null
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, email?: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
} | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('access'))

  useEffect(() => {
    const handler = () => setToken(null)
    window.addEventListener('stacktrail:unauthorized', handler)
    return () => window.removeEventListener('stacktrail:unauthorized', handler)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const data = await api.login(username, password)
    setToken(data.access)
  }, [])

  const register = useCallback(async (username: string, password: string, email?: string) => {
    const data = await api.register(username, password, email)
    setToken(data.access)
  }, [])

  const logout = useCallback(() => {
    api.logout()
    setToken(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        token,
        login,
        register,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
