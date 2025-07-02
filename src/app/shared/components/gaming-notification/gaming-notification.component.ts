import { Component, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface GamingNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'achievement' | 'level-up';
  title: string;
  message: string;
  icon?: string;
  points?: number;
  duration?: number;
  timestamp: Date;
}

@Component({
  selector: 'app-gaming-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gaming-notification.component.html',
  styleUrls: ['./gaming-notification.component.css']
})
export class GamingNotificationComponent {
  notifications = signal<GamingNotification[]>([]);

  addNotification(type: GamingNotification['type']) {
    const newNotification: GamingNotification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random()*10000)}`,
      type,
      title: this.getTitle(type),
      message: this.getMessage(type),
      icon: this.getIcon(type),
      points: type === 'achievement' ? Math.floor(Math.random() * 1000) + 100 : undefined,
      duration: 5000,
      timestamp: new Date()
    };
    this.notifications.update(list => [...list, newNotification]);
    setTimeout(() => this.removeNotification(newNotification.id), newNotification.duration);
  }

  removeNotification(id: string) {
    this.notifications.update(list => list.filter(n => n.id !== id));
  }

  getTitle(type: GamingNotification['type']): string {
    return {
      'success': 'Mission accomplie !',
      'error': 'Échec de la mission',
      'warning': 'Attention Joueur',
      'achievement': 'Nouveau Trophée !',
      'level-up': 'LEVEL UP !'
    }[type];
  }

  getMessage(type: GamingNotification['type']): string {
    return {
      'success': 'Action réalisée avec succès',
      'error': 'Une erreur est survenue',
      'warning': 'Vérifiez vos paramètres',
      'achievement': 'Vous avez débloqué un succès',
      'level-up': 'Félicitations ! Vous passez au niveau supérieur'
    }[type];
  }

  getIcon(type: GamingNotification['type']): string {
    return {
      'success': '✓',
      'error': '✗',
      'warning': '⚠',
      'achievement': '🏆',
      'level-up': '⚡'
    }[type];
  }

  getColorClass(type: GamingNotification['type']): string {
    return {
      'success': 'neon-green',
      'error': 'arcade-red',
      'warning': 'neon-orange',
      'achievement': 'neon-purple',
      'level-up': 'neon-blue'
    }[type];
  }
}
