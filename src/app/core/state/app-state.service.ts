import { Injectable, signal, computed, effect } from '@angular/core';
import { User } from '../models/user.model';

interface AppState {
  user: User | null;
  theme: 'light' | 'dark' | 'retro';
  sidebarOpen: boolean;
  notifications: Notification[];
  isLoading: boolean;
}

@Injectable({ providedIn: 'root' })
export class AppStateService {
  // État privé avec signal
  private readonly state = signal<AppState>({
    user: null,
    theme: 'retro',
    sidebarOpen: true,
    notifications: [],
    isLoading: false
  });

  // Selectors publics (computed)
  readonly user = computed(() => this.state().user);
  readonly theme = computed(() => this.state().theme);
  readonly isAuthenticated = computed(() => !!this.state().user);
  readonly unreadNotifications = computed(() => 
    this.state().notifications.filter(n => !n).length
  );

  // Actions (méthodes courtes)
  setUser(user: User | null): void {
    this.updateState({ user });
  }

  toggleSidebar(): void {
    this.updateState({ 
      sidebarOpen: !this.state().sidebarOpen 
    });
  }

  // Méthode privée pour update immutable
  private updateState(partial: Partial<AppState>): void {
    this.state.update(current => ({ ...current, ...partial }));
  }
}