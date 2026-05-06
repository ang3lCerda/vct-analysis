import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AuthContextValue {
  token: string | null
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>({
  token: null,
  login: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('vct_token'))

  const login = (t: string) => {
    localStorage.setItem('vct_token', t)
    setToken(t)
  }

  const logout = () => {
    localStorage.removeItem('vct_token')
    setToken(null)
  }

  return <AuthContext.Provider value={{ token, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
