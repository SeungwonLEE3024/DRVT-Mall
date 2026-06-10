import { useState, useCallback } from 'react'
import { AuthContext } from './authContext'

const TOKEN_KEY = 'drvt_token'
const USER_KEY = 'drvt_user'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(USER_KEY)
    return stored ? JSON.parse(stored) : null
  })

  const login = useCallback((authToken, authUser) => {
    localStorage.setItem(TOKEN_KEY, authToken)
    localStorage.setItem(USER_KEY, JSON.stringify(authUser))
    setToken(authToken)
    setUser(authUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  // 프로필 수정 후 변경된 유저 정보를 저장소와 상태에 반영합니다.
  const updateUser = useCallback((nextUser) => {
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
  }, [])

  return (
    <AuthContext.Provider
      value={{ token, user, login, logout, updateUser, isAuthenticated: Boolean(token) }}
    >
      {children}
    </AuthContext.Provider>
  )
}
