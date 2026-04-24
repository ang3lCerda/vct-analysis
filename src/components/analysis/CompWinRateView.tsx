import { useState, useMemo } from 'react'
import type { MapRecord } from '../../types'
import { calcCompWinRates, emptyRoleFilter, type RoleFilter, type CompGame } from '../../lib/analysisUtils'
import RoleFilterBar from './RoleFilterBar'
import AgentPill from './AgentPill'
import WinrateBadge from './WinrateBadge'

function CompRow({ row, index, selectedAgents }: {
  row: { comp: string[]; wins: number; losses: number; total: number; winrate: number; games: CompGame[] }
  index: number
  selectedAgents: Set<string>
}) {
  const [open, setOpen] = useState(false)
  const bg = index % 2 === 0 ? 'bg-vct-800' : 'bg-vct-900'

  return (
    <>
      <tr
        className={`border-b border-white/5 ${bg} cursor-pointer hover:bg-white/5 transition-colors`}
        onClick={() => setOpen(o => !o)}
      >
        <td className="px-4 py-2 text-gray-400 text-xs">{index + 1}</td>
        <td className="px-4 py-2">
          <div className="flex flex-wrap gap-1">
            {row.comp.map(a => (
              <span key={a} className={`inline-block text-xs px-2 py-0.5 rounded font-medium ${
                selectedAgents.has(a) ? 'bg-vct-700 text-white' : 'bg-vct-900 text-gray-300'
              }`}>{a}</span>
            ))}
          </div>
        </td>
        <td className="px-4 py-2 text-center text-green-400 font-medium">{row.wins}</td>
        <td className="px-4 py-2 text-center text-red-400 font-medium">{row.losses}</td>
        <td className="px-4 py-2 text-center text-gray-400">{row.total}</td>
        <td className="px-4 py-2 text-center">
          <div className="flex items-center justify-center gap-2">
            <WinrateBadge value={row.winrate} />
            <span className="text-white/20 text-xs">{open ? '▲' : '▼'}</span>
          </div>
        </td>
      </tr>
      {open && (
        <tr className={bg}>
          <td />
          <td colSpan={5} className="px-4 pb-3 pt-1">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="text-gray-400 border-b border-white/10">
                  <th className="text-left py-1 font-medium">Team</th>
                  <th className="text-left py-1 font-medium">Opponent</th>
                  <th className="text-left py-1 font-medium">Map</th>
                  <th className="text-center py-1 font-medium">Score</th>
                  <th className="text-center py-1 font-medium">Result</th>
                </tr>
              </thead>
              <tbody>
                {row.games.map((g, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0">
                    <td className="py-1 font-medium text-gray-200">{g.team}</td>
                    <td className="py-1 text-gray-400">{g.opponent}</td>
                    <td className="py-1 text-gray-400">{g.map}</td>
                    <td className="py-1 text-center font-mono text-gray-200">{g.score}</td>
                    <td className="py-1 text-center font-bold">
                      <span className={g.won ? 'text-green-400' : 'text-red-400'}>{g.won ? 'W' : 'L'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  )
}

export default function CompWinRateView({ records }: { records: MapRecord[] }) {
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set())
  const [roleFilter, setRoleFilter] = useState<RoleFilter>(emptyRoleFilter())
  const [enemyRoleFilter, setEnemyRoleFilter] = useState<RoleFilter>(emptyRoleFilter())

  const allAgents = useMemo(() => {
    const s = new Set<string>()
    for (const r of records) {
      r.team1_comp.forEach(a => s.add(a))
      r.team2_comp.forEach(a => s.add(a))
    }
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
    () => calcCompWinRates(records, [...selectedAgents], roleFilter, enemyRoleFilter),
    [records, selectedAgents, roleFilter, enemyRoleFilter]
  )

  return (
    <div>
      <div className="flex gap-4">
        <div className="flex-1"><RoleFilterBar filter={roleFilter} onChange={setRoleFilter} label="Your Comp Roles" /></div>
        <div className="flex-1"><RoleFilterBar filter={enemyRoleFilter} onChange={setEnemyRoleFilter} label="Enemy Comp Roles" /></div>
      </div>
      <div className="bg-vct-800 border border-white/10 rounded-lg p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Filter by Agent
          </p>
          {selectedAgents.size > 0 && (
            <button
              onClick={() => setSelectedAgents(new Set())}
              className="text-xs text-gray-400 hover:text-white transition-colors"
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
            Showing comps containing: <span className="font-medium text-gray-300">{[...selectedAgents].join(', ')}</span>
            {' '}— {rows.length} comp{rows.length !== 1 ? 's' : ''} found
          </p>
        )}
      </div>

      {!rows.length ? (
        <p className="text-gray-400 text-sm">No comps match the selected agents.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-vct-900 text-white">
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
                  <CompRow key={[...r.comp].sort().join(',')} row={r} index={i} selectedAgents={selectedAgents} />
                ))}
              </tbody>
            </table>
          </div>

          {selectedAgents.size > 0 && (() => {
            const totalWins = rows.reduce((s, r) => s + r.wins, 0)
            const totalMaps = rows.reduce((s, r) => s + r.total, 0)
            const overallWR = totalMaps > 0 ? Math.round((totalWins / totalMaps) * 1000) / 10 : 0
            const color = overallWR >= 60 ? 'text-green-400' : overallWR >= 50 ? 'text-yellow-400' : 'text-red-400'
            return (
              <div className="mt-6 bg-vct-800 border border-white/10 rounded-lg p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                  Overall Win Rate — Core: {[...selectedAgents].join(', ')}
                </p>
                <div className="flex items-end gap-6">
                  <div>
                    <span className={`text-4xl font-bold ${color}`}>{overallWR}%</span>
                  </div>
                  <div className="text-sm text-gray-400 pb-1 space-x-4">
                    <span><span className="font-medium text-green-400">{totalWins}W</span></span>
                    <span><span className="font-medium text-red-400">{totalMaps - totalWins}L</span></span>
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
