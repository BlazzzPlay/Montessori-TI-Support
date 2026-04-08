import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Completa todos los campos.'); return }
    setLoading(true)
    setError('')
    const result = await signIn(email, password)
    setLoading(false)
    if (result.error) setError(result.error)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', background: 'var(--bg-base)',
      backgroundImage: 'radial-gradient(ellipse at 30% 20%, rgba(37,99,235,0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(124,58,237,0.08) 0%, transparent 50%)'
    }}>
      {/* Left panel - branding */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          flex: 1, display: 'none', flexDirection: 'column', justifyContent: 'center',
          padding: '3rem', background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(124,58,237,0.06))',
          borderRight: '1px solid var(--border-subtle)'
        }}
        className="login-branding"
      >
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🖥️</div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.75rem', lineHeight: 1.2 }}>
          Soporte TI<br />
          <span style={{ backgroundImage: 'linear-gradient(135deg, #2563EB, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Montessori
          </span>
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 380 }}>
          Sistema de gestión de requerimientos y tickets de soporte para el departamento de informática del colegio.
        </p>
        <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {(['📋 Gestión de tickets estilo Kanban', '📺 Panel de TV con vista en tiempo real', '🤖 Asistente de IA integrado', '📊 Dashboard de auditoría con gráficos']).map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand-500)', flexShrink: 0 }} />
              {f}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Right panel - login form */}
      <div style={{ flex: '0 0 auto', width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-xl)',
            padding: '2.25rem',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '2rem' }}>
            <div style={{ width: 46, height: 46, background: 'linear-gradient(135deg, var(--brand-600), var(--brand-800))', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.375rem', boxShadow: 'var(--shadow-brand)' }}>
              🖥️
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--text-primary)' }}>Soporte TI</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Colegio Montessori</div>
            </div>
          </div>

          <h2 style={{ fontWeight: 700, fontSize: '1.375rem', marginBottom: '0.375rem' }}>Iniciar sesión</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
            Ingresa con tu cuenta del sistema educativo.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label required" htmlFor="email">Correo electrónico</label>
              <input
                id="email" type="email" className="input" autoComplete="email" autoFocus
                placeholder="usuario@colegio.cl"
                value={email} onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label required" htmlFor="password">Contraseña</label>
              <input
                id="password" type="password" className="input" autoComplete="current-password"
                placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: '0.75rem', color: '#EF4444', fontSize: '0.875rem' }}>
                ⚠ {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
              {loading ? '⏳ Iniciando sesión...' : '🚀 Acceder al sistema'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            💡 <strong style={{ color: 'var(--brand-500)' }}>Modo demo activo:</strong> Ingresa cualquier email y una contraseña de al menos 4 caracteres para acceder con datos de muestra.
          </div>
        </motion.div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          ¿Sin acceso? Contacta al administrador del departamento TI.
        </p>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .login-branding { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
