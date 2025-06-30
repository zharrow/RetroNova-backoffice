export interface Game {
  id: number;
  nom: string;
  description?: string;
  min_players: number;
  max_players: number;
  ticket_cost: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  is_deleted: boolean;
}

export interface GameCreate {
  nom: string;
  description?: string;
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