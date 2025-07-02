export interface User {
  id: number;
  firebase_uid: string;
  email: string;
  nom: string;
  prenom: string;
  pseudo: string;
  date_naissance: string; // ISO string format
  numero_telephone: string;
  tickets_balance: number;
  created_at: string; // ISO string format
  updated_at: string; // ISO string format
  deleted_at?: string | null;
  is_deleted: boolean;
}

export interface UserCreate {
  firebase_uid: string;
  email: string;
  nom: string;
  prenom: string;
  pseudo: string;
  date_naissance: string;
  numero_telephone: string;
}

export interface UserUpdate {
  email?: string;
  nom?: string;
  prenom?: string;
  pseudo?: string;
  date_naissance?: string;
  numero_telephone?: string;
}

export interface UserSearchResponse {
  id: number;
  pseudo: string;
  nom: string;
  prenom: string;
}

// Auth types pour Firebase
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export interface TokenData {
  sub: string;
  exp: number;
}