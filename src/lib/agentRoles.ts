export type Role = 'Duelist' | 'Initiator' | 'Controller' | 'Sentinel' | 'Unknown'

export const ROLE_COLORS: Record<Role, string> = {
  Duelist:    'bg-red-500/15 text-red-300 border-red-500/30',
  Initiator:  'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  Controller: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  Sentinel:   'bg-green-500/15 text-green-300 border-green-500/30',
  Unknown:    'bg-white/5 text-gray-400 border-white/10',
}

export const AGENT_ROLES: Record<string, Role> = {
  // Duelists
  Jett: 'Duelist', Neon: 'Duelist', Raze: 'Duelist',
  Phoenix: 'Duelist', Yoru: 'Duelist', Iso: 'Duelist', Waylay: 'Duelist',
  // Initiators
  Sova: 'Initiator', Skye: 'Initiator', Fade: 'Initiator',
  Gekko: 'Initiator', Kayo: 'Initiator', Tejo: 'Initiator',
  // Controllers
  Omen: 'Controller', Astra: 'Controller', Brimstone: 'Controller',
  Viper: 'Controller', Harbor: 'Controller',
  // Sentinels
  Cypher: 'Sentinel', Killjoy: 'Sentinel', Chamber: 'Sentinel', Vyse: 'Sentinel', Veto: 'Sentinel',
  // Controllers
  Miks: 'Controller',
}

export const ROLES: Role[] = ['Duelist', 'Initiator', 'Controller', 'Sentinel']

export function getRoleCounts(comp: string[]): Record<Role, number> {
  const counts: Record<Role, number> = { Duelist: 0, Initiator: 0, Controller: 0, Sentinel: 0, Unknown: 0 }
  for (const agent of comp) {
    const role = AGENT_ROLES[agent] ?? 'Unknown'
    counts[role]++
  }
  return counts
}

export function matchesRoleFilter(comp: string[], filter: Record<Role, number>): boolean {
  const counts = getRoleCounts(comp)
  return ROLES.every(r => counts[r] >= filter[r])
}
