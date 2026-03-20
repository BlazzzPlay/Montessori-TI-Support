import { useState, useEffect, useCallback } from 'react'
import { insforge } from '../lib/insforge'
import { MOCK_TAREAS, MOCK_ETIQUETAS } from '../mocks/tareas'
import type { Tarea, Etiqueta, TareaFormData } from '../types'
import { genId } from '../lib/utils'

// Use mocks when no API key configured (dev/demo mode)
const USE_MOCK = !import.meta.env.VITE_INSFORGE_ANON_KEY

export function useTareas() {
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTareas = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 600)) // Simulate network
        setTareas(MOCK_TAREAS)
        setEtiquetas(MOCK_ETIQUETAS)
        return
      }
      const [tareasRes, etiquetasRes] = await Promise.all([
        insforge.database.from('tareas').select('*, tarea_etiquetas(etiqueta_id, etiquetas(*))'),
        insforge.database.from('etiquetas').select('*')
      ])
      if (tareasRes.error) throw tareasRes.error
      if (etiquetasRes.error) throw etiquetasRes.error

      // Normalize etiquetas nested by InsForge
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const normalized = (tareasRes.data ?? []).map((t: any) => ({
        ...t,
        etiquetas: t.tarea_etiquetas?.map((te: any) => te.etiquetas).filter(Boolean) ?? []
      }))
      setTareas(normalized)
      setEtiquetas(etiquetasRes.data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar tareas')
      setTareas(MOCK_TAREAS) // Fallback to mocks
      setEtiquetas(MOCK_ETIQUETAS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTareas() }, [fetchTareas])

  const createTarea = useCallback(async (form: TareaFormData): Promise<{ error?: string }> => {
    try {
      if (USE_MOCK) {
        const nueva: Tarea = {
          id: genId(), ...form, estado: form.estado || 'pendiente',
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
          etiquetas: etiquetas.filter(e => form.etiqueta_ids.includes(e.id))
        }
        setTareas(prev => [nueva, ...prev])
        return {}
      }
      const { data, error } = await insforge.database.from('tareas').insert([{
        titulo: form.titulo, descripcion: form.descripcion,
        solicitante: form.solicitante, ubicacion: form.ubicacion,
        prioridad: form.prioridad,
        fecha_limite: form.fecha_limite || null,
        mostrar_auditoria: form.mostrar_auditoria ?? true,
        estado: form.estado || 'pendiente',
        progreso: form.progreso || 0,
        mostrar_progreso: form.mostrar_progreso || false,
        subtareas: form.subtareas || []
      }]).select()
      if (error) return { error: error.message }
      const tareaId = data?.[0]?.id
      if (tareaId && form.etiqueta_ids.length > 0) {
        await insforge.database.from('tarea_etiquetas').insert(
          form.etiqueta_ids.map(eid => ({ tarea_id: tareaId, etiqueta_id: eid }))
        )
      }
      await fetchTareas()
      return {}
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Error al crear tarea' }
    }
  }, [etiquetas, fetchTareas])

  const updateTarea = useCallback(async (id: string, updates: any): Promise<{ error?: string }> => {
    try {
      if (USE_MOCK) {
        setTareas(prev => prev.map(t => t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t))
        return {}
      }

      const { etiqueta_ids, etiquetas, ...rest } = updates
      
      const { error } = await insforge.database.from('tareas').update({ 
        ...rest, 
        updated_at: new Date().toISOString() 
      }).eq('id', id)
      if (error) return { error: error.message }

      // Update tags if provided
      if (Array.isArray(etiqueta_ids)) {
        await insforge.database.from('tarea_etiquetas').delete().eq('tarea_id', id)
        if (etiqueta_ids.length > 0) {
          await insforge.database.from('tarea_etiquetas').insert(
            etiqueta_ids.map((eid: string) => ({ tarea_id: id, etiqueta_id: eid }))
          )
        }
      }

      await fetchTareas()
      return {}
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Error al actualizar tarea' }
    }
  }, [fetchTareas])

  const deleteTarea = useCallback(async (id: string): Promise<{ error?: string }> => {
    try {
      if (USE_MOCK) {
        setTareas(prev => prev.filter(t => t.id !== id))
        return {}
      }
      const { error } = await insforge.database.from('tareas').delete().eq('id', id)
      if (error) return { error: error.message }
      await fetchTareas()
      return {}
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Error al eliminar tarea' }
    }
  }, [fetchTareas])

  return { tareas, etiquetas, loading, error, refetch: fetchTareas, createTarea, updateTarea, deleteTarea }
}
