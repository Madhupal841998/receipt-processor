import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReceiptService } from '../../services/receipt.service';
import { Receipt } from '../../models/receipt.model';
import { finalize } from 'rxjs/operators';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
@Component({
  selector: 'app-receipt-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './receipt-detail.component.html',
  styleUrl: './receipt-detail.component.scss',
})
export class ReceiptDetailComponent implements OnInit {
  receipt: Receipt | null = null;
  isLoading = true;
  safePdfUrl: SafeResourceUrl | null = null;
  constructor(
    private route: ActivatedRoute,
    private receiptService: ReceiptService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadReceipt(parseInt(id));
    }
  }

  getPdfFile(receipt: any): any {
    if (receipt?.file_type === 'application/pdf') {
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        receipt?.file_url
      );
    }
    return null;
  }

  loadReceipt(id: number): void {
    this.isLoading = true;
    this.receiptService
      .getReceipt(id)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (receipt) => {
          this.receipt = receipt?.data;
        },
        error: (err) => console.error('Failed to load receipt', err),
      });
  }
}
