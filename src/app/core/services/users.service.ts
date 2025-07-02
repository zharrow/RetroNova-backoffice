// src/app/core/services/users.service.ts

import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { User, UserCreate, UserUpdate, UserSearchResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private readonly apiService = inject(ApiService);
  
  // Signal pour la liste des utilisateurs en cache
  private readonly usersSignal = signal<User[]>([]);
  readonly users = this.usersSignal.asReadonly();
  
  /**
   * Récupère tous les utilisateurs (actifs)
   */
  getAllUsers(): Observable<User[]> {
    return this.apiService.get<User[]>('/admin/users/deleted').pipe(
      tap(users => this.usersSignal.set(users))
    );
  }
  
  /**
   * Récupère les utilisateurs supprimés (admin uniquement)
   */
  getDeletedUsers(): Observable<User[]> {
    return this.apiService.get<User[]>('/admin/users/deleted');
  }
  
  /**
   * Récupère un utilisateur par son ID
   */
  getUserById(id: string): Observable<User> {
    return this.apiService.get<User>(`/users/${id}`);
  }
  
  /**
   * Recherche des utilisateurs
   */
  searchUsers(query: string, limit: number = 10): Observable<UserSearchResponse[]> {
    return this.apiService.get<UserSearchResponse[]>('/users/search', {
      q: query,
      limit
    });
  }
  
  /**
   * Met à jour le profil de l'utilisateur connecté
   */
  updateMyProfile(userData: UserUpdate): Observable<User> {
    return this.apiService.put<User>('/users/me', userData);
  }
  
  /**
   * Met à jour les tickets d'un utilisateur (admin)
   */
  updateUserTickets(userId: string, ticketsToAdd: number): Observable<any> {
    return this.apiService.put(`/admin/users/tickets`, {
      user_id: userId,
      tickets_to_add: ticketsToAdd
    });
  }
  
  /**
   * Supprime (soft delete) un utilisateur
   */
  deleteUser(userId: string | undefined): Observable<any> {
    return this.apiService.delete(`/users/${userId}`);
  }
  
  /**
   * Restaure un utilisateur supprimé (admin)
   */
  restoreUser(userId: string): Observable<any> {
    return this.apiService.put(`/admin/users/${userId}/restore`, {});
  }
  
  /**
   * Efface le cache des utilisateurs
   */
  clearCache(): void {
    this.usersSignal.set([]);
  }
}