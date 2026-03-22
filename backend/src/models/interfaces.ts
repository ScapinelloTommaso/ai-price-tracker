/**
 * Interfacce TypeScript condivise tra Frontend e Backend
 * Fonte di verità per i modelli dati dell'applicazione.
 */

export interface Product {
  productId: string;
  url: string;
  productName: string;
  currentPrice: number;
  currency: string;
  source: string;
  createdAt: string;  // ISO 8601
  updatedAt: string;  // ISO 8601
  userId: string;
  chatId?: string;
}

export interface PriceHistory {
  productId: string;
  timestamp: string;  // ISO 8601 (Sort Key in DynamoDB)
  price: number;
  currency: string;
}

export interface AddProductRequest {
  url: string;
  chatId?: string;
}

export interface AddProductResponse {
  product: Product;
  priceHistory: PriceHistory;
}

export interface LlmParsedProduct {
  success: boolean;
  productName?: string;
  price?: number;
  currency?: string;
  imageUrl?: string;
}

export interface ApiErrorResponse {
  message: string;
  statusCode: number;
  timestamp: string;
}
