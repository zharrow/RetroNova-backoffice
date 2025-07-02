// src/app/core/services/smart-cache.service.ts
import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { Game } from '../models/game.model';
import { Score } from '../models/score.model';

// Interface pour les métadonnées du cache
interface CacheMetadata {
  timestamp: number;
  ttl: number;
  etag?: string;
  hits: number;
  size: number;
}

// Interface pour une entrée du cache
interface CacheEntry<T> {
  data: T;
  metadata: CacheMetadata;
}

// Options de configuration du cache
export interface CacheOptions {
  ttl?: number; // Time to live en ms
  maxSize?: number; // Taille max en bytes
  strategy?: 'LRU' | 'LFU' | 'FIFO'; // Stratégie d'éviction
  persist?: boolean; // Persister dans localStorage
  refreshOnExpire?: boolean; // Rafraîchir auto quand expiré
}

// Décorateur pour cacher automatiquement les méthodes
export function Cacheable(options?: CacheOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cache = inject(SmartCacheService);
      const key = `${target.constructor.name}.${propertyKey}:${JSON.stringify(args)}`;
      
      // Vérifier le cache
      const cached = await cache.get(key);
      if (cached) return cached;
      
      // Exécuter la méthode originale
      const result = await originalMethod.apply(this, args);
      
      // Mettre en cache
      await cache.set(key, result, options);
      
      return result;
    };
    
    return descriptor;
  };
}

@Injectable({ providedIn: 'root' })
export class SmartCacheService {
  private readonly http = inject(HttpClient);
  
  // État du cache avec signals
  private readonly cache = signal(new Map<string, CacheEntry<any>>());
  private readonly cacheSize = signal(0);
  private readonly hitRate = signal({ hits: 0, misses: 0 });
  
  // Configuration
  private readonly config = signal<CacheOptions>({
    ttl: 5 * 60 * 1000, // 5 minutes par défaut
    maxSize: 10 * 1024 * 1024, // 10MB
    strategy: 'LRU',
    persist: true,
    refreshOnExpire: true
  });
  
  // Métriques calculées
  readonly stats = computed(() => {
    const { hits, misses } = this.hitRate();
    const total = hits + misses;
    
    return {
      entries: this.cache().size,
      size: this.formatSize(this.cacheSize()),
      hitRate: total > 0 ? ((hits / total) * 100).toFixed(1) + '%' : '0%',
      hits,
      misses
    };
  });
  
  // Entrées triées par stratégie
  private readonly sortedEntries = computed(() => {
    const entries = Array.from(this.cache().entries());
    const strategy = this.config().strategy;
    
    switch (strategy) {
      case 'LRU':
        return entries.sort((a, b) => 
          b[1].metadata.timestamp - a[1].metadata.timestamp
        );
      case 'LFU':
        return entries.sort((a, b) => 
          a[1].metadata.hits - b[1].metadata.hits
        );
      case 'FIFO':
        return entries;
      default:
        return entries;
    }
  });
  
  constructor() {
    // Charger le cache persisté au démarrage
    this.loadPersistedCache();
    
    // Effect pour persister le cache
    effect(() => {
      if (this.config().persist) {
        this.persistCache();
      }
    });
    
    // Effect pour nettoyer périodiquement
    effect(() => {
      const interval = setInterval(() => {
        this.cleanExpiredEntries();
      }, 60000); // Toutes les minutes
      
      return () => clearInterval(interval);
    });
  }
  
