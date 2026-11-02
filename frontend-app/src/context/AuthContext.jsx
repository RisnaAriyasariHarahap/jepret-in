import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { apiFetch, clearSession, getSession, saveSession } from '../api.js'
import AuthModal from '../components/AuthModal.jsx'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(() => getSession()?.profile ?? null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('login')

  // Memastikan sesi yang tersimpan masih berlaku
  useEffect(() => {
    let cancelled = false

    async function verifySession() {
      if (!getSession()?.accessToken) return

      try {
        const result = await apiFetch('/api/auth/me')

        if (!cancelled) {
          setProfile(result.profile)
          saveSession({ ...getSession(), profile: result.profile })
        }
      } catch (error) {
        if (!cancelled && error.status === 401) {
          clearSession()
          setProfile(null)
        }
      }
    }

    verifySession()

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const result = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    saveSession({ ...result.session, profile: result.profile })
    setProfile(result.profile)
  }, [])

  const register = useCallback(async (fullName, email, password) => {
    const result = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password }),
    })

    if (result.needsConfirmation) {
      return { needsConfirmation: true, message: result.message }
    }

    saveSession({ ...result.session, profile: result.profile })
    setProfile(result.profile)

    return { needsConfirmation: false }
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // tetap keluar walaupun token sudah tidak valid
    }

    clearSession()
    setProfile(null)
  }, [])

  const updateProfile = useCallback((nextProfile) => {
    setProfile(nextProfile)
    saveSession({ ...getSession(), profile: nextProfile })
  }, [])

  const openAuth = useCallback((mode = 'login') => {
    setModalMode(mode)
    setModalOpen(true)
  }, [])

  const closeAuth = useCallback(() => {
    setModalOpen(false)
  }, [])

  const value = useMemo(
    () => ({
      profile,
      isLoggedIn: Boolean(profile),
      login,
      register,
      logout,
      updateProfile,
      openAuth,
      closeAuth,
    }),
    [profile, login, register, logout, updateProfile, openAuth, closeAuth]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}

      {modalOpen && (
        <AuthModal
          mode={modalMode}
          onModeChange={setModalMode}
          onClose={closeAuth}
          onLogin={login}
          onRegister={register}
        />
      )}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth harus dipakai di dalam AuthProvider')
  }

  return context
}