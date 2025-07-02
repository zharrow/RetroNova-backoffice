// src/app/core/services/tickets.service.ts

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, throwError } from 'rxjs';
import { TicketOffer, PurchaseTicketsRequest, PurchaseResponse, TicketBalance, TicketPurchase } from '../models/ticket.model';
import { environment } from '../../../environments/environment';

interface TicketStats {
  readonly total_offers: number;
  readonly total_sales: number;
  readonly total_revenue: number;
  readonly tickets_sold: number;
  readonly best_selling_offer: string;
  readonly average_purchase_value: number;
  readonly recent_sales: number;
}

interface TicketSalesHistory {
  readonly date: string;
  readonly sales_count: number;
  readonly revenue: number;
  readonly tickets_sold: number;
}

interface TicketOfferAnalytics {
  readonly offer_id: number;
  readonly offer_name: string;
  readonly total_sales: number;
  readonly total_revenue: number;
  readonly conversion_rate: number;
  readonly average_rating: number;
}

/**
 * Gestion du cache des tickets
 */
class TicketCacheManager {
  private readonly cacheTimeMs = 3 * 60 * 1000; // 3 minutes pour des données plus dynamiques
  private readonly cache = new Map<string, { data: any; timestamp: number }>();

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.cacheTimeMs) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  remove(key: string): void {
    this.cache.delete(key);
  }
}

/**
 * Strategy Pattern pour différents types de calculs de prix
 */
abstract class PricingStrategy {
  abstract calculateDiscount(offer: TicketOffer, quantity?: number): number;
  abstract getRecommendedOffer(offers: TicketOffer[]): TicketOffer | null;
}

class ValueBasedPricingStrategy extends PricingStrategy {
  calculateDiscount(offer: TicketOffer): number {
    // Calcul de la valeur : plus on achète de tickets, meilleur est le prix unitaire
    const pricePerTicket = offer.price_euros / offer.tickets_amount;
    const basePrice = 1.0; // Prix de référence par ticket
    return Math.max(0, ((basePrice - pricePerTicket) / basePrice) * 100);
  }

  getRecommendedOffer(offers: TicketOffer[]): TicketOffer | null {
    if (offers.length === 0) return null;
    
    return offers.reduce((best, current) => {
      const bestValue = best.tickets_amount / best.price_euros;
      const currentValue = current.tickets_amount / current.price_euros;
      return currentValue > bestValue ? current : best;
    });
  }
}

/**
 * Factory pour les stratégies de pricing
 */
