import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem('cw_user') || 'null')
  )
  const [token, setToken] = useState(() =>
    localStorage.getItem('cw_token') || null
  )

  const login = (userData, tokenStr) => {
    setUser(userData)
    setToken(tokenStr)
    localStorage.setItem('cw_user', JSON.stringify(userData))
    localStorage.setItem('cw_token', tokenStr)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('cw_user')
    localStorage.removeItem('cw_token')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)