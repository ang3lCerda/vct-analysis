import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchEventName } from '../lib/eventNames'
import { API_BASE } from '../lib/api'

export default function EventsListPage() {
  const navigate = useNavigate()
  const [eventIds, setEventIds] = useState<string[]>([])
  const [names, setNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_BASE}/comp-analysis/events`)
      .then(r => r.json())
      .then(async res => {
        const ids: string[] = res.data ?? []
        setEventIds(ids)
        const entries = await Promise.all(ids.map(async id => [id, await fetchEventName(id)] as const))
        setNames(Object.fromEntries(entries))
      })
      .catch(() => setError('Failed to load events'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>
  if (error) return <div className="p-8 text-red-400">{error}</div>

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Events</h2>
        <p className="text-sm text-gray-400 mt-1">{eventIds.length} event{eventIds.length !== 1 ? 's' : ''} available</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {eventIds.map(id => (
          <button
            key={id}
            onClick={() => navigate(`/events/${id}`)}
            className="text-left bg-vct-800 border border-white/10 rounded-lg p-5 hover:border-vct-600 hover:shadow-sm transition-all group"
          >
            <div className="text-xs font-mono text-gray-400 mb-1">ID {id}</div>
            <div className="font-semibold text-white group-hover:text-white">
              {names[id] ?? '...'}
            </div>
            <div className="mt-3 text-xs text-gray-400 group-hover:text-gray-200 transition-colors">
              View matches →
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
