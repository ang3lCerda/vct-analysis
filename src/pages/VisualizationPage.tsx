import { useState, useEffect, useMemo, useRef } from 'react'
import type { MapRecord, MapRecordResponse } from '../types'
import { API_BASE } from '../lib/api'
import { fetchEventName } from '../lib/eventNames'
import { calcAgentStats } from '../lib/visualizationUtils'
import AgentScatterView from '../components/visualization/AgentScatterView'
import TeamMapHeatmap from '../components/visualization/TeamMapHeatmap'
import AgentCoMatrix from '../components/visualization/AgentCoMatrix'

type VizType = 'scatter' | 'heatmap' | 'matrix'

async function fetchEventData(eventId: string): Promise<MapRecord[]> {
  const res = await fetch(`${API_BASE}/comp-analysis/${eventId}`)
  const data: MapRecordResponse = await res.json()
  return data.data ?? []
}

export default function VisualizationPage() {
  const [availableEvents, setAvailableEvents] = useState<string[]>([])
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set())
  const [eventCache, setEventCache] = useState<Map<string, MapRecord[]>>(new Map())
  const [loadingEvents, setLoadingEvents] = useState<Set<string>>(new Set())
  const inFlight = useRef<Set<string>>(new Set())
  const [eventNames, setEventNames] = useState<Record<string, string>>({})

  const [vizType, setVizType] = useState<VizType>('scatter')
  const [selectedMaps, setSelectedMaps] = useState<Set<string>>(new Set())
  const [minAppearances, setMinAppearances] = useState(3)

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

  const combinedRecords = useMemo(() => {
    const all: MapRecord[] = []
    for (const id of selectedEvents) {
      const data = eventCache.get(id)
      if (data) all.push(...data)
    }
    return all
  }, [selectedEvents, eventCache])

  const allMaps = useMemo(() => {
    const s = new Set<string>()
    for (const r of combinedRecords) s.add(r.map_name)
    return [...s].sort()
  }, [combinedRecords])

  const agentStats = useMemo(
    () => calcAgentStats(combinedRecords, selectedMaps),
    [combinedRecords, selectedMaps]
  )

  const isLoading = [...selectedEvents].some(id => loadingEvents.has(id))

  const toggleEvent = (id: string) => {
    setSelectedEvents(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleMap = (map: string) => {
    setSelectedMaps(prev => {
      const next = new Set(prev)
      next.has(map) ? next.delete(map) : next.add(map)
      return next
    })
  }

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Visualizations</h2>
        <p className="text-sm text-gray-400 mt-1">{combinedRecords.length} map records</p>
      </div>

      {/* Event selection */}
      <div className="mb-4">
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
                  active ? 'bg-vct-700 text-white' : 'bg-vct-800 border border-white/10 text-gray-300 hover:border-white/40'
                }`}
              >
                {loading ? '...' : (eventNames[id] ?? id)}
              </button>
            )
          })}
        </div>
      </div>

      {/* Viz type tabs */}
      <div className="flex gap-1 bg-vct-900 rounded-lg p-1 w-fit mb-6">
        {([['scatter', 'Agent Performance'], ['heatmap', 'Team × Map'], ['matrix', 'Agent Pairs']] as const).map(([type, label]) => (
          <button
            key={type}
            onClick={() => setVizType(type)}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
              vizType === type ? 'bg-vct-700 text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Scatter-only filters */}
      {vizType === 'scatter' && (
        <>
          {allMaps.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Maps</p>
                {selectedMaps.size > 0 && (
                  <button onClick={() => setSelectedMaps(new Set())} className="text-xs text-gray-400 hover:text-white transition-colors">All maps</button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {allMaps.map(m => (
                  <button
                    key={m}
                    onClick={() => toggleMap(m)}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      selectedMaps.has(m) ? 'bg-vct-700 text-white' : 'bg-vct-800 border border-white/10 text-gray-300 hover:border-white/40'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6 flex items-center gap-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Min Appearances</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMinAppearances(n => Math.max(1, n - 1))}
                className="w-6 h-6 rounded bg-vct-800 border border-white/10 text-gray-300 hover:border-white/40 text-sm flex items-center justify-center transition-colors"
              >−</button>
              <span className="text-white font-bold w-6 text-center text-sm">{minAppearances}</span>
              <button
                onClick={() => setMinAppearances(n => Math.min(50, n + 1))}
                className="w-6 h-6 rounded bg-vct-800 border border-white/10 text-gray-300 hover:border-white/40 text-sm flex items-center justify-center transition-colors"
              >+</button>
            </div>
            <span className="text-xs text-gray-500">maps played to appear on chart</span>
          </div>
        </>
      )}

      {/* Views */}
      {isLoading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : selectedEvents.size === 0 ? (
        <p className="text-gray-400 text-sm">Select at least one event to begin.</p>
      ) : vizType === 'scatter' ? (
        <AgentScatterView stats={agentStats} minAppearances={minAppearances} />
      ) : vizType === 'heatmap' ? (
        <TeamMapHeatmap records={combinedRecords} />
      ) : (
        <AgentCoMatrix records={combinedRecords} />
      )}
    </div>
  )
}