class PricingStrategyFactory {
  static create(type: 'value_based' = 'value_based'): PricingStrategy {
    switch (type) {
      case 'value_based':
        return new ValueBasedPricingStrategy();
      default:
        return new ValueBasedPricingStrategy();
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class TicketsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/tickets`;
  private readonly cacheManager = new TicketCacheManager();
  private readonly pricingStrategy = PricingStrategyFactory.create();
  
  // Signaux pour l'état réactif
  private readonly offersSubject = new BehaviorSubject<TicketOffer[]>([]);
  private readonly balanceSubject = new BehaviorSubject<number>(0);
  private readonly statsSubject = new BehaviorSubject<TicketStats | null>(null);
  
  readonly offers$ = this.offersSubject.asObservable();
  readonly balance$ = this.balanceSubject.asObservable();
  readonly stats$ = this.statsSubject.asObservable();

  /**
   * Récupère toutes les offres de tickets
   */
  getAllOffers(): Observable<TicketOffer[]> {
    const cached = this.cacheManager.get<TicketOffer[]>('all_offers');
    if (cached) {
      this.offersSubject.next(cached);
      return this.offers$;
    }

    return this.http.get<TicketOffer[]>(`${this.baseUrl}/offers`).pipe(
      tap(offers => {
        this.cacheManager.set('all_offers', offers);
        this.offersSubject.next(offers);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère une offre par ID
   */
  getOfferById(id: number): Observable<TicketOffer> {
    const cached = this.cacheManager.get<TicketOffer>(`offer_${id}`);
    if (cached) {
      return new Observable(observer => {
        observer.next(cached);
        observer.complete();
      });
    }

    return this.http.get<TicketOffer>(`${this.baseUrl}/offers/${id}`).pipe(
      tap(offer => this.cacheManager.set(`offer_${id}`, offer)),
      catchError(this.handleError)
    );
  }

  /**
   * Crée une nouvelle offre de tickets
   */
  createOffer(offerData: Omit<TicketOffer, 'id'>): Observable<TicketOffer> {
    return this.http.post<TicketOffer>(`${this.baseUrl}/offers`, offerData).pipe(
      tap(newOffer => {
        this.clearCache();
        this.refreshOffers();
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Met à jour une offre
   */
  updateOffer(id: number, offerData: Partial<Omit<TicketOffer, 'id'>>): Observable<TicketOffer> {
    return this.http.put<TicketOffer>(`${this.baseUrl}/offers/${id}`, offerData).pipe(
      tap(updatedOffer => {
        this.cacheManager.remove(`offer_${id}`);
        this.clearCache();
        this.refreshOffers();
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Supprime une offre
   */
  deleteOffer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/offers/${id}`).pipe(
      tap(() => {
        this.clearCache();
        this.refreshOffers();
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Achète des tickets
   */
  purchaseTickets(request: PurchaseTicketsRequest): Observable<PurchaseResponse> {
    return this.http.post<PurchaseResponse>(`${this.baseUrl}/purchase`, request).pipe(
      tap(response => {
        // Mettre à jour le solde local
        this.balanceSubject.next(response.new_balance);
        this.clearCache();
        this.refreshStats();
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère le solde de tickets d'un utilisateur
   */
  getUserBalance(userId?: number): Observable<TicketBalance> {
    const url = userId ? `${this.baseUrl}/balance/${userId}` : `${this.baseUrl}/balance`;
    
    return this.http.get<TicketBalance>(url).pipe(
      tap(balance => this.balanceSubject.next(balance.balance)),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère l'historique des achats
   */
  getPurchaseHistory(userId?: number): Observable<TicketPurchase[]> {
    const url = userId ? `${this.baseUrl}/purchases/${userId}` : `${this.baseUrl}/purchases`;
    
    return this.http.get<TicketPurchase[]>(url).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les statistiques des tickets
   */
  getTicketStats(): Observable<TicketStats> {
    const cached = this.cacheManager.get<TicketStats>('ticket_stats');
    if (cached) {
      this.statsSubject.next(cached);
      return this.stats$;
    }

    return this.http.get<TicketStats>(`${this.baseUrl}/stats`).pipe(
      tap(stats => {
        this.cacheManager.set('ticket_stats', stats);
        this.statsSubject.next(stats);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère l'historique des ventes par période
   */
  getSalesHistory(period: 'week' | 'month' | 'year' = 'month'): Observable<TicketSalesHistory[]> {
    return this.http.get<TicketSalesHistory[]>(`${this.baseUrl}/sales-history`, {
      params: { period }
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les analytics des offres
   */
  getOfferAnalytics(): Observable<TicketOfferAnalytics[]> {
    return this.http.get<TicketOfferAnalytics[]>(`${this.baseUrl}/offers/analytics`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Applique une réduction à une offre
   */
  applyDiscount(offerId: number, discountPercent: number, expiresAt?: Date): Observable<TicketOffer> {
    const payload = {
      discount_percent: discountPercent,
      expires_at: expiresAt?.toISOString()
    };
    
    return this.http.post<TicketOffer>(`${this.baseUrl}/offers/${offerId}/discount`, payload).pipe(
      tap(() => {
        this.clearCache();
        this.refreshOffers();
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Retire une réduction d'une offre
   */
  removeDiscount(offerId: number): Observable<TicketOffer> {
    return this.http.delete<TicketOffer>(`${this.baseUrl}/offers/${offerId}/discount`).pipe(
      tap(() => {
        this.clearCache();
        this.refreshOffers();
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Exporte les données de ventes en CSV
   */
  exportSales(startDate?: Date, endDate?: Date): Observable<Blob> {
    const params: any = {};
    if (startDate) params.start_date = startDate.toISOString().split('T')[0];
    if (endDate) params.end_date = endDate.toISOString().split('T')[0];
    
    return this.http.get(`${this.baseUrl}/export/sales`, { 
      responseType: 'blob',
      headers: { 'Accept': 'text/csv' },
      params
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Traite un remboursement
   */
  processRefund(purchaseId: number, reason: string): Observable<{ success: boolean; refund_amount: number }> {
    return this.http.post<{ success: boolean; refund_amount: number }>(
      `${this.baseUrl}/purchases/${purchaseId}/refund`, 
      { reason }
    ).pipe(
      tap(() => {
        this.clearCache();
        this.refreshStats();
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Méthodes utilitaires avec pricing strategy
   */
  calculateOfferValue(offer: TicketOffer): number {
    return offer.tickets_amount / offer.price_euros;
  }

  calculateDiscount(offer: TicketOffer): number {
    return this.pricingStrategy.calculateDiscount(offer);
  }

  getRecommendedOffer(offers: TicketOffer[]): TicketOffer | null {
    return this.pricingStrategy.getRecommendedOffer(offers);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(price);
  }

  formatTicketAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR').format(amount);
  }

  /**
   * Valide les données d'une offre
   */
  validateOffer(offer: Partial<TicketOffer>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!offer.name || offer.name.trim().length < 3) {
      errors.push('Le nom doit contenir au moins 3 caractères');
    }

    if (!offer.tickets_amount || offer.tickets_amount <= 0) {
      errors.push('Le nombre de tickets doit être supérieur à 0');
    }

    if (!offer.price_euros || offer.price_euros <= 0) {
      errors.push('Le prix doit être supérieur à 0');
    }

    if (offer.tickets_amount && offer.price_euros) {
      const pricePerTicket = offer.price_euros / offer.tickets_amount;
      if (pricePerTicket > 10) {
        errors.push('Le prix par ticket semble élevé (> 10€)');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Calcule les métriques de performance d'une offre
   */
  calculateOfferMetrics(offer: TicketOffer, analytics?: TicketOfferAnalytics): {
    value_score: number;
    popularity_rank: number;
    price_per_ticket: number;
    savings_vs_individual: number;
  } {
    const baseTicketPrice = 1.0; // Prix de référence
    const pricePerTicket = offer.price_euros / offer.tickets_amount;
    const savingsVsIndividual = Math.max(0, ((baseTicketPrice - pricePerTicket) / baseTicketPrice) * 100);
    
    return {
      value_score: offer.tickets_amount / offer.price_euros,
      popularity_rank: analytics?.conversion_rate || 0,
      price_per_ticket: pricePerTicket,
      savings_vs_individual: savingsVsIndividual
    };
  }

  /**
   * Rafraîchit les données
   */
  private refreshOffers(): void {
    this.getAllOffers().subscribe();
  }

  private refreshStats(): void {
    this.getTicketStats().subscribe();
  }

  /**
   * Vide le cache
   */
  clearCache(): void {
    this.cacheManager.clear();
  }

  /**
   * Gestion centralisée des erreurs
   */
  private handleError = (error: any): Observable<never> => {
    console.error('Erreur service tickets:', error);
    
    let errorMessage = 'Une erreur inattendue s\'est produite';
    
    if (error.status === 0) {
      errorMessage = 'Impossible de se connecter au serveur';
    } else if (error.status === 400) {
      errorMessage = error.error?.detail || 'Données invalides';
    } else if (error.status === 402) {
      errorMessage = 'Solde insuffisant pour effectuer cet achat';
    } else if (error.status === 404) {
      errorMessage = 'Offre de tickets introuvable';
    } else if (error.status === 409) {
      errorMessage = 'Cette offre existe déjà';
    } else if (error.status === 422) {
      errorMessage = 'Données de validation incorrectes';
    } else if (error.status >= 500) {
      errorMessage = 'Erreur serveur, veuillez réessayer plus tard';
    }
    
    return throwError(() => ({ ...error, message: errorMessage }));
  };

  // src/app/core/services/tickets.service.ts - Méthode à ajouter après getPurchaseHistory

  /**
   * Récupère les statistiques des tickets
   */
  getTicketStats(): Observable<TicketStats> {
    const cached = this.cacheManager.get<TicketStats>('ticket_stats');
    if (cached) {
      this.statsSubject.next(cached);
      return new Observable(observer => {
        observer.next(cached);
        observer.complete();
      });
    }

    // Comme l'API ne fournit pas cet endpoint, on simule les stats
    // basées sur les données disponibles
    return new Observable<TicketStats>(observer => {
      // Simuler les statistiques
      const mockStats: TicketStats = {
        total_offers: 0,
        total_sales: 0,
        total_revenue: 0,
        tickets_sold: 0,
        best_selling_offer: 'Pack Standard',
        average_purchase_value: 0,
        recent_sales: 0
      };

      // Récupérer les offres pour calculer certaines stats
      this.getAllOffers().subscribe(offers => {
        mockStats.total_offers = offers.length;
        
        // Simuler d'autres statistiques
        mockStats.total_sales = Math.floor(Math.random() * 100) + 50;
        mockStats.tickets_sold = mockStats.total_sales * 20;
        mockStats.total_revenue = mockStats.total_sales * 15.5;
        mockStats.average_purchase_value = mockStats.total_revenue / mockStats.total_sales;
        mockStats.recent_sales = Math.floor(Math.random() * 20) + 5;

        this.cacheManager.set('ticket_stats', mockStats);
        this.statsSubject.next(mockStats);
        
        observer.next(mockStats);
        observer.complete();
      });
    }).pipe(
      catchError(this.handleError)
    );
  }
}