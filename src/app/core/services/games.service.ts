import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { Game, GameCreate, GameUpdate } from '../models/game.model';

@Injectable({
  providedIn: 'root'
})
export class GamesService {
  private readonly apiService = inject(ApiService);
  
  // Signal pour la liste des jeux en cache
  private readonly gamesSignal = signal<Game[]>([]);
  readonly games = this.gamesSignal.asReadonly();

  /**
   * Récupère tous les jeux
   */
  getAllGames(): Observable<Game[]> {
    return this.apiService.get<Game[]>('/games').pipe(
      tap(games => this.gamesSignal.set(games))
    );
  }

  /**
   * Récupère un jeu par son ID
   */
  getGameById(id: string): Observable<Game> {
    return this.apiService.get<Game>(`/games/${id}`);
  }

  /**
   * Crée un nouveau jeu (admin)
   */
  createGame(gameData: GameCreate): Observable<Game> {
    return this.apiService.post<Game>('/admin/games', gameData).pipe(
      tap(newGame => {
        this.gamesSignal.update(games => [...games, newGame]);
      })
    );
  }

  /**
   * Met à jour un jeu (admin)
   */
  updateGame(id: string, gameData: GameUpdate): Observable<Game> {
    return this.apiService.put<Game>(`/admin/games/${id}`, gameData).pipe(
      tap(updatedGame => {
        this.gamesSignal.update(games => 
          games.map(game => game.id.toString() === id ? updatedGame : game)
        );
      })
    );
  }

  /**
   * Supprime un jeu (admin)
   */
  deleteGame(id: string): Observable<any> {
    return this.apiService.delete(`/admin/games/${id}`).pipe(
      tap(() => {
        this.gamesSignal.update(games => 
          games.filter(game => game.id.toString() !== id)
        );
      })
    );
  }

  /**
   * Efface le cache des jeux
   */
  clearCache(): void {
    this.gamesSignal.set([]);
  }
}