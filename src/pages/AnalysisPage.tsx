import { useState, useEffect, useMemo, useRef } from 'react'
import type { MapRecord, MapRecordResponse } from '../types'
import { API_BASE } from '../lib/api'
import { fetchEventName } from '../lib/eventNames'
import TeamWinRateView from '../components/analysis/TeamWinRateView'
import CompWinRateView from '../components/analysis/CompWinRateView'
import MatchupView from '../components/analysis/MatchupView'

type AnalysisType = 'team-winrate' | 'comp-winrate' | 'matchup'

async function fetchEventData(eventId: string): Promise<MapRecord[]> {
  const res = await fetch(`${API_BASE}/comp-analysis/${eventId}`)
  const data: MapRecordResponse = await res.json()
  return data.data ?? []
}

export default function AnalysisPage() {
  const [availableEvents, setAvailableEvents] = useState<string[]>([])
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set())
  const [eventCache, setEventCache] = useState<Map<string, MapRecord[]>>(new Map())
  const [loadingEvents, setLoadingEvents] = useState<Set<string>>(new Set())
  const inFlight = useRef<Set<string>>(new Set())
  const [analysisType, setAnalysisType] = useState<AnalysisType>('team-winrate')
  const [eventNames, setEventNames] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch(`${API_BASE}/comp-analysis/events`)
      .then(r => r.json())
      .then(async res => {
        const ids: string[] = res.data ?? []
        setAvailableEvents(ids)
        if (ids.length > 0) setSelectedEvents(new Set([ids[0]]))
        const entries = await Promise.all(ids.map(async id => [id, await fetchEventName(id)] as const))
        setEventNames(Object.fromEntries(entries))
      })
  }, [])

  useEffect(() => {
    for (const id of selectedEvents) {
      if (eventCache.has(id) || inFlight.current.has(id)) continue
      inFlight.current.add(id)
      setLoadingEvents(prev => new Set(prev).add(id))
      fetchEventData(id).then(data => {
        inFlight.current.delete(id)
        setEventCache(prev => new Map(prev).set(id, data))
        setLoadingEvents(prev => { const n = new Set(prev); n.delete(id); return n })
      })
    }
  }, [selectedEvents, eventCache])

  const toggleEvent = (id: string) => {
    setSelectedEvents(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const combinedRecords = useMemo(() => {
    const all: MapRecord[] = []
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
        <h2 className="text-2xl font-bold text-white">Analysis</h2>
        <p className="text-sm text-gray-400 mt-1">{combinedRecords.length} map records loaded</p>
      </div>

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
                    ? 'bg-vct-700 text-white'
                    : 'bg-vct-800 border border-white/10 text-gray-300 hover:border-white/40'
                }`}
              >
                {loading ? '...' : (eventNames[id] ?? id)}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex gap-1 bg-vct-900 rounded-lg p-1 w-fit mb-6">
        {([['team-winrate', 'Team Win Rate'], ['comp-winrate', 'Comp Win Rate'], ['matchup', 'Matchup']] as const).map(([type, label]) => (
          <button
            key={type}
            onClick={() => setAnalysisType(type)}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
              analysisType === type ? 'bg-vct-700 text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

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
