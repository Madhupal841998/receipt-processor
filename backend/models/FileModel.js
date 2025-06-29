const initializeDatabase = require('../config/database');
const db = initializeDatabase();
class FileModel {
  constructor() {
    this.db = db;
  }

  create(fileData) {
    console.log('Creating file...');
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO receipt_file (file_name, file_path, file_url, file_type, file_size) VALUES (?, ?, ?, ?, ?)',
        [fileData.file_name, fileData.file_path, fileData.file_url, fileData.file_type, fileData.file_size],
        function(err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });
  }

  updateValidity(id, isValid, invalidReason = null) {
    console.log('Updating file validity...');
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE receipt_file 
         SET is_valid = ?, invalid_reason = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [isValid, invalidReason, id],
        function(err) {
          if (err) return reject(err);
          resolve(this.changes);
        }
      );
    });
  }

  updateProcessingStatus(id, status, errorMessage = null) {
    console.log('Updating file processing status...');
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE receipt_file 
         SET processing_status = ?, invalid_reason = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [status, errorMessage, id],
        function(err) {
          if (err) return reject(err);
          resolve(this.changes);
        }
      );
    });
  }

  markAsProcessed(id) {
    console.log('Marking file as processed...');
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE receipt_file 
         SET is_processed = 1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [id],
        function(err) {
          if (err) return reject(err);
          resolve(this.changes);
        }
      );
    });
  }

  findById(id) {
    console.log('Finding file by ID...');
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM receipt_file WHERE id = ?',
        [id],
        (err, row) => {
          if (err) return reject(err);
          resolve(row);
        }
      );
    });
  }

  findAllUnprocessed() {
    console.log('Finding all unprocessed files...');
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM receipt_file WHERE is_valid = 1 AND is_processed = 0',
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
  }

  findInvalidFilesBefore(cutoffDate) {
    console.log('Finding invalid files before cutoff date...');
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM receipt_file WHERE is_valid = 0 AND created_at < ?',
        [cutoffDate.toISOString()],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
  }

  delete(id) {
    console.log('Deleting file...');
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM receipt_file WHERE id = ?',
        [id],
        function(err) {
          if (err) return reject(err);
          resolve(this.changes);
        }
      );
    });
  }
}

module.exports = FileModel;