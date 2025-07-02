// src/app/shared/components/gaming-data-table/gaming-data-table.component.ts
import { Component, input, output, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Interface générique pour les colonnes
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, item: T) => string;
  cssClass?: (value: any, item: T) => string;
}

// Options de configuration
export interface TableConfig {
  showSearch?: boolean;
  showPagination?: boolean;
  itemsPerPage?: number;
  emptyMessage?: string;
  loading?: boolean;
  theme?: 'arcade' | 'cyber' | 'retro';
}

@Component({
  selector: 'app-gaming-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="gaming-table-container" [attr.data-theme]="config().theme || 'arcade'">
      <!-- Header avec recherche -->
      @if (config().showSearch) {
        <div class="table-header">
          <div class="search-box">
            <i class="search-icon">🔍</i>
            <input 
              type="text" 
              class="search-input"
              placeholder="Rechercher..."
              [(ngModel)]="searchQuery"
              (ngModelChange)="updateSearch($event)">
            @if (searchQuery()) {
              <button class="clear-btn" (click)="clearSearch()">✕</button>
            }
          </div>
          
          <div class="table-stats">
            <span class="stat-badge">{{ filteredData().length }}</span>
            <span class="stat-label">résultats</span>
          </div>
        </div>
      }
      
      <!-- Table principale -->
      <div class="table-wrapper" [class.loading]="config().loading">
        @if (config().loading) {
          <div class="loading-overlay">
            <div class="arcade-loader">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p class="loading-text">LOADING...</p>
          </div>
        }
        
        <table class="gaming-table">
          <thead>
            <tr>
              @for (column of columns(); track column.key) {
                <th 
                  [style.width]="column.width"
                  [class.sortable]="column.sortable"
                  (click)="column.sortable && toggleSort(column.key as string)">
                  <div class="th-content">
                    <span>{{ column.label }}</span>
                    @if (column.sortable) {
                      <span class="sort-indicator" [class.active]="sortField() === column.key">
                        @if (sortField() === column.key && sortDirection() === 'asc') {
                          ▲
                        } @else if (sortField() === column.key && sortDirection() === 'desc') {
                          ▼
                        } @else {
                          ⬍
                        }
                      </span>
                    }
                  </div>
                </th>
              }
              @if (hasActions()) {
                <th class="actions-header">Actions</th>
              }
            </tr>
          </thead>
          
          <tbody>
            @if (paginatedData().length === 0) {
              <tr class="empty-row">
                <td [attr.colspan]="totalColumns()">
                  <div class="empty-state">
                    <div class="empty-icon">🎮</div>
                    <p>{{ config().emptyMessage || 'Aucune donnée disponible' }}</p>
                  </div>
                </td>
              </tr>
            } @else {
              @for (item of paginatedData(); track trackByFn(item); let i = $index) {
                <tr 
                  class="data-row"
                  [class.selected]="isSelected(item)"
                  [style.animation-delay]="i * 0.05 + 's'"
                  (click)="handleRowClick(item)">
                  
                  @for (column of columns(); track column.key) {
                    <td [ngClass]="getCellClass(column, item)">
                      <div class="cell-content">
                        {{ getCellValue(column, item) }}
                      </div>
                    </td>
                  }
                  
                  @if (hasActions()) {
                    <td class="actions-cell" (click)="$event.stopPropagation()">
                      <button 
                        class="action-btn"
                        (click)="actionClicked.emit({ action: 'view', item })">
                        👁
                      </button>
                      <button 
                        class="action-btn"
                        (click)="actionClicked.emit({ action: 'edit', item })">
                        ✏️
                      </button>
                      <button 
                        class="action-btn danger"
                        (click)="actionClicked.emit({ action: 'delete', item })">
                        🗑
                      </button>
                    </td>
                  }
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
      
      <!-- Pagination -->
      @if (config().showPagination && totalPages() > 1) {
        <div class="pagination">
          <button 
            class="page-btn"
            [disabled]="currentPage() === 1"
            (click)="goToPage(1)">
            ⏮
          </button>
          <button 
            class="page-btn"
            [disabled]="currentPage() === 1"
            (click)="previousPage()">
            ◀
          </button>
          
          <div class="page-info">
            <span class="current-page">{{ currentPage() }}</span>
            <span class="separator">/</span>
            <span class="total-pages">{{ totalPages() }}</span>
          </div>
          
          <button 
            class="page-btn"
            [disabled]="currentPage() === totalPages()"
            (click)="nextPage()">
            ▶
          </button>
          <button 
            class="page-btn"
            [disabled]="currentPage() === totalPages()"
            (click)="goToPage(totalPages())">
            ⏭
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .gaming-table-container {
      --table-bg: rgba(15, 23, 42, 0.95);
      --border-color: var(--neon-blue);
      --header-bg: rgba(59, 130, 246, 0.1);
      --hover-bg: rgba(59, 130, 246, 0.05);
      
      font-family: 'Inter', sans-serif;
      background: var(--table-bg);
      border: 2px solid var(--border-color);
      border-radius: var(--radius-xl);
      overflow: hidden;
      position: relative;
      box-shadow: 
        0 0 30px rgba(59, 130, 246, 0.2),
        inset 0 0 30px rgba(59, 130, 246, 0.05);
      
      &[data-theme="cyber"] {
        --border-color: var(--neon-purple);
        --header-bg: rgba(168, 85, 247, 0.1);
        --hover-bg: rgba(168, 85, 247, 0.05);
      }
      
      &[data-theme="retro"] {
        --border-color: var(--neon-green);
        --header-bg: rgba(16, 185, 129, 0.1);
        --hover-bg: rgba(16, 185, 129, 0.05);
      }
    }
    
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-4);
      background: var(--header-bg);
      border-bottom: 1px solid var(--border-color);
    }
    
    .search-box {
      position: relative;
      display: flex;
      align-items: center;
      max-width: 300px;
      
      .search-icon {
        position: absolute;
        left: var(--space-3);
        font-size: 1.125rem;
        opacity: 0.7;
      }
      
      .search-input {
        width: 100%;
        padding: var(--space-2) var(--space-10);
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: var(--radius-lg);
        color: white;
        font-size: var(--text-sm);
        transition: all var(--transition-normal);
        
        &:focus {
          outline: none;
          border-color: var(--border-color);
          box-shadow: 0 0 10px var(--border-color);
          background: rgba(255, 255, 255, 0.08);
        }
        
        &::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }
      }
      
      .clear-btn {
        position: absolute;
        right: var(--space-2);
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.5);
        cursor: pointer;
        padding: var(--space-1);
        border-radius: var(--radius-md);
        transition: all var(--transition-fast);
        
        &:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
      }
    }
    
    .table-stats {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      
      .stat-badge {
        padding: var(--space-1) var(--space-3);
        background: var(--border-color);
        color: black;
        font-weight: 700;
        border-radius: var(--radius-full);
        font-size: var(--text-sm);
      }
      
      .stat-label {
        color: rgba(255, 255, 255, 0.7);
        font-size: var(--text-sm);
      }
    }
    
    .table-wrapper {
      position: relative;
      overflow-x: auto;
      max-height: 600px;
      
      &.loading {
        min-height: 300px;
      }
    }
    
    .loading-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10;
      backdrop-filter: blur(4px);
      
      .arcade-loader {
        display: flex;
        gap: var(--space-2);
        
        span {
          width: 16px;
          height: 16px;
          background: var(--border-color);
          border-radius: var(--radius-md);
          animation: loaderPulse 1.4s ease-in-out infinite;
          
          &:nth-child(2) { animation-delay: 0.2s; }
          &:nth-child(3) { animation-delay: 0.4s; }
        }
      }
      
      .loading-text {
        margin-top: var(--space-4);
        color: var(--border-color);
        font-weight: 700;
        letter-spacing: 0.2em;
        animation: textBlink 1.5s ease-in-out infinite;
      }
    }
    
    @keyframes loaderPulse {
      0%, 80%, 100% {
        transform: scale(0.8);
        opacity: 0.5;
      }
      40% {
        transform: scale(1.2);
        opacity: 1;
      }
    }
    
    @keyframes textBlink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    .gaming-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      color: white;
      
      thead {
        position: sticky;
        top: 0;
        z-index: 5;
        
        th {
          padding: var(--space-4);
          background: var(--header-bg);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-size: var(--text-sm);
          color: var(--border-color);
          text-align: left;
          border-bottom: 2px solid var(--border-color);
          
          &.sortable {
            cursor: pointer;
            user-select: none;
            transition: all var(--transition-fast);
            
            &:hover {
              background: rgba(255, 255, 255, 0.05);
            }
          }
          
          .th-content {
            display: flex;
            align-items: center;
            gap: var(--space-2);
          }
          
          .sort-indicator {
            font-size: 0.75rem;
            opacity: 0.5;
            transition: all var(--transition-fast);
            
            &.active {
              opacity: 1;
              color: var(--border-color);
              filter: drop-shadow(0 0 5px currentColor);
            }
          }
        }
      }
      
      tbody {
        .data-row {
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          transition: all var(--transition-fast);
          animation: fadeInRow 0.6s ease-out both;
          cursor: pointer;
          
          &:hover {
            background: var(--hover-bg);
            transform: translateX(4px);
            
            td:first-child {
              border-left: 3px solid var(--border-color);
            }
          }
          
          &.selected {
            background: var(--hover-bg);
            box-shadow: inset 0 0 20px rgba(59, 130, 246, 0.1);
          }
          
          td {
            padding: var(--space-4);
            font-size: var(--text-sm);
            
            .cell-content {
              display: flex;
              align-items: center;
              gap: var(--space-2);
            }
          }
        }
        
        .empty-row td {
          padding: var(--space-12);
        }
      }
    }
    
    @keyframes fadeInRow {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .actions-header {
      text-align: center !important;
      width: 120px;
    }
    
    .actions-cell {
      text-align: center;
      
      .action-btn {
        background: none;
        border: 1px solid transparent;
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        padding: var(--space-1) var(--space-2);
        margin: 0 var(--space-1);
        border-radius: var(--radius-md);
        font-size: 1rem;
        transition: all var(--transition-fast);
        
        &:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: currentColor;
          color: white;
          transform: scale(1.1);
        }
        
        &.danger:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: var(--arcade-red);
          color: var(--arcade-red);
        }
      }
    }
    
    .empty-state {
      text-align: center;
      
      .empty-icon {
        font-size: 3rem;
        opacity: 0.3;
        margin-bottom: var(--space-4);
        filter: grayscale(1);
      }
      
      p {
        margin: 0;
        color: rgba(255, 255, 255, 0.5);
      }
    }
    
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      padding: var(--space-4);
      background: var(--header-bg);
      border-top: 1px solid var(--border-color);
      
      .page-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: white;
        padding: var(--space-2) var(--space-3);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all var(--transition-fast);
        font-weight: 600;
        
        &:hover:not(:disabled) {
          background: var(--border-color);
          border-color: var(--border-color);
          color: black;
          transform: scale(1.05);
        }
        
        &:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
      }
      
      .page-info {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: 0 var(--space-4);
        
        .current-page {
          font-weight: 700;
          font-size: 1.125rem;
          color: var(--border-color);
          text-shadow: 0 0 10px currentColor;
        }
        
        .separator {
          color: rgba(255, 255, 255, 0.3);
        }
        
        .total-pages {
          color: rgba(255, 255, 255, 0.7);
        }
      }
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .table-header {
        flex-direction: column;
        gap: var(--space-3);
      }
      
      .search-box {
        width: 100%;
        max-width: none;
      }
      
      .gaming-table {
        font-size: var(--text-xs);
        
        th, td {
          padding: var(--space-2);
        }
      }
      
      .actions-cell .action-btn {
        padding: var(--space-1);
        margin: 0;
      }
    }
  `]
})
export class GamingDataTableComponent<T extends Record<string, any>> {
  // Inputs
  readonly data = input.required<T[]>();
  readonly columns = input.required<TableColumn<T>[]>();
  readonly config = input<TableConfig>({});
  readonly trackBy = input<keyof T | ((item: T) => any)>();
  readonly selectable = input(false);
  readonly selectedItems = input<T[]>([]);
  
  // Outputs
  readonly rowClicked = output<T>();
  readonly actionClicked = output<{ action: string; item: T }>();
  readonly selectedItemsChange = output<T[]>();
  
  // État interne
  protected readonly searchQuery = signal('');
  protected readonly sortField = signal<string | null>(null);
  protected readonly sortDirection = signal<'asc' | 'desc'>('asc');
  protected readonly currentPage = signal(1);
  
  // Sélection
  private readonly selectedSet = signal(new Set<T>());
  
  // Computed values
  protected readonly filteredData = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const data = this.data();
    
    if (!query) return data;
    
    return data.filter(item => {
      return this.columns().some(col => {
        const value = String(item[col.key] || '').toLowerCase();
        return value.includes(query);
      });
    });
  });
  
  protected readonly sortedData = computed(() => {
    const data = [...this.filteredData()];
    const field = this.sortField();
    const direction = this.sortDirection();
    
    if (!field) return data;
    
    return data.sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      
      if (aVal === bVal) return 0;
      
      const result = aVal > bVal ? 1 : -1;
      return direction === 'asc' ? result : -result;
    });
  });
  
  protected readonly paginatedData = computed(() => {
    const data = this.sortedData();
    const config = this.config();
    
    if (!config.showPagination) return data;
    
    const itemsPerPage = config.itemsPerPage || 10;
    const start = (this.currentPage() - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    
    return data.slice(start, end);
  });
  
  protected readonly totalPages = computed(() => {
    const config = this.config();
    if (!config.showPagination) return 1;
    
    const itemsPerPage = config.itemsPerPage || 10;
    return Math.ceil(this.filteredData().length / itemsPerPage);
  });
  
  protected readonly totalColumns = computed(() => {
    return this.columns().length + (this.hasActions() ? 1 : 0);
  });
  
  protected readonly hasActions = computed(() => {
    return this.rowClicked.observed || this.actionClicked.observed;
  });
  
  // Méthodes
  protected updateSearch(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
  }
  
  protected clearSearch(): void {
    this.searchQuery.set('');
  }
  
  protected toggleSort(field: string): void {
    if (this.sortField() === field) {
      this.sortDirection.update(dir => dir === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
  }
  
  protected goToPage(page: number): void {
    this.currentPage.set(page);
  }
  
  protected previousPage(): void {
    this.currentPage.update(p => Math.max(1, p - 1));
  }
  
  protected nextPage(): void {
    this.currentPage.update(p => Math.min(this.totalPages(), p + 1));
  }
  
  protected handleRowClick(item: T): void {
    if (this.selectable()) {
      this.toggleSelection(item);
    }
    this.rowClicked.emit(item);
  }
  
  protected isSelected(item: T): boolean {
    return this.selectedSet().has(item);
  }
  
  private toggleSelection(item: T): void {
    const set = new Set(this.selectedSet());
    
    if (set.has(item)) {
      set.delete(item);
    } else {
      set.add(item);
    }
    
    this.selectedSet.set(set);
    this.selectedItemsChange.emit(Array.from(set));
  }
  
  protected getCellValue(column: TableColumn<T>, item: T): string {
    const value = item[column.key];
    return column.render ? column.render(value, item) : String(value || '');
  }
  
  protected getCellClass(column: TableColumn<T>, item: T): string {
    const value = item[column.key];
    return column.cssClass ? column.cssClass(value, item) : '';
  }
  
  protected trackByFn(item: T): any {
    const trackBy = this.trackBy();
    
    if (!trackBy) return item;
    
    if (typeof trackBy === 'function') {
      return trackBy(item);
    }
    
    return item[trackBy];
  }
}