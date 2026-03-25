export type Driver = {
  id: string
  name: string
  team: string | null
  is_active: boolean
}

export type AdminDriver = Driver & {
  created_at: string
}

export type Season = {
  id: string
  year: number
}

export type RaceResult = {
  id: string
  event_id: string
  position_1_driver_id: string
  position_2_driver_id: string
  position_3_driver_id: string
  position_4_driver_id: string
  position_5_driver_id: string
  is_finalized: boolean
  created_at: string
}

export type RaceEvent = {
  id: string
  season_id: string
  round: number
  grand_prix_name: string
  session_type: 'Quali' | 'Race' | 'Sprint' | 'Sprint Quali'
  event_date: string
  prediction_deadline: string
  status: 'scheduled' | 'locked' | 'finished'
}

export type Prediction = {
  id: string
  user_id: string
  event_id: string
  position_1_driver_id: string
  position_2_driver_id: string
  position_3_driver_id: string
  position_4_driver_id: string
  position_5_driver_id: string
  submitted_at: string
  is_locked: boolean
}

export type LeaderboardRow = {
  user_id: string
  nickname: string
  total_score: number
}

export type SeriesEventLabel = {
  id: string
  round: number
  label: string
  grand_prix_name: string
  event_date: string
}

export type SeriesLine = {
  user_id: string
  nickname: string
  points: number[]
}
