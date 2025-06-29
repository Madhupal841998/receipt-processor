import { Routes } from '@angular/router';
import { ReceiptListComponent } from './components/receipt-list/receipt-list.component';
import { ReceiptDetailComponent } from './components/receipt-detail/receipt-detail.component';
import { StatsViewComponent } from './components/stats-view/stats-view.component';

export const routes: Routes = [
  { path: '', redirectTo: 'receipts', pathMatch: 'full' },
  { path: 'receipts', component: ReceiptListComponent },
  { path: 'receipts/:id', component: ReceiptDetailComponent },
  { path: 'stats', component: StatsViewComponent },
  { path: '**', redirectTo: 'receipts' }
];