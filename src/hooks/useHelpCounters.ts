import { useState, useEffect } from 'react'
import { insforge } from '../lib/insforge'

export function useHelpCounters() {
  const [helpCounters, setHelpCounters] = useState({
    apoderados: 0, alumnos: 0, profesores: 0, administrativos: 0
  })
  const [loading, setLoading] = useState(true)

  const fetchCounters = async () => {
    const currentMonth = new Date().toISOString().slice(0, 7)
    try {
      const { data, error } = await insforge.database
        .from('help_counters')
        .select('*')
        .eq('mes', currentMonth)
      
      if (error) throw error
      if (data) {
        const newCounters = { apoderados: 0, alumnos: 0, profesores: 0, administrativos: 0 }
        data.forEach((row: any) => {
          if (row.categoria in newCounters) {
            // @ts-ignore
            newCounters[row.categoria] = row.cantidad
          }
        })
        setHelpCounters(newCounters)
      }
    } catch (err) {
      console.error('Error fetching help counters:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCounters()
  }, [])

  const incrementCounter = async (categoria: string) => {
    const currentMonth = new Date().toISOString().slice(0, 7)
    // @ts-ignore
    const newValue = (helpCounters[categoria] || 0) + 1
    
    // Update local state immediately for responsiveness
    setHelpCounters(prev => ({ ...prev, [categoria]: newValue }))

    try {
      const { error } = await insforge.database
        .from('help_counters')
        .upsert({ 
          categoria, 
          cantidad: newValue, 
          mes: currentMonth 
        }, { onConflict: 'categoria, mes' })
      
      if (error) throw error
    } catch (err) {
      console.error('Error updating help counter:', err)
      // Rollback on error?
      fetchCounters() // Refresh from DB
    }
  }

  return { helpCounters, incrementCounter, loading, refresh: fetchCounters }
}
