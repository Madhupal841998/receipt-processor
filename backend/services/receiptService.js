const ReceiptModel = require('../models/ReceiptModel');
const FileModel = require('../models/FileModel');
const OCRService = require('./ocrService');
const fileModel = new FileModel();
const receiptModel = new ReceiptModel();
const ocrService = new OCRService();
class ReceiptService {
  constructor() {
  }

  async processFile(fileId) {
    console.log('Processing file...');
    const file = await fileModel.findById(fileId);
    if (!file || !file.is_valid) {
      console.log('Valid file not found');
      throw new Error('Valid file not found');
    }

    // Check if already processed
    const existingReceipt = await receiptModel.findByFileId(fileId);
    if (existingReceipt) {
      console.log('File already processed');
      return existingReceipt;
    }

    try {
      // Update processing status
      console.log('Updating processing status...');
      await fileModel.updateProcessingStatus(fileId, 'processing');
      
      // Process the file
      console.log('Processing file...');
      const text = await ocrService.extractText(file.file_path, file.file_type);
      const parsedData = await ocrService.parseReceiptText(text);

      console.log('Receipt parsed successfully');
      const receiptData = {
        file_id: fileId,
        purchased_at: parsedData.date,
        merchant_name: parsedData.merchant || 'Unknown Merchant',
        total_amount: parsedData.total || 0,
        tax_amount: parsedData.tax || 0,
        subtotal_amount: parsedData.subtotal || 0,
        payment_method: parsedData.paymentMethod || '',
        raw_text: text,
        extracted_data: parsedData
      };

      const receiptId = await receiptModel.create(receiptData);
      await fileModel.markAsProcessed(fileId);
      await fileModel.updateProcessingStatus(fileId, 'completed');

      console.log('Receipt saved successfully');
      return receiptModel.findById(receiptId);
    } catch (error) {
      console.log('Error processing file:', error);
      await fileModel.updateProcessingStatus(fileId, 'failed', error.message);
      throw error;
    }
  }

  async getAllReceipts(page = 1, pageSize = 10) {
    console.log('Finding all receipts...');
    const offset = (page - 1) * pageSize;
    return receiptModel.findAll(offset, pageSize);
  }

  async getReceiptById(id) {
    console.log('Finding receipt by ID...');
    return receiptModel.findById(id);
  }

  async searchReceipts(query) {
    console.log('Searching receipts...');
    return receiptModel.search(query);
  }

  async getReceiptStats() {
    console.log('Getting receipt stats...');
    return receiptModel.getStats();
  }
}

module.exports = ReceiptService;