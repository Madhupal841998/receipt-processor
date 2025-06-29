import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReceiptService } from '../../services/receipt.service';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss'
})
export class SearchBarComponent {
  @Output() searchComplete = new EventEmitter<any[]>();
  
  searchQuery = '';
  searchResults: any[] = [];
  isSearching = false;
  private searchTerms = new Subject<string>();

  constructor(private receiptService: ReceiptService) {
    this.searchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        this.isSearching = true;
        return this.receiptService.searchReceipts(term);
      })
    ).subscribe({
      next: (results) => {
        this.searchResults = results.data;
        this.searchComplete.emit(results.data);
        this.isSearching = false;
      },
      error: (err) => {
        console.error('Search failed', err);
        this.isSearching = false;
      }
    });
  }

  onSearchChange(): void {
    if (this.searchQuery.length >= 2) {
      this.searchTerms.next(this.searchQuery);
    } else {
      this.searchResults = [];
      this.searchComplete.emit([]);
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.searchComplete.emit([]);
  }
}
