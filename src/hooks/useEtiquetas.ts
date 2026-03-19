import { useState, useCallback } from 'react'
import { insforge } from '../lib/insforge'
import { MOCK_ETIQUETAS } from '../mocks/tareas'
import { genId } from '../lib/utils'
import type { Etiqueta } from '../types'

const USE_MOCK = !import.meta.env.VITE_INSFORGE_ANON_KEY

export function useEtiquetas(initialEtiquetas: Etiqueta[], refetchParent?: () => void) {
  const [loading, setLoading] = useState(false)

  const createEtiqueta = useCallback(async (fields: Omit<Etiqueta, 'id'>): Promise<{ error?: string }> => {
    setLoading(true)
    try {
      if (USE_MOCK) {
        MOCK_ETIQUETAS.push({ id: genId(), ...fields })
        refetchParent?.()
        return {}
      }
      const { error } = await insforge.database.from('etiquetas').insert([fields]).select()
      if (error) return { error: error.message }
      refetchParent?.()
      return {}
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Error al crear etiqueta' }
    } finally {
      setLoading(false)
    }
  }, [refetchParent])

  const updateEtiqueta = useCallback(async (id: string, fields: Partial<Omit<Etiqueta, 'id'>>): Promise<{ error?: string }> => {
    setLoading(true)
    try {
      if (USE_MOCK) {
        const idx = MOCK_ETIQUETAS.findIndex(e => e.id === id)
        if (idx !== -1) MOCK_ETIQUETAS[idx] = { ...MOCK_ETIQUETAS[idx], ...fields }
        refetchParent?.()
        return {}
      }
      const { error } = await insforge.database.from('etiquetas').update(fields).eq('id', id)
      if (error) return { error: error.message }
      refetchParent?.()
      return {}
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Error al actualizar etiqueta' }
    } finally {
      setLoading(false)
    }
  }, [refetchParent])

  const deleteEtiqueta = useCallback(async (id: string): Promise<{ error?: string }> => {
    setLoading(true)
    try {
      if (USE_MOCK) {
        const idx = MOCK_ETIQUETAS.findIndex(e => e.id === id)
        if (idx !== -1) MOCK_ETIQUETAS.splice(idx, 1)
        refetchParent?.()
        return {}
      }
      // Delete junction rows first, then the tag itself
      await insforge.database.from('tarea_etiquetas').delete().eq('etiqueta_id', id)
      const { error } = await insforge.database.from('etiquetas').delete().eq('id', id)
      if (error) return { error: error.message }
      refetchParent?.()
      return {}
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Error al eliminar etiqueta' }
    } finally {
      setLoading(false)
    }
  }, [refetchParent])

  return { etiquetas: initialEtiquetas, loading, createEtiqueta, updateEtiqueta, deleteEtiqueta }
}
