import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, Product, PriceHistory } from '../../core/services/api.service';
import { PriceChart } from './price-chart.component';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, PriceChart, RouterLink],
  templateUrl: './product-detail.component.html'
})
export class ProductDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  productId: string | null = null;
  product: Product | null = null;
  history: PriceHistory[] = [];
  
  loading = true;
  error = '';
  currency = '€';

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.loadData();
    } else {
      this.error = 'ID Prodotto non valido.';
      this.loading = false;
    }
  }

  loadData() {
    this.loading = true;
    this.error = '';

    // Eseguiamo chiamate in parallelo per ottenere i prodotti (per trovare quello specifico)
    // e la history per quel prodotto (il backend originariamente non aveva un endpoint getProduct singolo).
    forkJoin({
      productsRaw: this.apiService.getProducts().pipe(catchError(() => of([]))),
      historyData: this.apiService.getPriceHistory(this.productId!).pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ productsRaw, historyData }) => {
        // Troviamo il prodotto specifico dalla lista
        this.product = productsRaw.find((p: Product) => p.productId === this.productId) || null;
        this.history = historyData || [];
        
        if (this.product) {
          this.currency = this.product.currency;
        } else if (this.history.length > 0) {
          this.currency = this.history[0].currency;
        }

        if (!this.product && this.history.length === 0) {
          this.error = 'Prodotto non trovato.';
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Impossibile caricare i dettagli del prodotto.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
