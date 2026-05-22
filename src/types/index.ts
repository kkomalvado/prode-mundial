export interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  role: 'admin' | 'player'
  created_at: string
}

export interface Match {
  id: string
  home_team: string
  away_team: string
  home_flag: string | null
  away_flag: string | null
  match_date: string
  stage: 'group' | 'round_of_16' | 'quarter' | 'semi' | 'third_place' | 'final'
  group_name: string | null
  venue: string | null
  home_score: number | null
  away_score: number | null
  status: 'upcoming' | 'live' | 'finished'
  created_at: string
}

export interface Prediction {
  id: string
  user_id: string
  match_id: string
  predicted_home: number
  predicted_away: number
  points_earned: number
  created_at: string
  updated_at: string
}

export interface TournamentPick {
  id: string
  user_id: string
  champion_team: string | null
  top_scorer: string | null
  champion_points: number
  scorer_points: number
  created_at: string
  updated_at: string
}

export interface TournamentSettings {
  id: number
  champion_team: string | null
  top_scorer: string | null
  predictions_locked: boolean
  tournament_name: string
  updated_at: string
}

export interface LeaderboardEntry {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  total_points: number
  exact_scores: number
  correct_results: number
  total_predictions: number
  rank: number
}

// Match con predicción del usuario adjunta
export type MatchWithPrediction = Match & {
  prediction?: Prediction | null
}
