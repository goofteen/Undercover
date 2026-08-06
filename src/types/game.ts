export type Role = 'civilian' | 'undercover' | 'mrwhite'
export type GamePhase =
  | 'lobby'
  | 'reveal'
  | 'description'
  | 'voting'
  | 'elimination'
  | 'mrwhite_guess'
  | 'gameover'
export type Winner = 'civilian' | 'impostor' | 'mrwhite' | null

export interface WordPair {
  civilian: string
  undercover: string
}

export interface Room {
  id: string
  room_code: string
  host_player_id: string
  status: 'lobby' | 'playing' | 'finished'
  undercover_count: number
  mrwhite_count: number
  turn_time_sec: number
  word_pair: WordPair | null
  created_at: string
}

export interface Player {
  id: string
  room_code: string
  name: string
  role: Role | null
  is_eliminated: boolean
  is_host: boolean
  join_order: number
  created_at: string
}

export interface GameState {
  room_code: string
  phase: GamePhase
  current_player_index: number
  round: number
  votes: Record<string, string[]> // voted_player_id -> [voter_player_id, ...]
  descriptions: Record<string, string> // player_id -> description text
  winner: Winner
  updated_at: string
}

export interface LocalPlayerInfo {
  id: string
  name: string
  room_code: string
  role: Role | null
  word: string | null // only known locally after reveal broadcast
}
