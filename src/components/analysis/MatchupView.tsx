import { useState, useMemo } from 'react'
import type { MapRecord } from '../../types'
import { calcMatchupWinRate, emptyRoleFilter, type RoleFilter, type MatchupRow } from '../../lib/analysisUtils'
import RoleFilterBar from './RoleFilterBar'
import AgentPill from './AgentPill'

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
    <div className="bg-vct-800 border border-white/10 rounded-lg p-4 flex-1">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
        {selected.size > 0 && (
          <button onClick={onClear} className="text-xs text-gray-400 hover:text-white transition-colors">
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
        <p className="text-xs text-gray-400 mt-3 font-medium">{[...selected].join(', ')}</p>
      )}
    </div>
  )
}

function MatchupTableRow({ row, index, yourAgents, enemyAgents }: {
  row: MatchupRow
  index: number
  yourAgents: Set<string>
  enemyAgents: Set<string>
}) {
  const [open, setOpen] = useState(false)
  const bg = index % 2 === 0 ? 'bg-vct-800' : 'bg-vct-900'

  return (
    <>
      <tr
        className={`border-b border-white/5 ${bg} cursor-pointer hover:bg-white/5 transition-colors`}
        onClick={() => setOpen(o => !o)}
      >
        <td className="px-4 py-2 text-gray-300 font-medium">{row.map}</td>
        <td className="px-4 py-2">
          <div className="flex flex-wrap gap-1">
            {row.yourComp.map(a => (
              <span key={a} className={`text-xs px-2 py-0.5 rounded font-medium ${yourAgents.has(a) ? 'bg-vct-700 text-white' : 'bg-vct-900 text-gray-300'}`}>{a}</span>
            ))}
          </div>
        </td>
        <td className="px-4 py-2">
          <div className="flex flex-wrap gap-1">
            {row.enemyComp.map(a => (
              <span key={a} className={`text-xs px-2 py-0.5 rounded font-medium ${enemyAgents.has(a) ? 'bg-vct-700 text-white' : 'bg-vct-900 text-gray-300'}`}>{a}</span>
            ))}
          </div>
        </td>
        <td className="px-4 py-2 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className={`text-xs font-bold ${row.won ? 'text-green-400' : 'text-red-400'}`}>{row.won ? 'W' : 'L'}</span>
            <span className="text-white/20 text-xs">{open ? '▲' : '▼'}</span>
          </div>
        </td>
      </tr>
      {open && (
        <tr className={bg}>
          <td colSpan={4} className="px-4 pb-3 pt-1">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="text-gray-400 border-b border-white/10">
                  <th className="text-left py-1 font-medium">Team</th>
                  <th className="text-left py-1 font-medium">Opponent</th>
                  <th className="text-center py-1 font-medium">Score</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-1 font-medium text-gray-200">{row.team}</td>
                  <td className="py-1 text-gray-400">{row.opponent}</td>
                  <td className="py-1 text-center font-mono text-gray-200">{row.score}</td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  )
}

export default function MatchupView({ records }: { records: MapRecord[] }) {
  const [yourAgents, setYourAgents] = useState<Set<string>>(new Set())
  const [enemyAgents, setEnemyAgents] = useState<Set<string>>(new Set())
  const [enemyMode, setEnemyMode] = useState<'include' | 'exclude'>('include')
  const [selectedMaps, setSelectedMaps] = useState<Set<string>>(new Set())
  const [yourRoleFilter, setYourRoleFilter] = useState<RoleFilter>(emptyRoleFilter())
  const [enemyRoleFilter, setEnemyRoleFilter] = useState<RoleFilter>(emptyRoleFilter())

  const allAgents = useMemo(() => {
    const s = new Set<string>()
    for (const r of records) {
      r.team1_comp.forEach(a => s.add(a))
      r.team2_comp.forEach(a => s.add(a))
    }
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
    () => calcMatchupWinRate(filteredRecords, [...yourAgents], [...enemyAgents], enemyMode, yourRoleFilter, enemyRoleFilter),
    [filteredRecords, yourAgents, enemyAgents, enemyMode, yourRoleFilter, enemyRoleFilter]
  )

  const color = result.winrate >= 60 ? 'text-green-400' : result.winrate >= 50 ? 'text-yellow-400' : 'text-red-400'

  const enemyLabel = enemyAgents.size === 0
    ? 'Any comp'
    : enemyMode === 'include'
      ? [...enemyAgents].join(', ')
      : `No ${[...enemyAgents].join(', ')}`

  return (
    <div>
      <div className="flex gap-4">
        <div className="flex-1"><RoleFilterBar filter={yourRoleFilter} onChange={setYourRoleFilter} label="Your Comp Roles" /></div>
        <div className="flex-1"><RoleFilterBar filter={enemyRoleFilter} onChange={setEnemyRoleFilter} label="Enemy Comp Roles" /></div>
      </div>
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
          <div className="flex gap-1 bg-vct-900 rounded-lg p-1 w-fit">
            {(['include', 'exclude'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setEnemyMode(mode)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  enemyMode === mode ? 'bg-vct-700 text-white shadow-sm' : 'text-gray-400 hover:text-white'
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

      <div className="bg-vct-800 border border-white/10 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Map</p>
          {selectedMaps.size > 0 && (
            <button onClick={() => setSelectedMaps(new Set())} className="text-xs text-gray-400 hover:text-white transition-colors">
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
                  ? 'bg-vct-700 text-white'
                  : 'bg-vct-900 border border-white/10 text-gray-300 hover:border-white/40'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        {selectedMaps.size > 0 && (
          <p className="text-xs text-gray-400 mt-3">
            Filtering to: <span className="font-medium text-gray-300">{[...selectedMaps].join(', ')}</span>
          </p>
        )}
      </div>

      {result.total === 0 ? (
        <p className="text-gray-400 text-sm">No matchups found for the selected cores.</p>
      ) : (
        <>
          <div className="bg-vct-800 border border-white/10 rounded-lg p-5 mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              {yourAgents.size > 0 ? [...yourAgents].join(', ') : 'Any comp'}
              {' '}<span className="text-white/30">vs</span>{' '}
              {enemyLabel}
            </p>
            <div className="flex items-end gap-6">
              <span className={`text-4xl font-bold ${color}`}>{result.winrate}%</span>
              <div className="text-sm text-gray-400 pb-1 space-x-4">
                <span className="font-medium text-green-400">{result.wins}W</span>
                <span className="font-medium text-red-400">{result.losses}L</span>
                <span>{result.total} maps</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-vct-900 text-white">
                  <th className="text-left px-4 py-2 font-medium">Map</th>
                  <th className="text-left px-4 py-2 font-medium">Your Comp</th>
                  <th className="text-left px-4 py-2 font-medium">Enemy Comp</th>
                  <th className="px-4 py-2 font-medium text-center">Result</th>
                </tr>
              </thead>
              <tbody>
                {result.matchups.map((m, i) => (
                  <MatchupTableRow key={i} row={m} index={i} yourAgents={yourAgents} enemyAgents={enemyAgents} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
