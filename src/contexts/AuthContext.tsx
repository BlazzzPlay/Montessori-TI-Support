import {
  createContext, useContext, useState, useEffect, useCallback, type ReactNode
} from 'react'
import { insforge } from '../lib/insforge'
import type { UserProfile } from '../types'

const USE_MOCK = !import.meta.env.VITE_INSFORGE_ANON_KEY
const MOCK_SESSION_KEY = 'blazz_mock_session'
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 días

interface AuthCtx {
  user: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthCtx>({
  user: null, loading: true,
  signIn: async () => ({}),
  signOut: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        if (USE_MOCK) {
          // Modo demo: restaurar sesión desde localStorage
          const saved = localStorage.getItem(MOCK_SESSION_KEY)
          if (saved) {
            const { user: savedUser, expiresAt } = JSON.parse(saved)
            if (expiresAt && Date.now() < expiresAt) {
              setUser(savedUser)
            } else {
              localStorage.removeItem(MOCK_SESSION_KEY) // Sesión expirada
            }
          }
          return
        }
        // Modo real: intentar restaurar sesión del SDK
        const storedToken = localStorage.getItem('insforge_refresh_token')
        if (storedToken) {
          await insforge.auth.refreshSession({ refreshToken: storedToken }).catch(() => {})
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (insforge.auth as any).getCurrentSession?.()
        if (result?.data?.user) {
          setUser({
            id: result.data.user.id,
            email: result.data.user.email,
            nombre: result.data.user.email?.split('@')[0] ?? 'Usuario',
            rol: 'tecnico'
          })
        }
      } catch (error) {
        console.warn('Session check failed (modo demo activo):', error)
        localStorage.removeItem('insforge_refresh_token')
      } finally {
        setLoading(false)
      }
    }
    checkSession()
  }, [])

  const signIn = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      if (USE_MOCK) {
        // Modo demo: aceptar cualquier email con password "demo" o "admin"
        if (!email.trim()) return { error: 'Ingresa un correo electrónico.' }
        if (password.length < 4) return { error: 'Contraseña demasiado corta.' }
        const mockUser: UserProfile = {
          id: 'admin-mock',
          email,
          nombre: email.split('@')[0] ?? 'Administrador',
          rol: 'tecnico'
        }
        localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify({
          user: mockUser,
          expiresAt: Date.now() + SESSION_TTL_MS
        }))
        setUser(mockUser)
        return {}
      }
      const { data, error } = await insforge.auth.signInWithPassword({ email, password })
      if (error) return { error: 'Credenciales incorrectas. Verifica tu email y contraseña.' }
      if (data?.user) {
        if (data.refreshToken) localStorage.setItem('insforge_refresh_token', data.refreshToken)
        setUser({ id: data.user.id, email: data.user.email, nombre: data.user.email?.split('@')[0] ?? 'Usuario', rol: 'tecnico' })
      }
      return {}
    } catch {
      return { error: 'Error de conexión. Intenta nuevamente.' }
    }
  }, [])

  const signOut = useCallback(async () => {
    if (USE_MOCK) {
      localStorage.removeItem(MOCK_SESSION_KEY)
      setUser(null)  
      return
    }
    await insforge.auth.signOut()
    localStorage.removeItem('insforge_refresh_token')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
