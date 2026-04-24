import { useMemo, useState } from 'react'
import type { MapRecord } from '../../types'
import { calcTeamMapStats } from '../../lib/visualizationUtils'

function cellBg(winrate: number): string {
  const t = Math.abs(winrate - 50) / 50
  return winrate >= 50
    ? `rgba(74, 222, 128, ${t * 0.48})`
    : `rgba(248, 113, 113, ${t * 0.48})`
}

function winrateText(winrate: number): string {
  if (winrate >= 60) return 'text-green-300'
  if (winrate >= 50) return 'text-green-400/80'
  if (winrate > 40)  return 'text-red-400/80'
  return 'text-red-300'
}

export default function TeamMapHeatmap({ records }: { records: MapRecord[] }) {
  const [sortBy, setSortBy] = useState<'winrate' | 'name' | 'games'>('winrate')
  const [minGames, setMinGames] = useState(1)

  const { cells, teams: allTeams, maps, totals } = useMemo(
    () => calcTeamMapStats(records),
    [records]
  )

  const teams = useMemo(() => {
    let t = allTeams.filter(team => (totals.get(team)?.total ?? 0) >= minGames)
    if (sortBy === 'name')   t = [...t].sort((a, b) => a.localeCompare(b))
    if (sortBy === 'games')  t = [...t].sort((a, b) => (totals.get(b)?.total ?? 0) - (totals.get(a)?.total ?? 0))
    return t
  }, [allTeams, minGames, sortBy, totals])

  if (!records.length) return <p className="text-gray-400 text-sm">No data.</p>

  return (
    <div className="bg-vct-800 border border-white/10 rounded-lg overflow-hidden">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 border-b border-white/5">
        <div>
          <h3 className="text-white font-semibold text-sm">Team × Map Win Rate</h3>
          <p className="text-gray-400 text-xs mt-0.5">{teams.length} teams · {maps.length} maps</p>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Sort</span>
            <div className="flex gap-1 bg-vct-900 rounded p-0.5">
              {([['winrate', 'Win Rate'], ['games', 'Games'], ['name', 'Name']] as const).map(([val, label]) => (
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

          {/* Min games */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Min Maps</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setMinGames(n => Math.max(1, n - 1))}
                className="w-5 h-5 rounded bg-vct-900 border border-white/10 text-gray-300 hover:border-white/40 text-xs flex items-center justify-center transition-colors"
              >−</button>
              <span className="text-white font-bold text-xs w-4 text-center">{minGames}</span>
              <button
                onClick={() => setMinGames(n => n + 1)}
                className="w-5 h-5 rounded bg-vct-900 border border-white/10 text-gray-300 hover:border-white/40 text-xs flex items-center justify-center transition-colors"
              >+</button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto max-h-[620px]">
        <table className="border-collapse text-xs w-full">
          <thead>
            <tr className="sticky top-0 z-20 bg-vct-900">
              <th className="sticky left-0 z-30 bg-vct-900 text-left px-4 py-3 font-semibold text-gray-400 uppercase tracking-wider border-b border-r border-white/5 min-w-[160px]">
                Team
              </th>
              {maps.map(map => (
                <th key={map} className="px-2 py-3 font-semibold text-gray-400 uppercase tracking-wider border-b border-white/5 text-center min-w-[80px] whitespace-nowrap">
                  {map}
                </th>
              ))}
              <th className="px-3 py-3 font-semibold text-gray-400 uppercase tracking-wider border-b border-l border-white/5 text-center min-w-[80px]">
                Overall
              </th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, i) => {
              const overall = totals.get(team)
              return (
                <tr key={team} className={i % 2 === 0 ? 'bg-vct-800' : 'bg-vct-900'}>
                  {/* Team name — sticky */}
                  <td className={`sticky left-0 z-10 px-4 py-2.5 border-r border-white/5 ${i % 2 === 0 ? 'bg-vct-800' : 'bg-vct-900'}`}>
                    <div className="font-medium text-white truncate max-w-[148px]">{team}</div>
                    <div className="text-gray-500 text-[10px] mt-0.5">{overall?.total ?? 0} maps</div>
                  </td>

                  {/* Map cells */}
                  {maps.map(map => {
                    const stat = cells.get(team)?.get(map)
                    if (!stat) {
                      return (
                        <td key={map} className="px-2 py-2.5 text-center border-white/5">
                          <span className="text-gray-600">—</span>
                        </td>
                      )
                    }
                    return (
                      <td
                        key={map}
                        className="px-2 py-2.5 text-center border-white/5 transition-colors"
                        style={{ backgroundColor: cellBg(stat.winrate) }}
                        title={`${team} on ${map}: ${stat.wins}W ${stat.losses}L`}
                      >
                        <div className={`font-bold text-sm leading-none ${winrateText(stat.winrate)}`}>
                          {stat.winrate}%
                        </div>
                        <div className="text-gray-400 text-[10px] mt-1 leading-none">
                          {stat.wins}W {stat.losses}L
                        </div>
                      </td>
                    )
                  })}

                  {/* Overall — sticky right side */}
                  <td
                    className="px-3 py-2.5 text-center border-l border-white/5"
                    style={{ backgroundColor: overall ? cellBg(overall.winrate) : undefined }}
                  >
                    {overall && (
                      <>
                        <div className={`font-bold text-sm leading-none ${winrateText(overall.winrate)}`}>
                          {overall.winrate}%
                        </div>
                        <div className="text-gray-400 text-[10px] mt-1 leading-none">
                          {overall.wins}W {overall.total - overall.wins}L
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-white/5">
        <span className="text-xs text-gray-500">Win rate</span>
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
      </div>
    </div>
  )
}