  /**
   * Récupère une valeur du cache
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache().get(key);
    
    if (!entry) {
      this.recordMiss();
      return null;
    }
    
    // Vérifier l'expiration
    if (this.isExpired(entry)) {
      await this.handleExpiredEntry(key, entry);
      return null;
    }
    
    // Mettre à jour les métadonnées
    this.updateEntryMetadata(key);
    this.recordHit();
    
    return entry.data;
  }
  
  /**
   * Ajoute une valeur au cache
   */
  async set<T>(
    key: string, 
    data: T, 
    options?: CacheOptions
  ): Promise<void> {
    const opts = { ...this.config(), ...options };
    const size = this.calculateSize(data);
    
    // Vérifier la taille maximale
    if (await this.needsEviction(size)) {
      await this.evictEntries(size);
    }
    
    // Créer l'entrée
    const entry: CacheEntry<T> = {
      data,
      metadata: {
        timestamp: Date.now(),
        ttl: opts.ttl!,
        hits: 0,
        size
      }
    };
    
    // Mettre à jour le cache
    this.cache.update(cache => {
      const newCache = new Map(cache);
      newCache.set(key, entry);
      return newCache;
    });
    
    this.cacheSize.update(s => s + size);
  }
  
  /**
   * Invalide une entrée du cache
   */
  invalidate(key: string | RegExp): void {
    if (typeof key === 'string') {
      this.removeEntry(key);
    } else {
      // Invalider par pattern
      const keysToRemove = Array.from(this.cache().keys())
        .filter(k => key.test(k));
      
      keysToRemove.forEach(k => this.removeEntry(k));
    }
  }
  
  /**
   * Vide complètement le cache
   */
  clear(): void {
    this.cache.set(new Map());
    this.cacheSize.set(0);
    this.hitRate.set({ hits: 0, misses: 0 });
    
    if (this.config().persist) {
      localStorage.removeItem('smart-cache');
    }
  }
  
  /**
   * Précharge des données dans le cache
   */
  async preload<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<void> {
    try {
      const data = await fetcher();
      await this.set(key, data, options);
    } catch (error) {
      console.error(`Erreur lors du préchargement de ${key}:`, error);
    }
  }
  
  /**
   * Cache avec fetch HTTP intelligent
   */
  async fetchWithCache<T>(
    url: string,
    options?: CacheOptions & { 
      headers?: Record<string, string>;
      forceRefresh?: boolean;
    }
  ): Promise<T> {
    const key = `http:${url}`;
    
    // Forcer le rafraîchissement si demandé
    if (options?.forceRefresh) {
      this.invalidate(key);
    }
    
    // Vérifier le cache
    const cached = await this.get<T>(key);
    if (cached) return cached;
    
    // Faire la requête
    try {
      const response = await firstValueFrom(
        this.http.get<T>(url, { 
          headers: options?.headers,
          observe: 'response' 
        })
      );
      
      // Extraire l'ETag si présent
      const etag = response.headers.get('etag');
      
      // Mettre en cache avec ETag
      await this.set(key, response.body!, {
        ...options,
        etag
      } as any);
      
      return response.body!;
    } catch (error) {
      // En cas d'erreur, retourner le cache expiré si disponible
      const staleCache = this.cache().get(key);
      if (staleCache) {
        console.warn('Utilisation du cache expiré suite à une erreur');
        return staleCache.data;
      }
      
      throw error;
    }
  }
  
