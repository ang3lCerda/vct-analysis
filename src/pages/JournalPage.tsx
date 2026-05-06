import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_BASE } from '../lib/api'
import { fetchEventName } from '../lib/eventNames'

interface JournalEntry {
  _id: string
  name: string
  analysis_type: string
  data: { selectedEvents: string[]; analysisType: string }
  event_id: string | null
  created_at: string
}

const typeLabel: Record<string, string> = {
  'team-winrate': 'Team Win Rate',
  'comp-winrate': 'Comp Win Rate',
  'matchup': 'Matchup',
}

export default function JournalPage() {
  const { token, logout } = useAuth()
  const navigate = useNavigate()

  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [eventNames, setEventNames] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    fetchEntries()
  }, [token])

  async function fetchEntries() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/journal`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) { logout(); navigate('/login'); return }
      const data = await res.json()
      const fetched: JournalEntry[] = data.data ?? []
      setEntries(fetched)

      const allEventIds = [...new Set(fetched.flatMap(e => e.data?.selectedEvents ?? []))]
      const nameEntries = await Promise.all(allEventIds.map(async id => [id, await fetchEventName(id)] as const))
      setEventNames(Object.fromEntries(nameEntries))
    } catch {
      setError('Failed to load journal entries')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    await fetch(`${API_BASE}/journal/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    setEntries(prev => prev.filter(e => e._id !== id))
  }

  function handleLoad(entry: JournalEntry) {
    navigate('/analysis', {
      state: {
        selectedEvents: entry.data?.selectedEvents ?? [],
        analysisType: entry.data?.analysisType,
      },
    })
  }

  return (
    <div className="min-h-screen bg-vct-950 px-6 py-8 max-w-3xl mx-auto flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-white">Journal</h1>
      <p className="text-dusty-denim-500 text-sm -mt-4">
        Saved analyses from the Analysis page. Click Load to restore a view.
      </p>

      {loading ? (
        <p className="text-dusty-denim-500 text-sm">Loading…</p>
      ) : error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : entries.length === 0 ? (
        <p className="text-dusty-denim-500 text-sm">
          No saved analyses yet — use the "Save to Journal" button on the Analysis page.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map(entry => {
            const events = entry.data?.selectedEvents ?? []
            return (
              <div key={entry._id} className="bg-vct-900 border border-vct-700 rounded-2xl p-5 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-white font-semibold truncate">{entry.name}</h3>
                    <span className="bg-vct-800 text-dusty-denim-400 text-xs px-2 py-0.5 rounded-full shrink-0">
                      {typeLabel[entry.analysis_type] ?? entry.analysis_type}
                    </span>
                  </div>
                  {events.length > 0 && (
                    <p className="text-xs text-dusty-denim-500 mt-1 truncate">
                      {events.map(id => eventNames[id] ?? id).join(', ')}
                    </p>
                  )}
                  <p className="text-xs text-vct-600 mt-0.5">
                    {new Date(entry.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleLoad(entry)}
                    className="bg-vct-800 hover:bg-vct-700 border border-vct-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => handleDelete(entry._id)}
                    className="text-vct-600 hover:text-red-400 text-xs transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
