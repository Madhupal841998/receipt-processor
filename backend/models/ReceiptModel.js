const initializeDatabase = require('../config/database');
const db = initializeDatabase();
class ReceiptModel {
  constructor() {
    this.db = db;
  }

  create(receiptData) {
    console.log('Creating receipt...');
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO receipt (
          file_id, purchased_at, merchant_name, 
          total_amount, tax_amount, subtotal_amount,
          payment_method, raw_text, extracted_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          receiptData.file_id,
          receiptData.purchased_at,
          receiptData.merchant_name,
          receiptData.total_amount,
          receiptData.tax_amount,
          receiptData.subtotal_amount,
          receiptData.payment_method,
          receiptData.raw_text,
          JSON.stringify(receiptData.extracted_data)
        ],
        function(err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });
  }

  findByFileId(fileId) {
    console.log('Finding receipt by file ID...');
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM receipt WHERE file_id = ?',
        [fileId],
        (err, row) => {
          if (err) return reject(err);
          resolve(row);
        }
      );
    });
  }

  findAll(offset = 0, limit = 10) {
    console.log('Finding all receipts...');
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT r.*, rf.file_name, rf.file_path 
        FROM receipt r
        JOIN receipt_file rf ON r.file_id = rf.id
        ORDER BY r.purchased_at DESC
        LIMIT ? OFFSET ?
      `, [limit, offset], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  findById(id) {
    console.log('Finding receipt by ID...');
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT r.*, rf.file_name, rf.file_path, rf.file_url, rf.file_type
        FROM receipt r
        JOIN receipt_file rf ON r.file_id = rf.id
        WHERE r.id = ?
      `, [id], (err, row) => {
        if (err) return reject(err);
        if (row && row.extracted_data) {
          try {
            row.extracted_data = JSON.parse(row.extracted_data);
          } catch (e) {
            console.error('Error parsing extracted_data:', e);
          }
        }
        resolve(row);
      });
    });
  }

  search(query) {
    console.log('Searching receipts...');
    return new Promise((resolve, reject) => {
      const searchTerm = `%${query}%`;
      this.db.all(`
        SELECT r.*, rf.file_name, rf.file_path
        FROM receipt r
        JOIN receipt_file rf ON r.file_id = rf.id
        WHERE r.merchant_name LIKE ? OR r.raw_text LIKE ?
        ORDER BY r.purchased_at DESC
        LIMIT 50
      `, [searchTerm, searchTerm], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  getStats() {
    console.log('Getting receipt stats...');
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT 
          COUNT(*) as total_receipts,
          SUM(total_amount) as total_spent,
          AVG(total_amount) as average_amount,
          MIN(purchased_at) as oldest_date,
          MAX(purchased_at) as newest_date
        FROM receipt
      `, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }
}

module.exports = ReceiptModel;