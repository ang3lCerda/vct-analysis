import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { MapRecord, MapRecordResponse, Match, MapPlay } from '../types'
import { fetchEventName } from '../lib/eventNames'
import { API_BASE } from '../lib/api'

function buildMatches(records: MapRecord[]): Match[] {
  const matchMap = new Map<string, MapRecord[]>()
  for (const r of records) {
    const existing = matchMap.get(r.match_id) ?? []
    existing.push(r)
    matchMap.set(r.match_id, existing)
  }

  return Array.from(matchMap.values()).map(maps => {
    const team1_maps_won = maps.filter(m => m.winner_id === m.team1_id).length
    const team2_maps_won = maps.filter(m => m.winner_id === m.team2_id).length

    const mapPlays: MapPlay[] = maps.map(m => ({
      map_id: m.map_id,
      map_name: m.map_name,
      team1: m.team1,
      team1_comp: m.team1_comp,
      team1_rounds: m.team1_rounds,
      team1_atk: m.team1_attack_rounds,
      team1_def: m.team1_defense_rounds,
      team1_won: m.winner_id === m.team1_id,
      team2: m.team2,
      team2_comp: m.team2_comp,
      team2_rounds: m.team2_rounds,
      team2_atk: m.team2_attack_rounds,
      team2_def: m.team2_defense_rounds,
    }))

    return {
      match_id: maps[0].match_id,
      team1: maps[0].team1,
      team2: maps[0].team2,
      team1_maps_won,
      team2_maps_won,
      maps: mapPlays,
    }
  })
}

function AgentPill({ agent }: { agent: string }) {
  return (
    <span className="inline-block bg-vct-900 text-gray-300 text-xs px-2 py-0.5 rounded font-medium">
      {agent}
    </span>
  )
}

function MapCard({ map }: { map: MapPlay }) {
  return (
    <div className="bg-vct-800 rounded-lg border border-white/10 overflow-hidden">
      <div className="bg-vct-900 text-white px-4 py-2 flex items-center justify-between">
        <span className="font-semibold text-sm">{map.map_name}</span>
        <span className="text-gray-400 text-sm font-mono">
          {map.team1_rounds} — {map.team2_rounds}
        </span>
      </div>

      <div className="grid grid-cols-2 divide-x divide-white/5">
        <div className={`p-4 ${map.team1_won ? 'bg-green-500/10' : ''}`}>
          <div className="flex items-center gap-2 mb-3">
            {map.team1_won && <span className="text-xs font-bold text-green-400 uppercase tracking-wide">Win</span>}
            <span className="font-semibold text-white text-sm">{map.team1}</span>
          </div>
          <div className="flex flex-wrap gap-1 mb-3">
            {map.team1_comp.map(a => <AgentPill key={a} agent={a} />)}
          </div>
          <div className="text-xs text-gray-400 space-x-3">
            <span>ATK <span className="text-gray-200 font-medium">{map.team1_atk}</span></span>
            <span>DEF <span className="text-gray-200 font-medium">{map.team1_def}</span></span>
          </div>
        </div>

        <div className={`p-4 ${!map.team1_won ? 'bg-green-500/10' : ''}`}>
          <div className="flex items-center gap-2 mb-3">
            {!map.team1_won && <span className="text-xs font-bold text-green-400 uppercase tracking-wide">Win</span>}
            <span className="font-semibold text-white text-sm">{map.team2}</span>
          </div>
          <div className="flex flex-wrap gap-1 mb-3">
            {map.team2_comp.map(a => <AgentPill key={a} agent={a} />)}
          </div>
          <div className="text-xs text-gray-400 space-x-3">
            <span>ATK <span className="text-gray-200 font-medium">{map.team2_atk}</span></span>
            <span>DEF <span className="text-gray-200 font-medium">{map.team2_def}</span></span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EventsPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const [matches, setMatches] = useState<Match[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [eventName, setEventName] = useState<string>(`Event ${eventId}`)

  useEffect(() => {
    if (eventId) fetchEventName(eventId).then(setEventName)
  }, [eventId])

  useEffect(() => {
    if (!eventId) return
    fetch(`${API_BASE}/comp-analysis/${eventId}`)
      .then(r => r.json())
      .then((res: MapRecordResponse) => {
        const built = buildMatches(res.data ?? [])
        setMatches(built)
        if (built.length) setSelected(built[0].match_id)
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false))
  }, [eventId])

  const selectedMatch = matches.find(m => m.match_id === selected)

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>
  if (error) return <div className="p-8 text-red-400">{error}</div>

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="mb-6">
        <button onClick={() => navigate('/events')} className="text-sm text-gray-400 hover:text-white mb-3 block transition-colors">
          ← All Events
        </button>
        <h2 className="text-2xl font-bold text-white">{eventName}</h2>
        <p className="text-sm text-gray-400 mt-1">{matches.length} matches</p>
      </div>

      <div className="flex gap-6">
        <div className="w-64 shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Matches</p>
          <ul className="space-y-1">
            {matches.map(m => (
              <li key={m.match_id}>
                <button
                  onClick={() => setSelected(m.match_id)}
                  className={`w-full text-left px-3 py-2.5 rounded text-sm transition-colors ${
                    selected === m.match_id ? 'bg-vct-700 text-white' : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <div className="font-medium truncate">{m.team1}</div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs truncate opacity-70">{m.team2}</span>
                    <span className={`text-xs font-bold ml-2 shrink-0 ${selected === m.match_id ? 'text-gray-300' : 'text-gray-400'}`}>
                      {m.team1_maps_won}–{m.team2_maps_won}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {selectedMatch && (
          <div className="flex-1 min-w-0">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white">
                {selectedMatch.team1}
                <span className="text-gray-400 font-normal mx-2">vs</span>
                {selectedMatch.team2}
              </h3>
              <p className="text-sm text-gray-400 mt-0.5">
                Map score: {selectedMatch.team1_maps_won}–{selectedMatch.team2_maps_won}
              </p>
            </div>
            <div className="space-y-4">
              {selectedMatch.maps.map(map => (
                <MapCard key={map.map_id} map={map} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
