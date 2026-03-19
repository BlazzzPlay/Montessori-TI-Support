import { createClient } from '@insforge/sdk'

const INSFORGE_URL = import.meta.env.VITE_INSFORGE_URL as string
const INSFORGE_KEY = import.meta.env.VITE_INSFORGE_ANON_KEY as string

if (!INSFORGE_URL || !INSFORGE_KEY) {
  console.warn('[InsForge] Environment variables not set. Using mock data mode.')
}

export const insforge = createClient({
  baseUrl: INSFORGE_URL || 'https://jxw3tu8c.us-west.insforge.app',
  anonKey: INSFORGE_KEY || ''
})
