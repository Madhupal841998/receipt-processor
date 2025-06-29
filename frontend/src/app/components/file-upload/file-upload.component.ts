import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReceiptService } from '../../services/receipt.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss'
})
export class FileUploadComponent {
  @Output() uploadComplete = new EventEmitter<number>();
  
  isDragging = false;
  isUploading = false;
  uploadProgress = 0;
  errorMessage = '';
  successMessage = '';

  constructor(private receiptService: ReceiptService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFileUpload(input.files[0]);
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.handleFileUpload(event.dataTransfer.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  private handleFileUpload(file: File): void {
    if (file.size > 10 * 1024 * 1024) {
      this.errorMessage = 'File size exceeds 10MB limit';
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;
    this.errorMessage = '';
    this.successMessage = '';

    const progressInterval = setInterval(() => {
      this.uploadProgress += 10;
      if (this.uploadProgress >= 90) clearInterval(progressInterval);
    }, 100);

    this.receiptService.uploadReceipt(file)
      .pipe(
        catchError(error => {
          this.errorMessage = error.message || 'Upload failed';
          return of(null);
        }),
        finalize(() => {
          this.isUploading = false;
          clearInterval(progressInterval);
          this.uploadProgress = 100;
          setTimeout(() => this.uploadProgress = 0, 1000);
        })
      )
      .subscribe(response => {
        if (response) {
          this.successMessage = 'File uploaded successfully! Processing...';
          this.uploadComplete.emit(response.id);
        }
      });
  }
}
