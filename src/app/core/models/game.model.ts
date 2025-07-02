// src/app/core/models/game.model.ts

export interface Game {
  id: number;
  nom: string;
  description: string;
  min_players: number;
  max_players: number;
  ticket_cost: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  is_deleted: boolean;
  // Relations
  arcade_games?: ArcadeGameRelation[];
  scores?: GameScore[];
}

export interface GameCreate {
  nom: string;
  description: string;
  min_players: number;
  max_players: number;
  ticket_cost: number;
}

export interface GameUpdate {
  nom?: string;
  description?: string;
  min_players?: number;
  max_players?: number;
  ticket_cost?: number;
}

export interface ArcadeGameRelation {
  id: number;
  arcade_id: number;
  game_id: number;
  slot_number: number;
  arcade_name: string;
  arcade_location: string;
}

export interface GameScore {
  id: number;
  player_pseudo: string;
  score: number;
  created_at: string;
  arcade_name: string;
}

export interface GameStatistics {
  total_plays: number;
  average_score: number;
  best_score: number;
  total_revenue: number;
  active_arcades: number;
  last_played: string;
}

// Enums pour les types de jeux
export enum GameCategory {
  FIGHTING = 'fighting',
  ARCADE = 'arcade', 
  PUZZLE = 'puzzle',
  RACING = 'racing',
  SHOOTING = 'shooting',
  PLATFORM = 'platform',
  RETRO = 'retro'
}

export enum GameDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert'
}

// Interface étendue pour l'affichage
export interface EnrichedGame extends Game {
  readonly category?: GameCategory;
  readonly difficulty?: GameDifficulty;
  readonly popularity_score?: number;
  readonly weekly_plays?: number;
  readonly arcade_count?: number;
  readonly status?: 'active' | 'inactive' | 'maintenance';
}