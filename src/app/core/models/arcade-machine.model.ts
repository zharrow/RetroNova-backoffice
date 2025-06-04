import { UUID } from 'angular2-uuid';

export interface ArcadeMachine {
  id: UUID;
  name: string | null;
  description: string | null;
  localisation: string | null;
  game1_id: UUID | null;
  game2_id: UUID | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  is_deleted: boolean;
}

export interface ArcadeMachineCreate {
  name: string;
  description?: string;
  localisation?: string;
  game1_id: UUID;
  game2_id?: UUID;
}

export interface ArcadeMachineUpdate {
  name?: string;
  description?: string;
  localisation?: string;
  game1_id?: UUID;
  game2_id?: UUID;
}