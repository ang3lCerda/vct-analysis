import { useMemo, useState } from 'react'
import type { MapRecord } from '../../types'
import { calcAgentCoMatrix } from '../../lib/visualizationUtils'
import { AGENT_ROLES, ROLES, ROLE_COLORS } from '../../lib/agentRoles'
import type { Role } from '../../lib/agentRoles'

type DisplayMode = 'copick' | 'winrate'
type SortMode = 'pickrate' | 'role' | 'name'

const ROLE_TEXT: Record<Role, string> = {
  Duelist:    'text-red-300',
  Initiator:  'text-yellow-300',
  Controller: 'text-blue-300',
  Sentinel:   'text-green-300',
  Unknown:    'text-gray-400',
}

function agentImg(name: string) {
  return `/agents/${name.toLowerCase()}.png`
}

function coPick(coApps: number, appA: number, appB: number): number {
  const denom = Math.min(appA, appB)
  return denom > 0 ? coApps / denom : 0
}

function cellBgCoPick(rate: number): string {
  return `rgba(129, 155, 185, ${rate * 0.65})`
}

function cellBgWinRate(winrate: number): string {
  const t = Math.abs(winrate - 50) / 50
  return winrate >= 50
    ? `rgba(74, 222, 128, ${t * 0.48})`
    : `rgba(248, 113, 113, ${t * 0.48})`
}

function winrateText(wr: number): string {
  if (wr >= 60) return 'text-green-300'
  if (wr >= 50) return 'text-green-400/80'
  if (wr > 40)  return 'text-red-400/80'
  return 'text-red-300'
}

