import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard';
import { AddProduct } from './features/add-product/add-product';
import { ProductDetail } from './features/product-detail/product-detail.component';
import { PrivacyComponent } from './features/privacy/privacy.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard, title: 'Dashboard | AI Price Tracker' },
  { path: 'add', component: AddProduct, title: 'Tracking | AI Price Tracker' },
  { path: 'product/:id', component: ProductDetail, title: 'Dettaglio | AI Price Tracker' },
  { path: 'privacy', component: PrivacyComponent, title: 'Privacy | AI Price Tracker' },
  { path: '**', redirectTo: 'dashboard' }
];
