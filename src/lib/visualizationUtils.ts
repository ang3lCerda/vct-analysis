import type { MapRecord } from '../types'
import { AGENT_ROLES } from './agentRoles'
import type { Role } from './agentRoles'

export interface AgentStat {
  agent: string
  role: Role
  appearances: number
  wins: number
  winrate: number
  pickrate: number
}

export function calcAgentStats(records: MapRecord[], mapFilter: Set<string> = new Set()): AgentStat[] {
  const filtered = mapFilter.size > 0 ? records.filter(r => mapFilter.has(r.map_name)) : records
  const total = filtered.length
  if (total === 0) return []

  const stats = new Map<string, { appearances: number; wins: number }>()

  for (const r of filtered) {
    const t1Won = r.winner_id === r.team1_id
    for (const agent of r.team1_comp) {
      const s = stats.get(agent) ?? { appearances: 0, wins: 0 }
      s.appearances++
      if (t1Won) s.wins++
      stats.set(agent, s)
    }
    for (const agent of r.team2_comp) {
      const s = stats.get(agent) ?? { appearances: 0, wins: 0 }
      s.appearances++
      if (!t1Won) s.wins++
      stats.set(agent, s)
    }
  }

  const totalSlots = total * 2

  return Array.from(stats.entries())
    .map(([agent, s]) => ({
      agent,
      role: (AGENT_ROLES[agent] ?? 'Unknown') as Role,
      appearances: s.appearances,
      wins: s.wins,
      winrate: s.appearances > 0 ? Math.round((s.wins / s.appearances) * 1000) / 10 : 0,
      pickrate: Math.round((s.appearances / totalSlots) * 1000) / 10,
    }))
    .sort((a, b) => b.appearances - a.appearances)
}

// ─── Team × Map heatmap ───────────────────────────────────────────────────────

export interface TeamMapStat {
  team: string
  map: string
  wins: number
  losses: number
  total: number
  winrate: number
}

export interface TeamMapResult {
  cells: Map<string, Map<string, TeamMapStat>>   // cells.get(team)?.get(map)
  teams: string[]                                 // default sort: overall WR desc
  maps: string[]                                  // alphabetical
  totals: Map<string, { wins: number; total: number; winrate: number }>
}

export function calcTeamMapStats(records: MapRecord[]): TeamMapResult {
  const cells = new Map<string, Map<string, { wins: number; total: number }>>()
  const rawTotals = new Map<string, { wins: number; total: number }>()

  const bump = (team: string, map: string, won: boolean) => {
    if (!cells.has(team)) cells.set(team, new Map())
    const row = cells.get(team)!
    const s = row.get(map) ?? { wins: 0, total: 0 }
    s.total++
    if (won) s.wins++
    row.set(map, s)

    const t = rawTotals.get(team) ?? { wins: 0, total: 0 }
    t.total++
    if (won) t.wins++
    rawTotals.set(team, t)
  }

  const mapSet = new Set<string>()
  for (const r of records) {
    const t1Won = r.winner_id === r.team1_id
    bump(r.team1, r.map_name, t1Won)
    bump(r.team2, r.map_name, !t1Won)
    mapSet.add(r.map_name)
  }

  const maps = [...mapSet].sort()

  const teams = Array.from(rawTotals.entries())
    .sort(([, a], [, b]) => {
      const wrA = a.total > 0 ? a.wins / a.total : 0
      const wrB = b.total > 0 ? b.wins / b.total : 0
      return wrB - wrA || b.total - a.total
    })
    .map(([team]) => team)

  const finalCells = new Map<string, Map<string, TeamMapStat>>()
  for (const [team, row] of cells) {
    const m = new Map<string, TeamMapStat>()
    for (const [map, s] of row) {
      m.set(map, {
        team, map,
        wins: s.wins,
        losses: s.total - s.wins,
        total: s.total,
        winrate: s.total > 0 ? Math.round((s.wins / s.total) * 1000) / 10 : 0,
      })
    }
    finalCells.set(team, m)
  }

  const totals = new Map<string, { wins: number; total: number; winrate: number }>()
  for (const [team, s] of rawTotals) {
    totals.set(team, {
      wins: s.wins,
      total: s.total,
      winrate: s.total > 0 ? Math.round((s.wins / s.total) * 1000) / 10 : 0,
    })
  }

  return { cells: finalCells, teams, maps, totals }
}

// ─── Agent Co-occurrence Matrix ───────────────────────────────────────────────

export interface CoMatrixResult {
  agents: string[]
  appearances: Map<string, number>
  pairs: Map<string, { coApps: number; coWins: number }>
  totalMaps: number
}

export function calcAgentCoMatrix(records: MapRecord[]): CoMatrixResult {
  const appearances = new Map<string, number>()
  const pairs = new Map<string, { coApps: number; coWins: number }>()

  for (const r of records) {
    const t1Won = r.winner_id === r.team1_id
    const processSide = (comp: string[], won: boolean) => {
      for (const a of comp) appearances.set(a, (appearances.get(a) ?? 0) + 1)
      for (let i = 0; i < comp.length; i++) {
        for (let j = i + 1; j < comp.length; j++) {
          const key = [comp[i], comp[j]].sort().join('|')
          const s = pairs.get(key) ?? { coApps: 0, coWins: 0 }
          s.coApps++
          if (won) s.coWins++
          pairs.set(key, s)
        }
      }
    }
    processSide(r.team1_comp, t1Won)
    processSide(r.team2_comp, !t1Won)
  }

  const agents = Array.from(appearances.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([a]) => a)

  return { agents, appearances, pairs, totalMaps: records.length }
}
