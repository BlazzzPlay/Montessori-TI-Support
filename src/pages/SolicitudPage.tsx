import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { insforge } from '../lib/insforge'
import { PRIORIDAD_OPTIONS } from '../components/ui/Badges'

export function SolicitudPage() {
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    solicitante: '',
    ubicacion: '',
    prioridad: 'media',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.titulo.trim() || !form.solicitante.trim()) {
      setError('El título y el solicitante son requeridos.')
      return
    }
    setLoading(true)
    setError('')
    try {
      if (!import.meta.env.VITE_INSFORGE_ANON_KEY) {
        await new Promise(r => setTimeout(r, 600))
        setSuccess(true)
        return
      }

      const { error: insertError } = await insforge.database.from('tareas').insert([{
        titulo: form.titulo,
        descripcion: form.descripcion,
        solicitante: form.solicitante,
        ubicacion: form.ubicacion,
        prioridad: form.prioridad,
        estado: 'solicitud',
        mostrar_auditoria: false,
        fecha_limite: null
      }])

      if (insertError) {
        console.error('Insert error obj:', insertError)
        throw new Error(JSON.stringify(insertError))
      }
      setSuccess(true)
    } catch (err: any) {
      console.error('Detalle error en catch:', err)
      setError(err?.message ? `Error BD: ${err.message}` : 'Ocurrió un error al enviar la solicitud.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-default)', maxWidth: 460 }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>¡Solicitud enviada!</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Tu requerimiento ha sido ingresado al sistema. El departamento de Informática lo revisará y procesará pronto.</p>
          <button className="btn btn-secondary" style={{ marginTop: '2rem' }} onClick={() => { setSuccess(false); setForm({ titulo: '', descripcion: '', solicitante: '', ubicacion: '', prioridad: 'media' }) }}>
            Enviar otra solicitud
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', background: 'var(--bg-base)',
      backgroundImage: 'radial-gradient(ellipse at 50% -20%, rgba(37,99,235,0.12) 0%, transparent 60%)'
    }}>
      <div style={{ width: '100%', maxWidth: 540, margin: '0 auto', padding: '3rem 1.5rem' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🖥️</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>Soporte TI <span style={{color:'var(--brand-500)'}}>Montessori</span></h1>
          <p style={{ color: 'var(--text-secondary)' }}>Ingresa tu requerimiento o incidencia técnica</p>
        </div>

        <motion.form 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          onSubmit={handleSubmit}
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '2rem', boxShadow: 'var(--shadow-lg)' }}
        >
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label required" htmlFor="titulo">¿Qué necesitas?</label>
            <input id="titulo" className="input" type="text" placeholder="Ej: Proyector no enciende..." value={form.titulo} onChange={set('titulo')} maxLength={120} />
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label required" htmlFor="solicitante">Tu Nombre / Cargo</label>
            <input id="solicitante" className="input" type="text" placeholder="Ej: Prof. Juan Pérez" value={form.solicitante} onChange={set('solicitante')} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="ubicacion">Ubicación</label>
              <input id="ubicacion" className="input" type="text" placeholder="Ej: Sala A-203" value={form.ubicacion} onChange={set('ubicacion')} />
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="prioridad">Prioridad sugerida</label>
              <select id="prioridad" className="select" value={form.prioridad} onChange={set('prioridad')}>
                {PRIORIDAD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" htmlFor="descripcion">Detalles adicionales</label>
            <textarea id="descripcion" className="textarea" placeholder="Explica brevemente el problema..." value={form.descripcion} onChange={set('descripcion')} rows={4} maxLength={1000} />
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: '0.75rem', color: '#EF4444', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              ⚠ {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', fontSize: '1rem' }} disabled={loading}>
            {loading ? '⏳ Enviando...' : '🚀 Enviar Solicitud'}
          </button>
        </motion.form>
      </div>
    </div>
  )
}
