import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Toast, ToastType } from '../types'
import { genId } from '../lib/utils'

// ---- Theme Context ----
interface ThemeCtx { theme: 'dark' | 'light'; toggleTheme: () => void }
const ThemeContext = createContext<ThemeCtx>({ theme: 'dark', toggleTheme: () => {} })
export const useTheme = () => useContext(ThemeContext)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('tb-theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('tb-theme', next)
      document.documentElement.setAttribute('data-theme', next)
      return next
    })
  }, [])

  // Apply on mount
  document.documentElement.setAttribute('data-theme', theme)

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// ---- Toast Context ----
interface ToastCtx { toasts: Toast[]; addToast: (msg: string, type?: ToastType) => void; removeToast: (id: string) => void }
const ToastContext = createContext<ToastCtx>({ toasts: [], addToast: () => {}, removeToast: () => {} })
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = genId()
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => removeToast(id), 4000)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type} animate-slide-in`}>
            <span style={{ fontSize: '1.125rem' }}>
              {t.type === 'success' ? '✓' : t.type === 'error' ? '✗' : 'ℹ'}
            </span>
            <span style={{ flex: 1, fontSize: '0.875rem' }}>{t.message}</span>
            <button onClick={() => removeToast(t.id)} className="btn btn-ghost btn-icon btn-sm" style={{ flexShrink: 0 }}>✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
