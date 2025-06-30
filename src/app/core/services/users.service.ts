import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { User, UserCreate, UserUpdate } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  constructor(private apiService: ApiService) {}
  
  // Affiche tous les utilisateurs supprimés si includeDeleted est vrai pour les restaurés
  getAllUsers(includeDeleted: boolean = false): Observable<User[]> {
    return this.apiService.get<User[]>('/admin/users/deleted', { include_deleted: includeDeleted });
  }
  
  getUserById(id: string, includeDeleted: boolean = false): Observable<User> {
    return this.apiService.get<User>(`/users/${id}`, { include_deleted: includeDeleted });
  }
  
  createUser(user: UserCreate): Observable<User> {
    return this.apiService.post<User>('/users', user);
  }
  
  updateUser(id: string, user: UserUpdate): Observable<User> {
    return this.apiService.put<User>(`/users/${id}`, user);
  }
  
  deleteUser(id: string, hardDelete: boolean = false): Observable<User> {
    return this.apiService.delete<User>(`/users/${id}`, { hard_delete: hardDelete });
  }
  
  restoreUser(id: string): Observable<User> {
    return this.apiService.post<User>(`/users/${id}/restore`, {});
  }
}