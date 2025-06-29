import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReceiptService } from '../../services/receipt.service';
import { ReceiptStats } from '../../models/receipt.model';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-stats-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-view.component.html',
  styleUrl: './stats-view.component.scss'
})
export class StatsViewComponent implements OnInit {
  stats: ReceiptStats | null = null;
  isLoading = true;

  constructor(private receiptService: ReceiptService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.isLoading = true;
    this.receiptService.getStats()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
        },
        error: (err) => console.error('Failed to load stats', err)
      });
  }
}
