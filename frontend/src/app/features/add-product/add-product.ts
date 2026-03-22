import { Component, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './add-product.html',
  styleUrls: ['./add-product.scss']
})
export class AddProduct implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  url: string = '';
  chatId: string = '';
  loading: boolean = false;
  error: string = '';

  ngOnInit() {
    const saved = localStorage.getItem('telegram_chat_id');
    if (saved) {
      this.chatId = saved;
    }
  }

  onSubmit() {
    if (!this.url.trim()) return;
    
    if (this.chatId.trim()) {
      localStorage.setItem('telegram_chat_id', this.chatId.trim());
    }
    
    this.loading = true;
    this.error = '';

    this.apiService.addProduct(this.url, this.chatId.trim() || undefined).subscribe({
      next: (res) => {
        this.loading = false;
        this.cdr.detectChanges();
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.message || 'Si è verificato un errore. Controlla l\'URL o riprova più tardi.';
        this.cdr.detectChanges();
      }
    });
  }
}
