import { useMemo, useState } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import type { AgentStat } from '../../lib/visualizationUtils'
import { ROLES } from '../../lib/agentRoles'
import type { Role } from '../../lib/agentRoles'

const ROLE_COLORS: Record<Role, string> = {
  Duelist:    '#f87171',
  Initiator:  '#fbbf24',
  Controller: '#60a5fa',
  Sentinel:   '#4ade80',
  Unknown:    '#9ca3af',
}

function agentImg(name: string) {
  return `/agents/${name.toLowerCase()}.png`
}
function AgentDot(props: any) {
  const { cx, cy, payload } = props
  if (cx == null || cy == null) return null
  const color = ROLE_COLORS[payload.role as Role] ?? '#9ca3af'
  const r = Math.max(8, Math.min(18, Math.sqrt(payload.appearances) * 1.8))
  const clipId = `clip-${payload.agent}`
  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>
      <circle cx={cx} cy={cy} r={r + 1.5} fill={color} fillOpacity={0.2} stroke={color} strokeWidth={1.5} strokeOpacity={0.7} />
      <image
        href={agentImg(payload.agent)}
        x={cx - r}
        y={cy - r}
        width={r * 2}
        height={r * 2}
        clipPath={`url(#${clipId})`}
        preserveAspectRatio="xMidYMid slice"
      />
      <text x={cx} y={cy - r - 5} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize={9} fontFamily="IBM Plex Sans,sans-serif">
        {payload.agent}
      </text>
    </g>
  )
}

function AgentTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d: AgentStat = payload[0]?.payload
  if (!d) return null
  const color = ROLE_COLORS[d.role] ?? '#9ca3af'
  return (
    <div className="bg-vct-900 border border-white/10 rounded-lg p-3 text-xs shadow-xl">
      <p className="font-bold text-white text-sm mb-0.5">{d.agent}</p>
      <p className="mb-2 font-medium" style={{ color }}>{d.role}</p>
      <div className="space-y-1 text-gray-300">
        <p>Win Rate <span className="font-bold text-white float-right ml-6">{d.winrate}%</span></p>
        <p>Pick Rate <span className="font-bold text-white float-right ml-6">{d.pickrate}%</span></p>
        <p>Appearances <span className="font-bold text-white float-right ml-6">{d.appearances}</span></p>
      </div>
    </div>
  )
}

export default function AgentScatterView({ stats, minAppearances }: { stats: AgentStat[]; minAppearances: number }) {
  const [hiddenRoles, setHiddenRoles] = useState<Set<Role>>(new Set())

  const filtered = useMemo(
    () => stats.filter(s => s.appearances >= minAppearances && !hiddenRoles.has(s.role)),
    [stats, minAppearances, hiddenRoles]
  )

  const avgPickRate = useMemo(
    () => filtered.length > 0
      ? Math.round(filtered.reduce((s, a) => s + a.pickrate, 0) / filtered.length * 10) / 10
      : 0,
    [filtered]
  )

  const toggleRole = (role: Role) => {
    setHiddenRoles(prev => {
      const next = new Set(prev)
      next.has(role) ? next.delete(role) : next.add(role)
      return next
    })
  }

  return (
    <div className="bg-vct-800 border border-white/10 rounded-lg p-5">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-white font-semibold text-sm">Agent Pick Rate vs Win Rate</h3>
          <p className="text-gray-400 text-xs mt-0.5">Dot size = appearances. Reference lines at 50% win rate and average pick rate.</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          {ROLES.map(role => {
            const hidden = hiddenRoles.has(role)
            return (
              <button
                key={role}
                onClick={() => toggleRole(role)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-medium transition-colors ${
                  hidden ? 'border-white/10 text-gray-500' : 'border-white/20 text-white bg-white/5'
                }`}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: hidden ? '#374151' : ROLE_COLORS[role] }} />
                {role}
              </button>
            )
          })}
        </div>
      </div>

      {!filtered.length ? (
        <p className="text-gray-400 text-sm py-8 text-center">No agents match the current filters.</p>
      ) : (
        <ResponsiveContainer width="100%" height={480}>
          <ScatterChart margin={{ top: 24, right: 40, bottom: 36, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="pickrate"
              type="number"
              name="Pick Rate"
              unit="%"
              domain={[0, 'auto']}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              label={{ value: 'Pick Rate (%)', position: 'insideBottom', offset: -20, fill: '#4b5563', fontSize: 11 }}
            />
            <YAxis
              dataKey="winrate"
              type="number"
              name="Win Rate"
              unit="%"
              domain={[0, 100]}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              label={{ value: 'Win Rate (%)', angle: -90, position: 'insideLeft', offset: 15, fill: '#4b5563', fontSize: 11 }}
            />
            <Tooltip content={<AgentTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.15)' }} />
            <ReferenceLine y={50} stroke="rgba(255,255,255,0.12)" strokeDasharray="5 4" label={{ value: '50%', fill: '#4b5563', fontSize: 10, position: 'insideTopRight' }} />
            <ReferenceLine x={avgPickRate} stroke="rgba(255,255,255,0.12)" strokeDasharray="5 4" label={{ value: 'avg PR', fill: '#4b5563', fontSize: 10, position: 'insideTopLeft' }} />
            <Scatter data={filtered} shape={<AgentDot />} />
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
