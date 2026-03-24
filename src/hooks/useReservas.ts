import { useState, useEffect, useCallback } from 'react'
import { insforge } from '../lib/insforge'
import type { ReservaTablet } from '../types'

const USE_MOCK = !import.meta.env.VITE_INSFORGE_ANON_KEY

export function useReservas() {
  const [reservas, setReservas] = useState<ReservaTablet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReservas = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (USE_MOCK) {
        // En modo mock devolvemos array vacío por ahora o podrías añadir datos de prueba
        setReservas([])
        return
      }
      const { data, error: resError } = await insforge.database
        .from('reservas_tablets')
        .select('*')
        .order('fecha_inicio', { ascending: false })

      if (resError) throw resError
      setReservas(data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar reservas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReservas()
  }, [fetchReservas])

  const createReserva = useCallback(async (form: Omit<ReservaTablet, 'id' | 'created_at'>): Promise<{ error?: string }> => {
    try {
      if (USE_MOCK) {
        const nueva = { id: Math.random().toString(36), created_at: new Date().toISOString(), ...form } as ReservaTablet
        setReservas(prev => [nueva, ...prev])
        return {}
      }
      const { error } = await insforge.database.from('reservas_tablets').insert([form])
      if (error) return { error: error.message }
      await fetchReservas()
      return {}
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Error al crear reserva' }
    }
  }, [fetchReservas])

  const updateReserva = useCallback(async (id: string, updates: Partial<ReservaTablet>): Promise<{ error?: string }> => {
    try {
      if (USE_MOCK) {
        setReservas(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
        return {}
      }
      const { error } = await insforge.database.from('reservas_tablets').update(updates).eq('id', id)
      if (error) return { error: error.message }
      await fetchReservas()
      return {}
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Error al actualizar reserva' }
    }
  }, [fetchReservas])

  const deleteReserva = useCallback(async (id: string): Promise<{ error?: string }> => {
    try {
      if (USE_MOCK) {
        setReservas(prev => prev.filter(r => r.id !== id))
        return {}
      }
      const { error } = await insforge.database.from('reservas_tablets').delete().eq('id', id)
      if (error) return { error: error.message }
      await fetchReservas()
      return {}
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Error al eliminar reserva' }
    }
  }, [fetchReservas])

  return { reservas, loading, error, refetch: fetchReservas, createReserva, updateReserva, deleteReserva }
}
