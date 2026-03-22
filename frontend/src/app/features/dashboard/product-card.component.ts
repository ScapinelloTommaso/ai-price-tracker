import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '../../core/services/api.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-dark-surface rounded-2xl p-6 border border-white/5 hover:border-primary-500/30 transition-all hover:-translate-y-1 group relative flex flex-col h-full cursor-pointer"
         [routerLink]="['/product', product.productId]">
      
      <div class="flex justify-between items-start mb-4">
        <!-- Source Badge -->
        <span class="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md border flex items-center gap-1.5"
              [ngClass]="product.source === 'amazon' ? 'bg-[#FF9900]/10 text-[#FF9900] border-[#FF9900]/20' : 'bg-[#FF7300]/10 text-[#FF7300] border-[#FF7300]/20'">
          <svg *ngIf="product.source === 'amazon'" class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <!-- Semplice placeholder A icon per amazon -->
            <path d="M12 2L2 22h3.5l2.5-5h8l2.5 5H22L12 2zm-2.5 12L12 7l2.5 7h-5z"/>
          </svg>
          <svg *ngIf="product.source === 'temu'" class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
             <!-- Semplice placeholder T per temu -->
            <path d="M3 3h18v4H14v14h-4V7H3z"/>
          </svg>
          {{ product.source }}
        </span>
        
        <!-- Refresh Button -->
        <button (click)="onRefresh($event)" 
                [disabled]="isRefreshing"
                [title]="isRefreshing ? 'Scraping sul cloud in corso...' : 'Aggiorna Prezzo'"
                class="text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-500 flex items-center gap-1.5 z-10"
                [ngClass]="isRefreshing ? 'bg-emerald-500/20 text-emerald-400 cursor-wait' : 'bg-white/5 text-dark-muted hover:text-white hover:bg-white/10'">
          <svg *ngIf="isRefreshing" class="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg *ngIf="!isRefreshing" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          {{ isRefreshing ? 'Scraping...' : 'Refresh' }}
        </button>
      </div>

      <!-- Title & Details -->
      <div class="mb-auto">
        <h3 class="font-medium text-white mb-1 line-clamp-2 group-hover:text-primary-500 transition-colors" [title]="product.productName">
          {{ product.productName }}
        </h3>
        <div class="text-xs text-dark-muted font-mono truncate">ID: {{ product.productId }}</div>
      </div>
      
      <!-- Trend Indicator & Price -->
      <div class="mt-6 flex justify-between items-end border-t border-white/5 pt-4">
        <div>
          <div class="text-xs text-dark-muted tracking-wide uppercase mb-1">Prezzo</div>
          <div class="text-2xl font-bold font-mono tracking-tight text-white flex items-center gap-1">
            <span *ngIf="product.currentPrice === 0" class="text-base text-red-400">Non disp.</span>
            <ng-container *ngIf="product.currentPrice > 0">
              {{ product.currentPrice | number:'1.2-2' }} <span class="text-lg text-primary-500">{{ product.currency }}</span>
            </ng-container>
          </div>
        </div>

        <!-- Trend Indicator (Mock logic based on current state - in a real app this would compare current with previous from history) -->
        <!-- Per semplicità, se ha lo sconto assumiamo che sia sceso (freccia verde in giù). 
             Qui ci limitiamo a usare la prop trend se la si avesse, altrimenti facciamo finta sia neutro o usiamo data fake per dimostrazione -->
        <div *ngIf="trend === 'down'" class="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full text-xs font-bold">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
          <span>Sceso</span>
        </div>
        <div *ngIf="trend === 'up'" class="flex items-center gap-1 text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full text-xs font-bold">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
          <span>Salito</span>
        </div>
        <div *ngIf="trend === 'neutral'" class="flex items-center gap-1 text-dark-muted bg-white/5 px-2.5 py-1 rounded-full text-xs font-bold">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4"></path></svg>
        </div>
      </div>
    </div>
  `
})
export class ProductCard {
  @Input({ required: true }) product!: Product;
  // Per simulare il trend in mancanza del record precedente pre-calcolato. Green DOWN, Red UP.
  @Input() trend: 'up' | 'down' | 'neutral' = 'neutral'; 
  
  @Output() refresh = new EventEmitter<string>();

  isRefreshing = false;

  onRefresh(event: Event) {
    event.stopPropagation();
    event.preventDefault(); // Previene il routing del div padre
    this.isRefreshing = true;
    this.refresh.emit(this.product.productId);
    
    // Reset dello stato dopo l'evento (la dashboard ri-farà il fetch)
    setTimeout(() => {
      this.isRefreshing = false;
    }, 2000);
  }
}
