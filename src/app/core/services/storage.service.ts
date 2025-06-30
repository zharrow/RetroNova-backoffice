import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { 
  Score,
  CreateScoreRequest,
  PlayerStats
} from '../models/score.model';

@Injectable({
  providedIn: 'root'
})
export class ScoresService {
  private readonly apiService = inject(ApiService);
  
  // Signal pour les scores en cache
  private readonly scoresSignal = signal<Score[]>([]);
  readonly scores = this.scoresSignal.asReadonly();

  /**
   * Crée un nouveau score (pour les bornes avec clé API)
   */
  createScore(scoreData: CreateScoreRequest): Observable<Score> {
    return this.apiService.post<Score>('/scores', scoreData);
  }

  /**
   * Récupère les scores avec filtres optionnels
   */
  getScores(params?: {
    game_id?: number;
    arcade_id?: number;
    friends_only?: boolean;
    limit?: number;
  }): Observable<Score[]> {
    return this.apiService.get<Score[]>('/scores', params).pipe(
      tap(scores => this.scoresSignal.set(scores))
    );
  }

  /**
   * Récupère les statistiques personnelles de l'utilisateur
   */
  getMyStats(): Observable<PlayerStats> {
    return this.apiService.get<PlayerStats>('/scores/my-stats');
  }

  /**
   * Efface le cache des scores
   */
  clearCache(): void {
    this.scoresSignal.set([]);
  }
}