import { useState, useEffect } from 'react'

export interface Settings {
  totalTablets: number;
}

const DEFAULT_SETTINGS: Settings = {
  totalTablets: 40
}

export function useSettings() {
  const [settings, setSettingsState] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem('blazz_settings')
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })

  // Escuchar cambios de otras pestañas o ventanas
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'blazz_settings' && e.newValue) {
        try {
          setSettingsState(JSON.parse(e.newValue))
        } catch {}
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const updateSettings = (updates: Partial<Settings>) => {
    setSettingsState(prev => {
      const next = { ...prev, ...updates }
      localStorage.setItem('blazz_settings', JSON.stringify(next))
      // Disparar evento para componentes en LA MISMA pestaña (localStorage event solo notifica a OTRAS pestañas)
      window.dispatchEvent(new Event('local-settings-changed'))
      return next
    })
  }

  // Escuchar cambios en la MISMA pestaña
  useEffect(() => {
    const handleLocal = () => {
      try {
        const saved = localStorage.getItem('blazz_settings')
        if (saved) setSettingsState(JSON.parse(saved))
      } catch {}
    }
    window.addEventListener('local-settings-changed', handleLocal)
    return () => window.removeEventListener('local-settings-changed', handleLocal)
  }, [])

  return { settings, updateSettings }
}
