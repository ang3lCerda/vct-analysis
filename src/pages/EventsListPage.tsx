import { useState, useEffect } from 'react'
import { getEventName } from '../lib/eventNames'

import { API_BASE } from '../lib/api'

interface Props {
  onSelectEvent: (eventId: string) => void
}

export default function EventsListPage({ onSelectEvent }: Props) {
  const [eventIds, setEventIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_BASE}/comp-analysis/events`)
      .then(r => r.json())
      .then(res => setEventIds(res.data ?? []))
      .catch(() => setError('Failed to load events'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>
  if (error) return <div className="p-8 text-red-500">{error}</div>

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Events</h2>
        <p className="text-sm text-gray-400 mt-1">{eventIds.length} event{eventIds.length !== 1 ? 's' : ''} available</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {eventIds.map(id => (
          <button
            key={id}
            onClick={() => onSelectEvent(id)}
            className="text-left bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-900 hover:shadow-sm transition-all group"
          >
            <div className="text-xs font-mono text-gray-400 mb-1">ID {id}</div>
            <div className="font-semibold text-gray-900 group-hover:text-black">
              {getEventName(id)}
            </div>
            <div className="mt-3 text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
              View matches →
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
