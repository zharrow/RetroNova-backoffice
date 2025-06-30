export interface User {
  id: number;
  firebase_uid: string;
  email: string;
  nom: string;
  prenom: string;
  pseudo: string;
  date_naissance: Date;
  numero_telephone: string;
  tickets_balance: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserCreate {
  firebase_uid: string;
  email: string;
  nom: string;
  prenom: string;
  pseudo: string;
  date_naissance: Date;
  numero_telephone: string;
}

export interface UserUpdate {
  email?: string;
  nom?: string;
  prenom?: string;
  pseudo?: string;
  date_naissance?: Date;
  numero_telephone?: string;
}

export interface UserSearchResponse {
  id: number;
  pseudo: string;
  nom: string;
  prenom: string;
}