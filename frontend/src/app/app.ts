import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="min-h-screen bg-dark-bg text-dark-text font-sans flex flex-col">
      <!-- Top Navigation -->
      <header class="sticky top-0 z-50 bg-dark-bg/80 backdrop-blur-md border-b border-white/5">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a routerLink="/" class="flex items-center gap-2 group">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform">
              ai
            </div>
            <span class="text-xl font-bold tracking-tight text-white group-hover:text-primary-500 transition-colors">PriceTracker</span>
          </a>
        </div>
      </header>

      <!-- Main Content Area -->
      <main class="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <router-outlet></router-outlet>
      </main>
      
      <!-- Footer -->
      <footer class="border-t border-white/5 py-8 mt-auto">
        <div class="max-w-7xl mx-auto px-4 text-center text-sm text-dark-muted flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6">
          <span>&copy; 2026 AI-Powered Price Tracker. Zero CSS selector scraping.</span>
          <a routerLink="/privacy" class="hover:text-primary-500 transition-colors">Privacy Policy</a>
        </div>
      </footer>
    </div>
  `
})
export class App { }
