import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Score, CreateScoreRequest, PlayerStats } from '../models/scores.model';

@Injectable({
  providedIn: 'root'
})
export class ScoresService {
  constructor(private apiService: ApiService) {}
  
  createScore(score: CreateScoreRequest): Observable<Score> {
    return this.apiService.post<Score>('/scores', score);
  }
  
  getScores(params?: {
    game_id?: number;
    arcade_id?: number;
    friends_only?: boolean;
    limit?: number;
  }): Observable<Score[]> {
    return this.apiService.get<Score[]>('/scores', params);
  }
  
  getMyStats(): Observable<PlayerStats> {
    return this.apiService.get<PlayerStats>('/scores/my-stats');
  }
}