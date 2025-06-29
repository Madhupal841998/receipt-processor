const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const initializeDatabase = () => {
  const dbPath = path.join(__dirname, '../receipts.db');
  
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new sqlite3.Database(dbPath);

  db.serialize(() => {
    db.run('PRAGMA foreign_keys = ON');

    db.run(`
      CREATE TABLE IF NOT EXISTS receipt_file (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_url TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        is_valid BOOLEAN DEFAULT 0,
        invalid_reason TEXT,
        is_processed BOOLEAN DEFAULT 0,
        processing_status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS receipt (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id INTEGER NOT NULL,
        purchased_at DATETIME,
        merchant_name TEXT,
        total_amount REAL,
        tax_amount REAL,
        subtotal_amount REAL,
        payment_method TEXT,
        raw_text TEXT,
        extracted_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (file_id) REFERENCES receipt_file(id) ON DELETE CASCADE
      )
    `);

    db.run('CREATE INDEX IF NOT EXISTS idx_receipt_file_id ON receipt(file_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_receipt_merchant ON receipt(merchant_name)');
    db.run('CREATE INDEX IF NOT EXISTS idx_receipt_date ON receipt(purchased_at)');
  });
  console.log('Database initialized');

  return db;
};

module.exports = initializeDatabase;