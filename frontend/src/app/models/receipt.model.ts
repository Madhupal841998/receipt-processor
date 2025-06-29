export interface ReceiptFile {
  id: number;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  is_valid: boolean;
  invalid_reason: string | null;
  is_processed: boolean;
  processing_status: string;
  created_at: string;
  updated_at: string;
}

export interface ReceiptItem {
  quantity: number;
  description: string;
  price: number;
}

export interface Receipt {
  id: number;
  file_id: number;
  purchased_at: string;
  merchant_name: string;
  total_amount: number;
  tax_amount: number;
  subtotal_amount: number;
  payment_method: string;
  raw_text: string;
  extracted_data: {
    merchant: string;
    date: string;
    total: number;
    subtotal: number;
    tax: number;
    paymentMethod: string;
    items: ReceiptItem[];
    rawLines: string[];
  };
  created_at: string;
  updated_at: string;
  file_name?: string;
  file_path?: string;
  file_url: string;
  file_type?: string;
}

export interface ReceiptStats {
  total_receipts: number;
  total_spent: number;
  average_amount: number;
  oldest_date: string;
  newest_date: string;
}

export interface SearchResults {
  data: Receipt[];
  query: string;
}