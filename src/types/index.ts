export interface CompAnalysisRecord {
  _id: string
  map_id: string
  match_id: string
  event_id: string
  map_name: string
  team: string
  team_id: string
  comp: string[]
  opponent: string
  opponent_id: string
  rounds_won: string
  rounds_lost: string
  attack_rounds_won: string
  defense_rounds_won: string
  won: boolean
}

export interface CompAnalysisResponse {
  status: string
  count: number
  data: CompAnalysisRecord[]
}

export interface MapPlay {
  map_id: string
  map_name: string
  team1: string
  team1_comp: string[]
  team1_rounds: string
  team1_atk: string
  team1_def: string
  team1_won: boolean
  team2: string
  team2_comp: string[]
  team2_rounds: string
  team2_atk: string
  team2_def: string
}

export interface Match {
  match_id: string
  team1: string
  team2: string
  team1_maps_won: number
  team2_maps_won: number
  maps: MapPlay[]
}

// Legacy performance types
export interface PlayerStat {
  name: string
  '2k': string
  '3k': string
  '4k': string
  '5k': string
  '1v1': string
  '1v2': string
  '1v3': string
  '1v4': string
  '1v5': string
  econ: string
  pl: string
  de: string
  event_id: string
  match_id: string
  game_id: string
}

export interface MatchPerformance {
  _id: string
  url: string
  stats: PlayerStat[]
}

export interface PerformanceResponse {
  status: string
  count: number
  data: MatchPerformance[]
}
