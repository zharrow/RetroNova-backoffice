export interface Score {
  id: number;
  player1_pseudo: string;
  player2_pseudo: string;
  game_name: string;
  arcade_name: string;
  score_j1: number;
  score_j2: number;
  winner_pseudo: string;
  created_at: string;
}

export interface CreateScoreRequest {
  player1_id: number;
  player2_id: number;
  game_id: number;
  arcade_id: number;
  score_j1: number;
  score_j2: number;
}

export interface PlayerStats {
  total_games: number;
  wins: number;
  losses: number;
  draws: number;
  win_rate: number;
}