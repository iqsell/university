import { useState } from 'react'

export function useAuth() {
  const [token, setToken] = useState(localStorage.getItem('access_token') || '')

  const login = (access: string) => {
    localStorage.setItem('access_token', access)
    setToken(access)
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setToken('')
  }

  return { token, login, logout }
}