import { UUID } from 'angular2-uuid';

export interface User {
  id: UUID;
  publique_id: string;
  firebase_id: string;
  first_name: string | null;
  last_name: string | null;
  nb_ticket: number;
  bar: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  is_deleted: boolean;
}

export interface UserCreate {
  first_name?: string;
  last_name?: string;
  nb_ticket?: number;
  bar?: boolean;
  firebase_id: string;
}

export interface UserUpdate {
  first_name?: string;
  last_name?: string;
  nb_ticket?: number;
  bar?: boolean;
  firebase_id?: string;
}