export default function AgentCoMatrix({ records }: { records: MapRecord[] }) {
  const [mode, setMode] = useState<DisplayMode>('copick')
  const [sortBy, setSortBy] = useState<SortMode>('pickrate')
  const [minCoApps, setMinCoApps] = useState(2)
  const [activeRoles, setActiveRoles] = useState<Set<Role>>(new Set(ROLES))

  const { agents: rawAgents, appearances, pairs, totalMaps } = useMemo(
    () => calcAgentCoMatrix(records),
    [records]
  )

  const agents = useMemo(() => {
    let filtered = rawAgents.filter(a => activeRoles.has(AGENT_ROLES[a] ?? 'Unknown'))
    if (sortBy === 'role') {
      filtered = [...filtered].sort((a, b) => {
        const ra = AGENT_ROLES[a] ?? 'Unknown'
        const rb = AGENT_ROLES[b] ?? 'Unknown'
        return ra.localeCompare(rb) || a.localeCompare(b)
      })
    } else if (sortBy === 'name') {
      filtered = [...filtered].sort((a, b) => a.localeCompare(b))
    }
    return filtered
  }, [rawAgents, sortBy, activeRoles])

  const toggleRole = (r: Role) => {
    setActiveRoles(prev => {
      const next = new Set(prev)
      next.has(r) ? next.delete(r) : next.add(r)
      return next
    })
  }

  if (!records.length) return <p className="text-gray-400 text-sm">No data.</p>

  return (
    <div className="bg-vct-800 border border-white/10 rounded-lg overflow-hidden">
      {/* Controls */}
      <div className="flex flex-wrap items-start gap-x-6 gap-y-3 px-5 py-4 border-b border-white/5">
        <div>
          <h3 className="text-white font-semibold text-sm">Agent Co-occurrence Matrix</h3>
          <p className="text-gray-400 text-xs mt-0.5">
            {agents.length} agents · {totalMaps} maps
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 ml-auto">
          {/* Role filter */}
          <div className="flex items-center gap-1.5">
            {ROLES.map(r => (
              <button
                key={r}
                onClick={() => toggleRole(r)}
                className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
                  activeRoles.has(r)
                    ? ROLE_COLORS[r]
                    : 'bg-transparent text-gray-600 border-white/5'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Display mode */}
          <div className="flex gap-1 bg-vct-900 rounded p-0.5">
            {([['copick', 'Co-pick Rate'], ['winrate', 'Win Rate Together']] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setMode(val)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  mode === val ? 'bg-vct-700 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Sort</span>
            <div className="flex gap-1 bg-vct-900 rounded p-0.5">
              {([['pickrate', 'Pick Rate'], ['role', 'Role'], ['name', 'Name']] as const).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setSortBy(val)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    sortBy === val ? 'bg-vct-700 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Min co-appearances */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Min Co-picks</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setMinCoApps(n => Math.max(1, n - 1))}
                className="w-5 h-5 rounded bg-vct-900 border border-white/10 text-gray-300 hover:border-white/40 text-xs flex items-center justify-center transition-colors"
              >−</button>
              <span className="text-white font-bold text-xs w-4 text-center">{minCoApps}</span>
              <button
                onClick={() => setMinCoApps(n => n + 1)}
                className="w-5 h-5 rounded bg-vct-900 border border-white/10 text-gray-300 hover:border-white/40 text-xs flex items-center justify-center transition-colors"
              >+</button>
            </div>
          </div>
        </div>
      </div>

      {/* Matrix table */}
      <div className="overflow-auto max-h-[640px]">
        <table className="border-collapse text-xs">
          <thead>
            <tr className="sticky top-0 z-20 bg-vct-900">
              {/* Corner */}
              <th className="sticky left-0 z-30 bg-vct-900 border-b border-r border-white/5 min-w-[140px] px-3 py-2" />
              {agents.map(col => {
                const role = AGENT_ROLES[col] ?? 'Unknown'
                return (
                  <th
                    key={col}
                    className="px-1 py-2 border-b border-white/5 text-center min-w-[48px] max-w-[48px]"
                    title={col}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <img
                        src={agentImg(col)}
                        alt={col}
                        className={`w-7 h-7 rounded object-cover ring-1 ${ROLE_TEXT[role].replace('text-', 'ring-').replace('300', '400/40')}`}
                      />
                      <span className={`text-[9px] font-medium leading-none ${ROLE_TEXT[role]}`}>
                        {col.length <= 4 ? col : col.slice(0, 4)}
                      </span>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {agents.map((rowAgent, ri) => {
              const rowApps = appearances.get(rowAgent) ?? 0
              const role = AGENT_ROLES[rowAgent] ?? 'Unknown'
              return (
                <tr key={rowAgent} className={ri % 2 === 0 ? 'bg-vct-800' : 'bg-vct-900'}>
                  {/* Row header */}
                  <td className={`sticky left-0 z-10 px-3 py-2 border-r border-white/5 ${ri % 2 === 0 ? 'bg-vct-800' : 'bg-vct-900'}`}>
                    <div className="flex items-center gap-2">
                      <img src={agentImg(rowAgent)} alt={rowAgent} className="w-7 h-7 rounded object-cover shrink-0" />
                      <div>
                        <div className={`font-medium text-xs leading-none ${ROLE_TEXT[role]}`}>{rowAgent}</div>
                        <div className="text-gray-500 text-[10px] mt-0.5">{rowApps} picks</div>
                      </div>
                    </div>
                  </td>

                  {/* Cells */}
                  {agents.map(colAgent => {
                    if (rowAgent === colAgent) {
                      return (
                        <td key={colAgent} className="px-1 py-2 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                          <span className="text-gray-600">—</span>
                        </td>
                      )
                    }

                    const key = [rowAgent, colAgent].sort().join('|')
                    const pair = pairs.get(key)

                    if (!pair || pair.coApps < minCoApps) {
                      return (
                        <td key={colAgent} className="px-1 py-2 text-center">
                          <span className="text-gray-700">·</span>
                        </td>
                      )
                    }

                    const colApps = appearances.get(colAgent) ?? 0

                    if (mode === 'copick') {
                      const rate = coPick(pair.coApps, rowApps, colApps)
                      const pct = Math.round(rate * 100)
                      return (
                        <td
                          key={colAgent}
                          className="px-1 py-2 text-center transition-colors"
                          style={{ backgroundColor: cellBgCoPick(rate) }}
                          title={`${rowAgent} + ${colAgent}: ${pair.coApps} together`}
                        >
                          <div className="font-bold text-white leading-none text-[11px]">{pct}%</div>
                          <div className="text-gray-400 text-[9px] mt-0.5 leading-none">{pair.coApps}×</div>
                        </td>
                      )
                    } else {
                      const wr = pair.coApps > 0 ? Math.round((pair.coWins / pair.coApps) * 1000) / 10 : 0
                      return (
                        <td
                          key={colAgent}
                          className="px-1 py-2 text-center transition-colors"
                          style={{ backgroundColor: cellBgWinRate(wr) }}
                          title={`${rowAgent} + ${colAgent}: ${pair.coWins}W ${pair.coApps - pair.coWins}L together`}
                        >
                          <div className={`font-bold text-[11px] leading-none ${winrateText(wr)}`}>{wr}%</div>
                          <div className="text-gray-400 text-[9px] mt-0.5 leading-none">{pair.coApps}×</div>
                        </td>
                      )
                    }
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-4 px-5 py-3 border-t border-white/5">
        {mode === 'copick' ? (
          <>
            <span className="text-xs text-gray-500">Co-pick rate (relative to least-picked agent)</span>
            <div className="flex items-center gap-1">
              <div className="w-6 h-3 rounded-sm bg-vct-800 border border-white/10" />
              <span className="text-[10px] text-gray-500">0%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-3 rounded-sm" style={{ backgroundColor: 'rgba(129,155,185,0.65)' }} />
              <span className="text-[10px] text-gray-500">100%</span>
            </div>
          </>
        ) : (
          <>
            <span className="text-xs text-gray-500">Win rate when picked together</span>
            <div className="flex items-center gap-1">
              <div className="w-6 h-3 rounded-sm" style={{ backgroundColor: 'rgba(248,113,113,0.48)' }} />
              <span className="text-[10px] text-gray-500">0%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-3 rounded-sm bg-vct-800 border border-white/10" />
              <span className="text-[10px] text-gray-500">50%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-3 rounded-sm" style={{ backgroundColor: 'rgba(74,222,128,0.48)' }} />
              <span className="text-[10px] text-gray-500">100%</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
