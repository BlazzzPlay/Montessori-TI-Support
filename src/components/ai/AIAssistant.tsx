import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { insforge } from '../../lib/insforge'
import type { AIMessage, Tarea } from '../../types'
import { genId } from '../../lib/utils'

interface AIAssistantProps {
  tareas: Tarea[]
}

const WELCOME_MESSAGE: AIMessage = {
  id: 'welcome', role: 'assistant', timestamp: new Date(),
  content: '👋 ¡Hola! Soy tu asistente de IA para el departamento de informática. Puedo analizar tus tareas del día, sugerir el orden más eficiente de resolución, o generar reportes para dirección. ¿En qué te ayudo hoy?'
}

export function AIAssistant({ tareas }: AIAssistantProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<AIMessage[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 300) }, [open])

  const addMsg = (role: AIMessage['role'], content: string) => {
    const msg: AIMessage = { id: genId(), role, content, timestamp: new Date() }
    setMessages(prev => [...prev, msg])
    return msg
  }

  const buildContext = (extraPrompt: string): string => {
    const pendientes = tareas.filter(t => t.estado === 'pendiente' || t.estado === 'en_progreso')
    const resueltas = tareas.filter(t => t.estado === 'resuelto' || t.estado === 'cerrado')
    return `Eres un asistente experto en soporte TI para un colegio en Chile.
Datos del sistema:
- Total tareas activas: ${pendientes.length}
- Urgentes: ${pendientes.filter(t=>t.prioridad==='urgente').length}
- Altas: ${pendientes.filter(t=>t.prioridad==='alta').length}
- Tareas resueltas esta sesión: ${resueltas.length}

Tareas pendientes/en progreso (JSON):
${JSON.stringify(pendientes.slice(0,10).map(t=>({
  id: t.id,
  titulo: t.titulo,
  prioridad: t.prioridad,
  ubicacion: t.ubicacion,
  fecha_limite: t.fecha_limite,
  etiquetas: t.etiquetas?.map(e=>e.nombre)
})), null, 2)}

${extraPrompt}`
  }

  const sendToAI = async (userText: string, systemPrompt: string) => {
    setLoading(true)
    try {
      const { data, error } = await insforge.ai.chat.completions.create({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userText }
        ],
        temperature: 0.7, maxTokens: 800
      } as Parameters<typeof insforge.ai.chat.completions.create>[0])
      if (error) throw error
      const reply = data?.choices?.[0]?.message?.content ?? 'No pude obtener respuesta. Verifica la configuración de IA en InsForge.'
      addMsg('assistant', reply)
    } catch {
      addMsg('assistant', '⚠️ El módulo de IA no está disponible en este momento. Asegúrate de que el modelo de IA esté configurado en tu proyecto InsForge (Settings → AI).')
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyze = async () => {
    addMsg('user', '📋 Analiza las tareas de hoy y recomienda el orden óptimo de resolución.')
    await sendToAI(
      'Analiza las tareas pendientes y recomieda el orden óptimo de resolución.',
      buildContext('Agrupa las tareas por pabellón/ubicación y tipo de problema para minimizar desplazamientos. Prioriza por urgencia y luego agrupa geográficamente. Responde en español, de forma clara y accionable, con bullets.')
    )
  }

  const handleReport = async () => {
    const resueltas = tareas.filter(t => t.estado === 'resuelto' || t.estado === 'cerrado')
    addMsg('user', '📄 Genera el reporte semanal de trabajo del equipo de TI.')
    await sendToAI(
      'Genera un reporte semanal ejecutivo del trabajo del equipo de TI.',
      `Eres un asistente de soporte TI escolar. Redacta un informe ejecutivo profesional en español con:
1. Resumen ejecutivo (2-3 oraciones)
2. Tareas completadas (${resueltas.length} en total)  
3. Estadísticas por categoría
4. Logros destacados
5. Pendientes para la próxima semana
Tareas resueltas: ${JSON.stringify(resueltas.slice(0,15).map(t=>({titulo:t.titulo,prioridad:t.prioridad,ubicacion:t.ubicacion,etiquetas:t.etiquetas?.map(e=>e.nombre)})))}
Dirigido a la dirección del colegio. Tono formal pero conciso.`
    )
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput('')
    addMsg('user', text)
    await sendToAI(text, buildContext('Responde de forma concisa, útil y en español.'))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <>
      {/* FAB button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            className="ai-fab"
            onClick={() => setOpen(true)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            aria-label="Abrir asistente de IA"
            title="Asistente IA"
          >
            🤖
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.aside
            className="ai-panel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            role="complementary"
            aria-label="Asistente de IA"
          >
            {/* Header */}
            <div className="ai-panel-header">
              <div>
                <div className="ai-panel-title">🤖 Asistente IA</div>
                <div className="ai-panel-subtitle">Powered by InsForge AI</div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setOpen(false)} aria-label="Cerrar asistente" style={{ color: 'rgba(255,255,255,0.7)' }}>✕</button>
            </div>

            {/* Quick Actions */}
            <div className="ai-quick-actions">
              <button className="ai-quick-btn" onClick={handleAnalyze} disabled={loading} title="Analizar orden de resolución">
                ⚡ Analizar hoy
              </button>
              <button className="ai-quick-btn" onClick={handleReport} disabled={loading} title="Generar reporte semanal">
                📄 Reporte semanal
              </button>
            </div>

            {/* Messages */}
            <div className="ai-messages" role="log" aria-live="polite" aria-label="Conversación con el asistente">
              {messages.map(msg => (
                <div key={msg.id} className={`ai-message ${msg.role}`}>
                  {msg.content}
                </div>
              ))}
              {loading && (
                <div className="ai-message assistant typing">
                  ⚙️ Procesando...
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="ai-input-bar">
              <textarea
                ref={inputRef}
                className="textarea"
                placeholder="Escribe tu consulta... (Enter = enviar)"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                rows={1}
                aria-label="Mensaje para el asistente"
              />
              <button
                className="btn btn-primary btn-icon"
                onClick={handleSend}
                disabled={!input.trim() || loading}
                aria-label="Enviar mensaje"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', flexShrink: 0 }}
              >
                ➤
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
