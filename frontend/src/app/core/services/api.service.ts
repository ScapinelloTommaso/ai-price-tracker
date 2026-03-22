import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

const API_BASE_URL = environment.apiUrl;

export interface Product {
  productId: string;
  url: string;
  productName: string;
  currentPrice: number;
  currency: string;
  source: 'amazon' | 'temu';
  createdAt: string;
  updatedAt: string;
}

export interface PriceHistory {
  productId: string;
  timestamp: string;
  price: number;
  currency: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);

  getProducts(): Observable<Product[]> {
    return this.http.get<{ products: Product[] }>(`${API_BASE_URL}/products`)
      .pipe(map(res => res.products));
  }

  getPriceHistory(productId: string): Observable<PriceHistory[]> {
    return this.http.get<{ productId: string, history: PriceHistory[] }>(`${API_BASE_URL}/products/${productId}/history`)
      .pipe(map(res => res.history));
  }

  addProduct(url: string, chatId?: string): Observable<{ product: Product, priceHistory: PriceHistory }> {
    return this.http.post<{ product: Product, priceHistory: PriceHistory }>(`${API_BASE_URL}/products`, { url, chatId });
  }

  refreshPrices(productId: string): Observable<any> {
    return this.http.post(`${API_BASE_URL}/products/${productId}/refresh`, { productId });
  }
}
