export enum FriendshipStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}

export interface Friendship {
  id: number;
  status: FriendshipStatus;
  requester: {
    id: number;
    pseudo: string;
    nom: string;
    prenom: string;
  };
  requested: {
    id: number;
    pseudo: string;
    nom: string;
    prenom: string;
  };
}

export interface FriendRequestCreate {
  user_id: number;
}