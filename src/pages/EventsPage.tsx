import { useState, useEffect } from 'react'
import type { CompAnalysisRecord, CompAnalysisResponse, Match, MapPlay } from '../types'
import { getEventName } from '../lib/eventNames'
import { API_BASE } from '../lib/api'

function buildMatches(records: CompAnalysisRecord[]): Match[] {
  const matchMap = new Map<string, CompAnalysisRecord[]>()
  for (const r of records) {
    const existing = matchMap.get(r.match_id) ?? []
    existing.push(r)
    matchMap.set(r.match_id, existing)
  }

  const matches: Match[] = []

  for (const [match_id, recs] of matchMap) {
    const mapMap = new Map<string, CompAnalysisRecord[]>()
    for (const r of recs) {
      const existing = mapMap.get(r.map_id) ?? []
      existing.push(r)
      mapMap.set(r.map_id, existing)
    }

    const maps: MapPlay[] = []
    for (const [map_id, pair] of mapMap) {
      const t1 = pair[0]
      const t2 = pair[1]
      if (!t1 || !t2) continue
      maps.push({
        map_id,
        map_name: t1.map_name,
        team1: t1.team,
        team1_comp: t1.comp,
        team1_rounds: t1.rounds_won,
        team1_atk: t1.attack_rounds_won,
        team1_def: t1.defense_rounds_won,
        team1_won: t1.won,
        team2: t2.team,
        team2_comp: t2.comp,
        team2_rounds: t2.rounds_won,
        team2_atk: t2.attack_rounds_won,
        team2_def: t2.defense_rounds_won,
      })
    }

    const team1 = maps[0]?.team1 ?? ''
    const team2 = maps[0]?.team2 ?? ''
    const team1_maps_won = maps.filter(m => m.team1_won).length
    const team2_maps_won = maps.filter(m => !m.team1_won).length

    matches.push({ match_id, team1, team2, team1_maps_won, team2_maps_won, maps })
  }

  return matches
}

function AgentPill({ agent }: { agent: string }) {
  return (
    <span className="inline-block bg-gray-800 text-gray-200 text-xs px-2 py-0.5 rounded font-medium">
      {agent}
    </span>
  )
}

function MapCard({ map }: { map: MapPlay }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-900 text-white px-4 py-2 flex items-center justify-between">
        <span className="font-semibold text-sm">{map.map_name}</span>
        <span className="text-gray-300 text-sm font-mono">
          {map.team1_rounds} — {map.team2_rounds}
        </span>
      </div>

      <div className="grid grid-cols-2 divide-x divide-gray-100">
        {/* Team 1 */}
        <div className={`p-4 ${map.team1_won ? 'bg-green-50' : ''}`}>
          <div className="flex items-center gap-2 mb-3">
            {map.team1_won && (
              <span className="text-xs font-bold text-green-600 uppercase tracking-wide">Win</span>
            )}
            <span className="font-semibold text-gray-900 text-sm">{map.team1}</span>
          </div>
          <div className="flex flex-wrap gap-1 mb-3">
            {map.team1_comp.map(a => <AgentPill key={a} agent={a} />)}
          </div>
          <div className="text-xs text-gray-400 space-x-3">
            <span>ATK <span className="text-gray-700 font-medium">{map.team1_atk}</span></span>
            <span>DEF <span className="text-gray-700 font-medium">{map.team1_def}</span></span>
          </div>
        </div>

        {/* Team 2 */}
        <div className={`p-4 ${!map.team1_won ? 'bg-green-50' : ''}`}>
          <div className="flex items-center gap-2 mb-3">
            {!map.team1_won && (
              <span className="text-xs font-bold text-green-600 uppercase tracking-wide">Win</span>
            )}
            <span className="font-semibold text-gray-900 text-sm">{map.team2}</span>
          </div>
          <div className="flex flex-wrap gap-1 mb-3">
            {map.team2_comp.map(a => <AgentPill key={a} agent={a} />)}
          </div>
          <div className="text-xs text-gray-400 space-x-3">
            <span>ATK <span className="text-gray-700 font-medium">{map.team2_atk}</span></span>
            <span>DEF <span className="text-gray-700 font-medium">{map.team2_def}</span></span>
          </div>
        </div>
      </div>
    </div>
  )
}

interface Props {
  eventId: string
  onBack: () => void
}

export default function EventsPage({ eventId, onBack }: Props) {
  const [matches, setMatches] = useState<Match[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_BASE}/comp-analysis/${eventId}`)
      .then(r => r.json())
      .then((res: CompAnalysisResponse) => {
        const built = buildMatches(res.data ?? [])
        setMatches(built)
        if (built.length) setSelected(built[0].match_id)
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false))
  }, [eventId])

  const selectedMatch = matches.find(m => m.match_id === selected)

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>
  if (error) return <div className="p-8 text-red-500">{error}</div>

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="mb-6">
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-700 mb-3 block transition-colors">
          ← All Events
        </button>
        <h2 className="text-2xl font-bold text-gray-900">{getEventName(eventId)}</h2>
        <p className="text-sm text-gray-400 mt-1">{matches.length} matches</p>
      </div>

      <div className="flex gap-6">
        {/* Match list */}
        <div className="w-64 shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Matches</p>
          <ul className="space-y-1">
            {matches.map(m => (
              <li key={m.match_id}>
                <button
                  onClick={() => setSelected(m.match_id)}
                  className={`w-full text-left px-3 py-2.5 rounded text-sm transition-colors ${
                    selected === m.match_id
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium truncate">{m.team1}</div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs truncate opacity-70">{m.team2}</span>
                    <span className={`text-xs font-bold ml-2 shrink-0 ${selected === m.match_id ? 'text-gray-300' : 'text-gray-500'}`}>
                      {m.team1_maps_won}–{m.team2_maps_won}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Match detail */}
        {selectedMatch && (
          <div className="flex-1 min-w-0">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900">
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
