import { useMemo } from 'react'
import type { MapRecord } from '../../types'
import { calcTeamWinRates } from '../../lib/analysisUtils'
import WinrateBadge from './WinrateBadge'

export default function TeamWinRateView({ records }: { records: MapRecord[] }) {
  const rows = useMemo(() => calcTeamWinRates(records), [records])

  if (!rows.length) return <p className="text-gray-400 text-sm">No data.</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-vct-900 text-white">
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
            <tr key={r.team} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-vct-800' : 'bg-vct-900'}`}>
              <td className="px-4 py-2 text-gray-400 text-xs">{i + 1}</td>
              <td className="px-4 py-2 font-medium text-white">{r.team}</td>
              <td className="px-4 py-2 text-center text-green-400 font-medium">{r.wins}</td>
              <td className="px-4 py-2 text-center text-red-400 font-medium">{r.losses}</td>
              <td className="px-4 py-2 text-center text-gray-400">{r.total}</td>
              <td className="px-4 py-2 text-center"><WinrateBadge value={r.winrate} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
