import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReceiptService {
  private http = inject(HttpClient);

  uploadReceipt(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('receipt', file);
    return this.http.post<any>('/upload', formData);
  }

  processReceipt(fileId: number): Observable<any> {
    return this.http.post<any>(`/process/${fileId}`, {});
  }

  getReceipts(page: number, pageSize: number): Observable<any> {
    return this.http.get(`/receipts?page=${page}&pageSize=${pageSize}`);
  }


  getReceipt(id: number): Observable<any> {
    return this.http.get<any>(`/receipts/${id}`);
  }

  searchReceipts(query: string): Observable<any> {
    return this.http.get<any>(`/receipts/search?q=${query}`);
  }

  getStats(): Observable<any> {
    return this.http.get<any>('/receipts/stats');
  }
}