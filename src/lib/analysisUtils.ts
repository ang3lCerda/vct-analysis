import type { MapRecord } from '../types'
import { matchesRoleFilter } from './agentRoles'
import type { Role } from './agentRoles'

export type RoleFilter = Record<Role, number>
export const emptyRoleFilter = (): RoleFilter => ({ Duelist: 0, Initiator: 0, Controller: 0, Sentinel: 0, Unknown: 0 })

export interface CompGame {
  team: string
  opponent: string
  map: string
  score: string
  won: boolean
}

export interface MatchupRow {
  yourComp: string[]
  enemyComp: string[]
  map: string
  won: boolean
  team: string
  opponent: string
  score: string
}

export function calcTeamWinRates(records: MapRecord[]) {
  const stats = new Map<string, { wins: number; total: number }>()
  for (const r of records) {
    const t1Won = r.winner_id === r.team1_id
    const s1 = stats.get(r.team1) ?? { wins: 0, total: 0 }
    s1.total++; if (t1Won) s1.wins++
    stats.set(r.team1, s1)
    const s2 = stats.get(r.team2) ?? { wins: 0, total: 0 }
    s2.total++; if (!t1Won) s2.wins++
    stats.set(r.team2, s2)
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

export function calcCompWinRates(records: MapRecord[], requiredAgents: string[], roleFilter: RoleFilter, enemyRoleFilter: RoleFilter = emptyRoleFilter()) {
  const stats = new Map<string, { wins: number; total: number; comp: string[]; games: CompGame[] }>()
  for (const r of records) {
    const t1Won = r.winner_id === r.team1_id
    const sides: [string[], string[], boolean, string, string, string, string][] = [
      [r.team1_comp, r.team2_comp, t1Won,  r.team1, r.team2, `${r.team1_rounds}-${r.team2_rounds}`, r.map_name],
      [r.team2_comp, r.team1_comp, !t1Won, r.team2, r.team1, `${r.team2_rounds}-${r.team1_rounds}`, r.map_name],
    ]
    for (const [comp, enemyComp, won, team, opponent, score, map] of sides) {
      if (requiredAgents.length > 0 && !requiredAgents.every(a => comp.includes(a))) continue
      if (!matchesRoleFilter(comp, roleFilter)) continue
      if (!matchesRoleFilter(enemyComp, enemyRoleFilter)) continue
      const key = [...comp].sort().join(',')
      const s = stats.get(key) ?? { wins: 0, total: 0, comp, games: [] }
      s.total++; if (won) s.wins++
      s.games.push({ team, opponent, map, score, won })
      stats.set(key, s)
    }
  }
  return Array.from(stats.values())
    .map(s => ({
      comp: s.comp,
      wins: s.wins,
      losses: s.total - s.wins,
      total: s.total,
      winrate: s.total > 0 ? Math.round((s.wins / s.total) * 1000) / 10 : 0,
      games: s.games,
    }))
    .sort((a, b) => b.total - a.total || b.winrate - a.winrate)
}

export function calcMatchupWinRate(
  records: MapRecord[],
  yourAgents: string[],
  enemyAgents: string[],
  enemyMode: 'include' | 'exclude' = 'include',
  yourRoleFilter: RoleFilter = emptyRoleFilter(),
  enemyRoleFilter: RoleFilter = emptyRoleFilter(),
) {
  let wins = 0
  const matchups: MatchupRow[] = []

  const checkEnemy = (comp: string[]) => {
    if (!matchesRoleFilter(comp, enemyRoleFilter)) return false
    if (enemyAgents.length === 0) return true
    return enemyMode === 'include'
      ? enemyAgents.every(ag => comp.includes(ag))
      : !enemyAgents.some(ag => comp.includes(ag))
  }
  const checkYours = (comp: string[]) =>
    (yourAgents.length === 0 || yourAgents.every(ag => comp.includes(ag))) &&
    matchesRoleFilter(comp, yourRoleFilter)

  for (const r of records) {
    const t1Won = r.winner_id === r.team1_id
    if (checkYours(r.team1_comp) && checkEnemy(r.team2_comp)) {
      if (t1Won) wins++
      matchups.push({ yourComp: r.team1_comp, enemyComp: r.team2_comp, map: r.map_name, won: t1Won, team: r.team1, opponent: r.team2, score: `${r.team1_rounds}-${r.team2_rounds}` })
    } else if (checkYours(r.team2_comp) && checkEnemy(r.team1_comp)) {
      if (!t1Won) wins++
      matchups.push({ yourComp: r.team2_comp, enemyComp: r.team1_comp, map: r.map_name, won: !t1Won, team: r.team2, opponent: r.team1, score: `${r.team2_rounds}-${r.team1_rounds}` })
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