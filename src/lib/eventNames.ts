import { API_BASE } from './api'

const cache = new Map<string, string>()

export async function fetchEventName(eventId: string): Promise<string> {
  if (cache.has(eventId)) return cache.get(eventId)!
  try {
    const res = await fetch(`${API_BASE}/events/${eventId}`)
    const data = await res.json()
    const name: string = data.data?.name ?? `Event ${eventId}`
    cache.set(eventId, name)
    return name
  } catch {
    return `Event ${eventId}`
  }
}
