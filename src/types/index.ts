export interface MapRecord {
  _id: string
  map_id: string
  match_id: string
  event_id: string
  map_name: string
  team1: string
  team1_id: string
  team1_comp: string[]
  team1_rounds: string
  team1_attack_rounds: string
  team1_defense_rounds: string
  team2: string
  team2_id: string
  team2_comp: string[]
  team2_rounds: string
  team2_attack_rounds: string
  team2_defense_rounds: string
  winner_id: string
}

export interface MapRecordResponse {
  status: string
  count: number
  data: MapRecord[]
}

// EventsPage display types
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
