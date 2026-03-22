import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { PriceHistory } from '../../core/services/api.service';
// Importo i componenti di Chart.js necessari al tree-shaking
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-price-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="w-full h-[400px] bg-dark-surface rounded-2xl p-4 md:p-6 border border-white/5 shadow-xl">
      <div *ngIf="history.length === 0" class="h-full flex items-center justify-center text-dark-muted">
        Dati storici non disponibili
      </div>
      <canvas *ngIf="history.length > 0" baseChart
        [data]="lineChartData"
        [options]="lineChartOptions"
        [type]="lineChartType">
      </canvas>
    </div>
  `
})
export class PriceChart implements OnChanges {
  @Input() history: PriceHistory[] = [];
  @Input() currency: string = '€';
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  public lineChartType: ChartType = 'line';

  public lineChartData: ChartConfiguration['data'] = {
    datasets: [],
    labels: []
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      line: {
        tension: 0.4, // Curva morbida
        borderWidth: 3
      },
      point: {
        radius: 4,
        hoverRadius: 6,
        backgroundColor: '#10b981', // Smeraldo tailwind
        borderWidth: 2,
        borderColor: '#0f172a' // Dark bg tailwind
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#94a3b8', // text-dark-muted
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#94a3b8',
          callback: (value) => {
            return '€' + Number(value).toFixed(2);
          }
        }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#10b981',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => {
            return `Prezzo: ${context.parsed.y} ${this.currency}`;
          }
        }
      }
    }
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['history'] && this.history) {
      this.updateChartData();
    }
  }

  private updateChartData() {
    if (!this.history || this.history.length === 0) return;

    // Ordina per data crescente
    const sortedHistory = [...this.history].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const dataPoints = sortedHistory.map(h => h.price);
    
    // Padding singolo punto per non farlo scomparire o creare scale sballate
    const yAxis = this.lineChartOptions!.scales!['y'] as any;
    if (dataPoints.length === 1) {
      const p = dataPoints[0];
      const pad = Math.max(0.5, p * 0.05);
      yAxis.suggestedMin = Math.max(0, p - pad);
      yAxis.suggestedMax = p + pad;
    } else {
      delete yAxis.suggestedMin;
      delete yAxis.suggestedMax;
    }

    const labels = sortedHistory.map(h => {
      const d = new Date(h.timestamp);
      return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    });

    this.lineChartData = {
      labels: labels,
      datasets: [
        {
          data: dataPoints,
          label: 'Prezzo',
          borderColor: '#10b981', // Smeraldo tailwind
          backgroundColor: 'rgba(16, 185, 129, 0.1)', // Fill sfumato
          fill: true,
          pointBackgroundColor: '#10b981',
        }
      ]
    };

    this.chart?.update();
  }
}
