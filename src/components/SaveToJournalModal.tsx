import { useState, FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { API_BASE } from '../lib/api'

interface Props {
  analysisType: string
  selectedEvents: string[]
  eventNames: Record<string, string>
  onClose: () => void
  onSaved: () => void
}

export default function SaveToJournalModal({ analysisType, selectedEvents, eventNames, onClose, onSaved }: Props) {
  const { token } = useAuth()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/journal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name,
          analysis_type: analysisType,
          data: { selectedEvents, analysisType },
          event_id: selectedEvents[0] ?? null,
        }),
      })
      if (!res.ok) { setError('Failed to save'); return }
      onSaved()
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  const eventLabel = selectedEvents.map(id => eventNames[id] ?? id).join(', ')

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div
        className="bg-vct-900 border border-vct-700 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-white font-bold text-lg">Save to Journal</h2>

        <div className="flex flex-col gap-1 text-xs text-dusty-denim-400">
          <span>Analysis: <span className="text-white font-medium">{analysisType}</span></span>
          {eventLabel && <span>Events: <span className="text-white font-medium">{eventLabel}</span></span>}
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <input
            required
            autoFocus
            placeholder="Entry name…"
            value={name}
            onChange={e => setName(e.target.value)}
            className="bg-vct-800 border border-vct-700 rounded-lg px-3 py-2 text-sm text-white placeholder-vct-600 focus:outline-none focus:border-red-400"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-sm text-dusty-denim-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white font-semibold rounded-lg px-5 py-1.5 text-sm transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
