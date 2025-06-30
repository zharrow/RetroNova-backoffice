import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Game, GameCreate, GameUpdate } from '../models/game.model';

@Injectable({
  providedIn: 'root'
})
export class GamesService {
  constructor(private apiService: ApiService) {}
  
  getAllGames(includeDeleted: boolean = false): Observable<Game[]> {
    return this.apiService.get<Game[]>('/games', { include_deleted: includeDeleted });
  }
  
  getGameById(id: string, includeDeleted: boolean = false): Observable<Game> {
    return this.apiService.get<Game>(`/games/${id}`, { include_deleted: includeDeleted });
  }
  
  createGame(game: GameCreate): Observable<Game> {
    return this.apiService.post<Game>('/admin/games/', game);
  }
  
  updateGame(id: string, game: GameUpdate): Observable<Game> {
    return this.apiService.put<Game>(`/games/${id}`, game);
  }
  
  deleteGame(id: string, hardDelete: boolean = false): Observable<any> {
    return this.apiService.delete(`/games/${id}`, { hard_delete: hardDelete });
  }
  
  restoreGame(id: string): Observable<Game> {
    return this.apiService.post<Game>(`/games/${id}/restore`, {});
  }
}