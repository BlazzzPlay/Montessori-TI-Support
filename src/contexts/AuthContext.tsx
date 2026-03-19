import {
  createContext, useContext, useState, useEffect, useCallback, type ReactNode
} from 'react'
import { insforge } from '../lib/insforge'
import type { UserProfile } from '../types'

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (insforge.auth as any).getCurrentSession()
        if (data?.user) {
          setUser({
            id: data.user.id,
            email: data.user.email,
            nombre: data.user.email?.split('@')[0] ?? 'Usuario',
            rol: 'tecnico'
          })
        }
      } catch {
        // No session — that's fine
      } finally {
        setLoading(false)
      }
    }
    checkSession()
  }, [])

  const signIn = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const { data, error } = await insforge.auth.signInWithPassword({ email, password })
      if (error) return { error: 'Credenciales incorrectas. Verifica tu email y contraseña.' }
      if (data?.user) {
        setUser({
          id: data.user.id,
          email: data.user.email,
          nombre: data.user.email?.split('@')[0] ?? 'Usuario',
          rol: 'tecnico'
        })
      }
      return {}
    } catch {
      return { error: 'Error de conexión. Intenta nuevamente.' }
    }
  }, [])

  const signOut = useCallback(async () => {
    await insforge.auth.signOut()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
