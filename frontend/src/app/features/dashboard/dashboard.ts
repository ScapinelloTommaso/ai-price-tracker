import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Product } from '../../core/services/api.service';
import { Router, RouterLink } from '@angular/router';
import { ProductCard } from './product-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCard],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  products: Product[] = [];
  loading = true;
  error = '';

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts() {
    this.loading = true;
    this.error = '';
    this.apiService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.loading = false;
        this.cdr.detectChanges(); // Forza l'aggiornamento della UI
      },
      error: (err) => {
        console.error('Errore API in Dashboard:', err);
        this.error = 'Impossibile caricare i prodotti. Riprova più tardi.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  refreshPrice(productId: string) {
    this.apiService.refreshPrices(productId).subscribe({
      next: () => {
        this.loadProducts();
      },
      error: () => {
        alert('Errore durante il refresh del prezzo.');
      }
    });
  }
}
