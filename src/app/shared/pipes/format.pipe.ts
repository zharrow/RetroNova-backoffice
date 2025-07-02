// src/app/shared/pipes/format.pipe.ts

import { Pipe, PipeTransform } from '@angular/core';

type FormatType = 
  | 'number'
  | 'currency'
  | 'percentage'
  | 'fileSize'
  | 'duration'
  | 'shortNumber';

@Pipe({
  name: 'format',
  standalone: true,
  pure: true
})
export class FormatPipe implements PipeTransform {
  transform(value: number | null | undefined, type: FormatType, options?: any): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '0';
    }

    switch (type) {
      case 'number':
        return this.formatNumber(value, options);
      
      case 'currency':
        return this.formatCurrency(value, options);
      
      case 'percentage':
        return this.formatPercentage(value, options);
      
      case 'fileSize':
        return this.formatFileSize(value);
      
      case 'duration':
        return this.formatDuration(value);
      
      case 'shortNumber':
        return this.formatShortNumber(value);
      
      default:
        return value.toString();
    }
  }

  private formatNumber(value: number, options?: { decimals?: number; locale?: string }): string {
    const locale = options?.locale || 'fr-FR';
    const decimals = options?.decimals;
    
    if (decimals !== undefined) {
      return value.toLocaleString(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
    }
    
    return value.toLocaleString(locale);
  }

  private formatCurrency(value: number, options?: { currency?: string; locale?: string }): string {
    const locale = options?.locale || 'fr-FR';
    const currency = options?.currency || 'EUR';
    
    return value.toLocaleString(locale, {
      style: 'currency',
      currency: currency
    });
  }

  private formatPercentage(value: number, options?: { decimals?: number }): string {
    const decimals = options?.decimals || 1;
    return `${value.toFixed(decimals)}%`;
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  }

  private formatShortNumber(value: number): string {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}G`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  }
}