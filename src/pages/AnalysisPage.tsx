import { useState, useEffect, useMemo } from 'react'
import type { CompAnalysisRecord, CompAnalysisResponse } from '../types'
import { getEventName } from '../lib/eventNames'

import { API_BASE } from '../lib/api'

type AnalysisType = 'team-winrate' | 'comp-winrate' | 'matchup'

// ── data helpers ────────────────────────────────────────────────────────────

async function fetchEventData(eventId: string): Promise<CompAnalysisRecord[]> {
  const res = await fetch(`${API_BASE}/comp-analysis/${eventId}`)
  const data: CompAnalysisResponse = await res.json()
  return data.data ?? []
}

function calcTeamWinRates(records: CompAnalysisRecord[]) {
  const stats = new Map<string, { wins: number; total: number }>()
  for (const r of records) {
    const s = stats.get(r.team) ?? { wins: 0, total: 0 }
    s.total++
    if (r.won) s.wins++
    stats.set(r.team, s)
  }
  return Array.from(stats.entries())
    .map(([team, s]) => ({
      team,
      wins: s.wins,
      losses: s.total - s.wins,
      total: s.total,
      winrate: s.total > 0 ? Math.round((s.wins / s.total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.winrate - a.winrate || b.total - a.total)
}

function calcCompWinRates(records: CompAnalysisRecord[], requiredAgents: string[]) {
  const stats = new Map<string, { wins: number; total: number; comp: string[] }>()
  for (const r of records) {
    if (requiredAgents.length > 0 && !requiredAgents.every(a => r.comp.includes(a))) continue
    const key = [...r.comp].sort().join(',')
    const s = stats.get(key) ?? { wins: 0, total: 0, comp: r.comp }
    s.total++
    if (r.won) s.wins++
    stats.set(key, s)
  }
  return Array.from(stats.values())
    .map(s => ({
      comp: s.comp,
      wins: s.wins,
      losses: s.total - s.wins,
      total: s.total,
      winrate: s.total > 0 ? Math.round((s.wins / s.total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.total - a.total || b.winrate - a.winrate)
}

interface MatchupRow {
  yourComp: string[]
  enemyComp: string[]
  map: string
  won: boolean
}

function calcMatchupWinRate(
  records: CompAnalysisRecord[],
  yourAgents: string[],
  enemyAgents: string[],
  enemyMode: 'include' | 'exclude' = 'include',
) {
  const byMap = new Map<string, CompAnalysisRecord[]>()
  for (const r of records) {
    const g = byMap.get(r.map_id) ?? []
    g.push(r)
    byMap.set(r.map_id, g)
  }

  let wins = 0
  const matchups: MatchupRow[] = []

  for (const pair of byMap.values()) {
    if (pair.length !== 2) continue
    const [a, b] = pair

    const check = (yours: CompAnalysisRecord, enemy: CompAnalysisRecord) => {
      const yoursMatch = yourAgents.length === 0 || yourAgents.every(ag => yours.comp.includes(ag))
      const enemyMatch = enemyAgents.length === 0
        ? true
        : enemyMode === 'include'
          ? enemyAgents.every(ag => enemy.comp.includes(ag))
          : !enemyAgents.some(ag => enemy.comp.includes(ag))
      return yoursMatch && enemyMatch
    }

    if (check(a, b)) {
      if (a.won) wins++
      matchups.push({ yourComp: a.comp, enemyComp: b.comp, map: a.map_name, won: a.won })
    } else if (check(b, a)) {
      if (b.won) wins++
      matchups.push({ yourComp: b.comp, enemyComp: a.comp, map: b.map_name, won: b.won })
    }
  }

  const total = matchups.length
  return {
    wins,
    losses: total - wins,
    total,
    winrate: total > 0 ? Math.round((wins / total) * 1000) / 10 : 0,
    matchups,
  }
}

// ── small components ─────────────────────────────────────────────────────────

function WinrateBadge({ value }: { value: number }) {
  const color =
    value >= 60 ? 'bg-green-100 text-green-700' :
    value >= 50 ? 'bg-yellow-100 text-yellow-700' :
    'bg-red-100 text-red-600'
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${color}`}>
      {value}%
    </span>
  )
}

function AgentPill({ agent, active, onClick }: { agent: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
        active
          ? 'bg-gray-900 text-white'
          : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
      }`}
    >
      {agent}
    </button>
  )
}

// ── Team win rate view ───────────────────────────────────────────────────────

function TeamWinRateView({ records }: { records: CompAnalysisRecord[] }) {
  const rows = useMemo(() => calcTeamWinRates(records), [records])

  if (!rows.length) return <p className="text-gray-400 text-sm">No data.</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-900 text-white">
            <th className="text-left px-4 py-2 font-medium w-8">#</th>
            <th className="text-left px-4 py-2 font-medium">Team</th>
            <th className="px-4 py-2 font-medium text-center">W</th>
            <th className="px-4 py-2 font-medium text-center">L</th>
            <th className="px-4 py-2 font-medium text-center">Maps</th>
            <th className="px-4 py-2 font-medium text-center">Win Rate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.team} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
              <td className="px-4 py-2 text-gray-400 text-xs">{i + 1}</td>
              <td className="px-4 py-2 font-medium text-gray-900">{r.team}</td>
              <td className="px-4 py-2 text-center text-green-600 font-medium">{r.wins}</td>
              <td className="px-4 py-2 text-center text-red-500 font-medium">{r.losses}</td>
              <td className="px-4 py-2 text-center text-gray-500">{r.total}</td>
              <td className="px-4 py-2 text-center"><WinrateBadge value={r.winrate} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Comp win rate view ───────────────────────────────────────────────────────

function CompWinRateView({ records }: { records: CompAnalysisRecord[] }) {
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set())

  const allAgents = useMemo(() => {
    const s = new Set<string>()
    for (const r of records) r.comp.forEach(a => s.add(a))
    return [...s].sort()
  }, [records])

  const toggleAgent = (agent: string) => {
    setSelectedAgents(prev => {
      const next = new Set(prev)
      next.has(agent) ? next.delete(agent) : next.add(agent)
      return next
    })
  }

  const rows = useMemo(
    () => calcCompWinRates(records, [...selectedAgents]),
    [records, selectedAgents]
  )

  return (
    <div>
      {/* Agent filter */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Filter by Agent
          </p>
          {selectedAgents.size > 0 && (
            <button
              onClick={() => setSelectedAgents(new Set())}
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {allAgents.map(a => (
            <AgentPill
              key={a}
              agent={a}
              active={selectedAgents.has(a)}
              onClick={() => toggleAgent(a)}
            />
          ))}
        </div>
        {selectedAgents.size > 0 && (
          <p className="text-xs text-gray-400 mt-3">
            Showing comps containing: <span className="font-medium text-gray-600">{[...selectedAgents].join(', ')}</span>
            {' '}— {rows.length} comp{rows.length !== 1 ? 's' : ''} found
          </p>
        )}
      </div>

      {/* Results */}
      {!rows.length ? (
        <p className="text-gray-400 text-sm">No comps match the selected agents.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="text-left px-4 py-2 font-medium w-8">#</th>
                  <th className="text-left px-4 py-2 font-medium">Composition</th>
                  <th className="px-4 py-2 font-medium text-center">W</th>
                  <th className="px-4 py-2 font-medium text-center">L</th>
                  <th className="px-4 py-2 font-medium text-center">Maps</th>
                  <th className="px-4 py-2 font-medium text-center">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.comp.sort().join(',')} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-4 py-2 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {r.comp.map(a => (
                          <span
                            key={a}
                            className={`inline-block text-xs px-2 py-0.5 rounded font-medium ${
                              selectedAgents.has(a)
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center text-green-600 font-medium">{r.wins}</td>
                    <td className="px-4 py-2 text-center text-red-500 font-medium">{r.losses}</td>
                    <td className="px-4 py-2 text-center text-gray-500">{r.total}</td>
                    <td className="px-4 py-2 text-center"><WinrateBadge value={r.winrate} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Overall win rate for the core */}
          {selectedAgents.size > 0 && (() => {
            const totalWins = rows.reduce((s, r) => s + r.wins, 0)
            const totalMaps = rows.reduce((s, r) => s + r.total, 0)
            const overallWR = totalMaps > 0 ? Math.round((totalWins / totalMaps) * 1000) / 10 : 0
            const color = overallWR >= 60 ? 'text-green-600' : overallWR >= 50 ? 'text-yellow-600' : 'text-red-500'
            return (
              <div className="mt-6 bg-white border border-gray-200 rounded-lg p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                  Overall Win Rate — Core: {[...selectedAgents].join(', ')}
                </p>
                <div className="flex items-end gap-6">
                  <div>
                    <span className={`text-4xl font-bold ${color}`}>{overallWR}%</span>
                  </div>
                  <div className="text-sm text-gray-500 pb-1 space-x-4">
                    <span><span className="font-medium text-green-600">{totalWins}W</span></span>
                    <span><span className="font-medium text-red-500">{totalMaps - totalWins}L</span></span>
                    <span>{totalMaps} maps across {rows.length} comp{rows.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            )
          })()}
        </>
      )}
    </div>
  )
}

// ── Matchup view ─────────────────────────────────────────────────────────────

function CoreSelector({
  label,
  allAgents,
  selected,
  onToggle,
  onClear,
}: {
  label: string
  allAgents: string[]
  selected: Set<string>
  onToggle: (a: string) => void
  onClear: () => void
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex-1">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
        {selected.size > 0 && (
          <button onClick={onClear} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
            Clear
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {allAgents.map(a => (
          <AgentPill key={a} agent={a} active={selected.has(a)} onClick={() => onToggle(a)} />
        ))}
      </div>
      {selected.size > 0 && (
        <p className="text-xs text-gray-500 mt-3 font-medium">{[...selected].join(', ')}</p>
      )}
    </div>
  )
}

function MatchupView({ records }: { records: CompAnalysisRecord[] }) {
  const [yourAgents, setYourAgents] = useState<Set<string>>(new Set())
  const [enemyAgents, setEnemyAgents] = useState<Set<string>>(new Set())
  const [enemyMode, setEnemyMode] = useState<'include' | 'exclude'>('include')
  const [selectedMaps, setSelectedMaps] = useState<Set<string>>(new Set())

  const allAgents = useMemo(() => {
    const s = new Set<string>()
    for (const r of records) r.comp.forEach(a => s.add(a))
    return [...s].sort()
  }, [records])

  const allMaps = useMemo(() => {
    const s = new Set<string>()
    for (const r of records) s.add(r.map_name)
    return [...s].sort()
  }, [records])

  const toggle = (setter: React.Dispatch<React.SetStateAction<Set<string>>>) => (val: string) =>
    setter(prev => { const n = new Set(prev); n.has(val) ? n.delete(val) : n.add(val); return n })

  const filteredRecords = useMemo(
    () => selectedMaps.size === 0 ? records : records.filter(r => selectedMaps.has(r.map_name)),
    [records, selectedMaps]
  )

  const result = useMemo(
    () => calcMatchupWinRate(filteredRecords, [...yourAgents], [...enemyAgents], enemyMode),
    [filteredRecords, yourAgents, enemyAgents, enemyMode]
  )

  const color = result.winrate >= 60 ? 'text-green-600' : result.winrate >= 50 ? 'text-yellow-600' : 'text-red-500'

  const enemyLabel = enemyAgents.size === 0
    ? 'Any comp'
    : enemyMode === 'include'
      ? [...enemyAgents].join(', ')
      : `No ${[...enemyAgents].join(', ')}`

  return (
    <div>
      {/* Dual core selectors */}
      <div className="flex gap-4 mb-6">
        <CoreSelector
          label="Your Core"
          allAgents={allAgents}
          selected={yourAgents}
          onToggle={toggle(setYourAgents)}
          onClear={() => setYourAgents(new Set())}
        />
        <div className="flex items-center text-gray-400 font-bold text-lg shrink-0">vs</div>
        <div className="flex-1 flex flex-col gap-2">
          {/* Mode toggle */}
          <div className="flex gap-1 bg-gray-200 rounded-lg p-1 w-fit">
            {(['include', 'exclude'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setEnemyMode(mode)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  enemyMode === mode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {mode === 'include' ? 'Must include' : 'Must exclude'}
              </button>
            ))}
          </div>
          <CoreSelector
            label="Enemy Core"
            allAgents={allAgents}
            selected={enemyAgents}
            onToggle={toggle(setEnemyAgents)}
            onClear={() => setEnemyAgents(new Set())}
          />
        </div>
      </div>

      {/* Map filter */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Map</p>
          {selectedMaps.size > 0 && (
            <button onClick={() => setSelectedMaps(new Set())} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {allMaps.map(m => (
            <button
              key={m}
              onClick={() => toggle(setSelectedMaps)(m)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                selectedMaps.has(m)
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        {selectedMaps.size > 0 && (
          <p className="text-xs text-gray-400 mt-3">
            Filtering to: <span className="font-medium text-gray-600">{[...selectedMaps].join(', ')}</span>
          </p>
        )}
      </div>

      {result.total === 0 ? (
        <p className="text-gray-400 text-sm">No matchups found for the selected cores.</p>
      ) : (
        <>
          {/* Summary card */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              {yourAgents.size > 0 ? [...yourAgents].join(', ') : 'Any comp'}
              {' '}<span className="text-gray-300">vs</span>{' '}
              {enemyLabel}
            </p>
            <div className="flex items-end gap-6">
              <span className={`text-4xl font-bold ${color}`}>{result.winrate}%</span>
              <div className="text-sm text-gray-500 pb-1 space-x-4">
                <span className="font-medium text-green-600">{result.wins}W</span>
                <span className="font-medium text-red-500">{result.losses}L</span>
                <span>{result.total} maps</span>
              </div>
            </div>
          </div>

          {/* Matchup breakdown table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="text-left px-4 py-2 font-medium">Map</th>
                  <th className="text-left px-4 py-2 font-medium">Your Comp</th>
                  <th className="text-left px-4 py-2 font-medium">Enemy Comp</th>
                  <th className="px-4 py-2 font-medium text-center">Result</th>
                </tr>
              </thead>
              <tbody>
                {result.matchups.map((m, i) => (
                  <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-4 py-2 text-gray-600 font-medium">{m.map}</td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {m.yourComp.map(a => (
                          <span key={a} className={`text-xs px-2 py-0.5 rounded font-medium ${yourAgents.has(a) ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>{a}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {m.enemyComp.map(a => (
                          <span key={a} className={`text-xs px-2 py-0.5 rounded font-medium ${enemyAgents.has(a) ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>{a}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={`text-xs font-bold ${m.won ? 'text-green-600' : 'text-red-500'}`}>
                        {m.won ? 'W' : 'L'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

// ── Main Analysis Page ───────────────────────────────────────────────────────

export default function AnalysisPage() {
  const [availableEvents, setAvailableEvents] = useState<string[]>([])
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set())
  const [eventCache, setEventCache] = useState<Map<string, CompAnalysisRecord[]>>(new Map())
  const [loadingEvents, setLoadingEvents] = useState<Set<string>>(new Set())
  const [analysisType, setAnalysisType] = useState<AnalysisType>('team-winrate')

  useEffect(() => {
    fetch(`${API_BASE}/comp-analysis/events`)
      .then(r => r.json())
      .then(res => {
        const ids: string[] = res.data ?? []
        setAvailableEvents(ids)
        if (ids.length > 0) setSelectedEvents(new Set([ids[0]]))
      })
  }, [])

  // Fetch data for newly selected events
  useEffect(() => {
    for (const id of selectedEvents) {
      if (eventCache.has(id) || loadingEvents.has(id)) continue
      setLoadingEvents(prev => new Set(prev).add(id))
      fetchEventData(id).then(data => {
        setEventCache(prev => new Map(prev).set(id, data))
        setLoadingEvents(prev => { const n = new Set(prev); n.delete(id); return n })
      })
    }
  }, [selectedEvents])

  const toggleEvent = (id: string) => {
    setSelectedEvents(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const combinedRecords = useMemo(() => {
    const all: CompAnalysisRecord[] = []
    for (const id of selectedEvents) {
      const data = eventCache.get(id)
      if (data) all.push(...data)
    }
    return all
  }, [selectedEvents, eventCache])

  const isLoading = [...selectedEvents].some(id => loadingEvents.has(id))

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Analysis</h2>
        <p className="text-sm text-gray-400 mt-1">{combinedRecords.length} map records loaded</p>
      </div>

      {/* Event selector */}
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Events</p>
        <div className="flex flex-wrap gap-2">
          {availableEvents.map(id => {
            const active = selectedEvents.has(id)
            const loading = loadingEvents.has(id)
            return (
              <button
                key={id}
                onClick={() => toggleEvent(id)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  active
                    ? 'bg-gray-900 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                {loading ? '...' : getEventName(id)}
              </button>
            )
          })}
        </div>
      </div>

      {/* Analysis type tabs */}
      <div className="flex gap-1 bg-gray-200 rounded-lg p-1 w-fit mb-6">
        {([['team-winrate', 'Team Win Rate'], ['comp-winrate', 'Comp Win Rate'], ['matchup', 'Matchup']] as const).map(([type, label]) => (
          <button
            key={type}
            onClick={() => setAnalysisType(type)}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
              analysisType === type ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Results */}
      {isLoading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : selectedEvents.size === 0 ? (
        <p className="text-gray-400 text-sm">Select at least one event to begin.</p>
      ) : (
        <>
          {analysisType === 'team-winrate' && <TeamWinRateView records={combinedRecords} />}
          {analysisType === 'comp-winrate' && <CompWinRateView records={combinedRecords} />}
          {analysisType === 'matchup' && <MatchupView records={combinedRecords} />}
        </>
      )}
    </div>
  )
}
