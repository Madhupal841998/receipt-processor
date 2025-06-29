import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReceiptService } from '../../services/receipt.service';
import { FileUploadComponent } from '../file-upload/file-upload.component';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-receipt-list',
  standalone: true,
  imports: [CommonModule, FileUploadComponent],
  templateUrl: './receipt-list.component.html',
  styleUrl: './receipt-list.component.scss',
})
export class ReceiptListComponent implements OnInit {
  receipts: any[] = [];
  isLoading = true;
  isLoadingMore = false;
  currentPage = 1;
  pageSize = 10;
  hasMore = true;

  constructor(private receiptService: ReceiptService,private router: Router) {}

  ngOnInit(): void {
    this.loadReceipts();
  }

  loadReceipts(): void {
    this.isLoading = true;

    this.receiptService
      .getReceipts(this.currentPage, this.pageSize)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (receipts) => {
          const newReceipts = Array.isArray(receipts) ? receipts : [];
          const existingReceipts = Array.isArray(this.receipts)
            ? this.receipts
            : [];

          this.receipts = [...existingReceipts, ...newReceipts];
          this.hasMore = newReceipts.length === this.pageSize;
        },
        error: (err) => {
          console.error('Failed to load receipts', err);
        },
      });
  }

  loadMore(): void {
    this.currentPage++;
    this.isLoadingMore = true;
    this.receiptService
      .getReceipts(this.currentPage, this.pageSize)
      .pipe(finalize(() => (this.isLoadingMore = false)))
      .subscribe({
        next: (receipts) => {
          this.receipts = [...this.receipts, ...receipts];
          this.hasMore = receipts.length === this.pageSize;
        },
        error: (err) => console.error('Failed to load more receipts', err),
      });
  }

  onUploadComplete(fileId: number): void {
    this.receiptService.processReceipt(fileId).subscribe({
      next: (receipt) => {
        this.receipts = [receipt, ...this.receipts];
      },
      error: (err) => console.error('Failed to process receipt', err),
    });
  }

  onReceiptClick(receipt:any): void {
    this.router.navigate(['/receipts', receipt.id]);
  }
}
