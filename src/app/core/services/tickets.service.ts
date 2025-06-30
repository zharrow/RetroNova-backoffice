import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { 
  TicketOffer, 
  PurchaseTicketsRequest, 
  PurchaseResponse, 
  TicketBalance,
  TicketPurchase 
} from '../models/ticket.model';

@Injectable({
  providedIn: 'root'
})
export class TicketsService {
  constructor(private apiService: ApiService) {}
  
  getOffers(): Observable<TicketOffer[]> {
    return this.apiService.get<TicketOffer[]>('/tickets/offers');
  }
  
  purchaseTickets(data: PurchaseTicketsRequest): Observable<PurchaseResponse> {
    return this.apiService.post<PurchaseResponse>('/tickets/purchase', data);
  }
  
  getBalance(): Observable<TicketBalance> {
    return this.apiService.get<TicketBalance>('/tickets/balance');
  }
  
  getPurchaseHistory(): Observable<TicketPurchase[]> {
    return this.apiService.get<TicketPurchase[]>('/tickets/history');
  }
}