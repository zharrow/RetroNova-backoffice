// src/app/shared/utils/template.utils.ts

/**
 * Classe utilitaire exposant les fonctions Math et autres utilitaires
 * pour utilisation dans les templates Angular
 */
export class TemplateUtils {
  // === MATH UTILITIES ===
  static readonly Math = Math;
  
  static round(value: number | null | undefined, decimals: number = 0): number {
    if (value === null || value === undefined || isNaN(value)) return 0;
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }
  
  static floor(value: number | null | undefined): number {
    if (value === null || value === undefined || isNaN(value)) return 0;
    return Math.floor(value);
  }
  
  static ceil(value: number | null | undefined): number {
    if (value === null || value === undefined || isNaN(value)) return 0;
    return Math.ceil(value);
  }
  
  static abs(value: number | null | undefined): number {
    if (value === null || value === undefined || isNaN(value)) return 0;
    return Math.abs(value);
  }
  
  static min(...values: (number | null | undefined)[]): number {
    const numbers = values.filter(v => v !== null && v !== undefined && !isNaN(v)) as number[];
    return numbers.length > 0 ? Math.min(...numbers) : 0;
  }
  
  static max(...values: (number | null | undefined)[]): number {
    const numbers = values.filter(v => v !== null && v !== undefined && !isNaN(v)) as number[];
    return numbers.length > 0 ? Math.max(...numbers) : 0;
  }

  // === STRING UTILITIES ===
  static truncate(text: string | null | undefined, length: number = 50, suffix: string = '...'): string {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length) + suffix;
  }
  
  static capitalize(text: string | null | undefined): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }
  
  static titleCase(text: string | null | undefined): string {
    if (!text) return '';
    return text.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  // === ARRAY UTILITIES ===
  static isEmpty(array: any[] | null | undefined): boolean {
    return !array || array.length === 0;
  }
  
  static first<T>(array: T[] | null | undefined): T | null {
    return array && array.length > 0 ? array[0] : null;
  }
  
  static last<T>(array: T[] | null | undefined): T | null {
    return array && array.length > 0 ? array[array.length - 1] : null;
  }

  // === DATE UTILITIES ===
  static formatDate(date: string | Date | null | undefined, locale: string = 'fr-FR'): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(locale);
  }
  
  static formatDateTime(date: string | Date | null | undefined, locale: string = 'fr-FR'): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(locale) + ' ' + d.toLocaleTimeString(locale, { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  static formatRelativeTime(date: string | Date | null | undefined): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 30) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    return this.formatDate(d);
  }

  // === FORMATTING UTILITIES ===
  static formatNumber(value: number | null | undefined, locale: string = 'fr-FR'): string {
    if (value === null || value === undefined || isNaN(value)) return '0';
    return value.toLocaleString(locale);
  }
  
  static formatCurrency(value: number | null | undefined, currency: string = 'EUR', locale: string = 'fr-FR'): string {
    if (value === null || value === undefined || isNaN(value)) return '0 €';
    return value.toLocaleString(locale, { style: 'currency', currency });
  }
  
  static formatPercentage(value: number | null | undefined, decimals: number = 1): string {
    if (value === null || value === undefined || isNaN(value)) return '0%';
    return `${value.toFixed(decimals)}%`;
  }
  
  static formatFileSize(bytes: number | null | undefined): string {
    if (!bytes || bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  // === VALIDATION UTILITIES ===
  static isValidEmail(email: string | null | undefined): boolean {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  static isValidUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // === COLOR UTILITIES ===
  static getStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      'active': 'var(--neon-green)',
      'inactive': 'var(--gray-400)',
      'maintenance': 'var(--neon-orange)',
      'partial': 'var(--neon-blue)',
      'error': 'var(--arcade-red)',
      'success': 'var(--neon-green)',
      'warning': 'var(--neon-orange)',
      'info': 'var(--neon-blue)'
    };
    return statusColors[status.toLowerCase()] || 'var(--gray-400)';
  }
  
  static getContrastColor(hexColor: string): string {
    // Convertit une couleur hex en couleur de contraste (noir ou blanc)
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  }

  // === RANDOM UTILITIES ===
  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  static randomElement<T>(array: T[]): T | null {
    if (array.length === 0) return null;
    return array[Math.floor(Math.random() * array.length)];
  }
  
  static generateId(prefix: string = 'id'): string {
    return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // === GAMING SPECIFIC UTILITIES ===
  static getGameDifficultyColor(difficulty: string): string {
    const difficultyColors: Record<string, string> = {
      'easy': 'var(--neon-green)',
      'medium': 'var(--neon-orange)',
      'hard': 'var(--arcade-red)',
      'expert': 'var(--neon-purple)'
    };
    return difficultyColors[difficulty.toLowerCase()] || 'var(--gray-400)';
  }
  
  static getScoreRank(score: number, maxScore: number): string {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'S';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  }
  
  static formatScore(score: number): string {
    if (score >= 1000000) {
      return `${(score / 1000000).toFixed(1)}M`;
    } else if (score >= 1000) {
      return `${(score / 1000).toFixed(1)}K`;
    }
    return score.toString();
  }
}