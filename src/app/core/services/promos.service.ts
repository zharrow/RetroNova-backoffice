import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { 
  PromoCode,
  UsePromoCodeRequest,
  PromoCodeResponse,
  PromoHistory,
  CreatePromoCodeRequest
} from '../models/promo.model';

@Injectable({
  providedIn: 'root'
})
export class PromosService {
  constructor(private apiService: ApiService) {}
  
  usePromoCode(data: UsePromoCodeRequest): Observable<PromoCodeResponse> {
    return this.apiService.post<PromoCodeResponse>('/promos/use', data);
  }
  
  getHistory(): Observable<PromoHistory[]> {
    return this.apiService.get<PromoHistory[]>('/promos/history');
  }
  
  // Admin endpoints
  createPromoCode(data: CreatePromoCodeRequest): Observable<any> {
    return this.apiService.post('/admin/promo-codes', data);
  }
  
  listPromoCodes(): Observable<PromoCode[]> {
    return this.apiService.get<PromoCode[]>('/admin/promo-codes');
  }
}