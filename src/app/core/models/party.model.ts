import { UUID } from 'angular2-uuid';

export interface Party {
  id: UUID;
  player1_id: UUID;
  player2_id: UUID;
  game_id: UUID;
  machine_id: UUID;
  total_score: number | null;
  p1_score: number | null;
  p2_score: number | null;
  password: number | null;
  done: boolean;
  cancel: boolean;
  bar: boolean | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  is_deleted: boolean;
}