  // Méthodes privées
  
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.metadata.timestamp + entry.metadata.ttl;
  }
  
  private async handleExpiredEntry(
    key: string, 
    entry: CacheEntry<any>
  ): Promise<void> {
    if (this.config().refreshOnExpire && entry.metadata.etag) {
      // Tenter de rafraîchir avec ETag
      // Implementation spécifique selon l'API
    } else {
      this.removeEntry(key);
    }
  }
  
  private updateEntryMetadata(key: string): void {
    this.cache.update(cache => {
      const newCache = new Map(cache);
      const entry = newCache.get(key);
      
      if (entry) {
        entry.metadata.hits++;
        entry.metadata.timestamp = Date.now(); // Pour LRU
      }
      
      return newCache;
    });
  }
  
  private removeEntry(key: string): void {
    this.cache.update(cache => {
      const newCache = new Map(cache);
      const entry = newCache.get(key);
      
      if (entry) {
        this.cacheSize.update(s => s - entry.metadata.size);
        newCache.delete(key);
      }
      
      return newCache;
    });
  }
  
  private async needsEviction(newSize: number): Promise<boolean> {
    const maxSize = this.config().maxSize || Infinity;
    return this.cacheSize() + newSize > maxSize;
  }
  
  private async evictEntries(requiredSize: number): Promise<void> {
    const entries = this.sortedEntries();
    let freedSize = 0;
    
    for (const [key, entry] of entries) {
      if (freedSize >= requiredSize) break;
      
      freedSize += entry.metadata.size;
      this.removeEntry(key);
    }
  }
  
  private cleanExpiredEntries(): void {
    const now = Date.now();
    const keysToRemove: string[] = [];
    
    this.cache().forEach((entry, key) => {
      if (now > entry.metadata.timestamp + entry.metadata.ttl) {
        keysToRemove.push(key);
      }
    });
    
    keysToRemove.forEach(key => this.removeEntry(key));
  }
  
  private calculateSize(data: any): number {
    // Estimation approximative de la taille
    return new Blob([JSON.stringify(data)]).size;
  }
  
  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
  
  private recordHit(): void {
    this.hitRate.update(rate => ({ 
      ...rate, 
      hits: rate.hits + 1 
    }));
  }
  
  private recordMiss(): void {
    this.hitRate.update(rate => ({ 
      ...rate, 
      misses: rate.misses + 1 
    }));
  }
  
  private persistCache(): void {
    if (!this.config().persist) return;
    
    try {
      const cacheData = {
        entries: Array.from(this.cache().entries()),
        stats: this.hitRate()
      };
      
      localStorage.setItem('smart-cache', JSON.stringify(cacheData));
    } catch (error) {
      console.error('Erreur lors de la persistance du cache:', error);
    }
  }
  
  private loadPersistedCache(): void {
    if (!this.config().persist) return;
    
    try {
      const stored = localStorage.getItem('smart-cache');
      if (!stored) return;
      
      const { entries, stats } = JSON.parse(stored);
      
      // Filtrer les entrées expirées
      const now = Date.now();
      const validEntries = entries.filter(([key, entry]: [string, CacheEntry<any>]) => 
        now <= entry.metadata.timestamp + entry.metadata.ttl
      );
      
      this.cache.set(new Map(validEntries));
      this.hitRate.set(stats);
      
      // Recalculer la taille
      let totalSize = 0;
      validEntries.forEach(([_, entry]: [string, CacheEntry<any>]) => {
        totalSize += entry.metadata.size;
      });
      this.cacheSize.set(totalSize);
    } catch (error) {
      console.error('Erreur lors du chargement du cache:', error);
    }
  }
}

// Exemple d'utilisation dans un service
@Injectable({ providedIn: 'root' })
export class GameDataService {
  private readonly http = inject(HttpClient);
  private readonly cache = inject(SmartCacheService);
  
  // Méthode automatiquement cachée avec le décorateur
  @Cacheable({ ttl: 10 * 60 * 1000 }) // 10 minutes
  async getGameById(id: string): Promise<Game> {
    return firstValueFrom(
      this.http.get<Game>(`/api/games/${id}`)
    );
  }
  
  // Utilisation manuelle du cache
  async getHighScores(): Promise<Score[]> {
    return this.cache.fetchWithCache<Score[]>(
      '/api/scores/high',
      {
        ttl: 5 * 60 * 1000, // 5 minutes
        strategy: 'LFU' // Les scores populaires restent en cache
      }
    );
  }
  
  // Invalider le cache quand les données changent
  async updateGame(id: string, data: Partial<Game>): Promise<Game> {
    const result = await firstValueFrom(
      this.http.put<Game>(`/api/games/${id}`, data)
    );
    
    // Invalider le cache pour ce jeu
    this.cache.invalidate(`GameDataService.getGameById:["${id}"]`);
    
    return result;
  }
}