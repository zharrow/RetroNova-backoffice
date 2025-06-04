import { UUID } from 'angular2-uuid';

export interface Game {
  id: UUID;
  name: string;
  description: string | null;
  nb_max_player: number;
  nb_min_player: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  is_deleted: boolean;
}

export interface GameCreate {
  name: string;
  description?: string;
  nb_max_player: number;
  nb_min_player: number;
}

export interface GameUpdate {
  name?: string;
  description?: string;
  nb_max_player?: number;
  nb_min_player?: number;
}