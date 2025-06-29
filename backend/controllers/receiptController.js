const ReceiptService = require('../services/receiptService');
const receiptService = new ReceiptService();

const ReceiptController = {
  async processReceipt(req, res) {
    try {
      console.log('Processing receipt...');
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          status: false,
          message: 'Receipt ID is required'
        });
      }

      const receipt = await receiptService.processFile(id);

      res.json({
        status: true,
        data: receipt,
        message: 'Receipt processed successfully'
      });
    } catch (error) {
      console.error('Error processing receipt:', error);
      res.status(500).json({
        status: false,
        message: 'Internal Server Error during receipt processing',
        error: error.message,
        stack: error.stack
      });
    }
  },

  async getAllReceipts(req, res) {
    try {
      console.log('Getting all receipts...');
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;

      const receipts = await receiptService.getAllReceipts(page, pageSize);

      res.json({
        status: true,
        data: receipts,
        page,
        pageSize
      });
    } catch (error) {
      console.error('Error getting all receipts:', error);
      res.status(500).json({
        status: false,
        message: 'Internal Server Error while fetching receipts',
        error: error.message,
        stack: error.stack
      });
    }
  },

  async getReceiptById(req, res) {
    try {
      console.log('Getting receipt by ID...');
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          status: false,
          message: 'Receipt ID is required'
        });
      }

      const receipt = await receiptService.getReceiptById(id);

      if (!receipt) {
        return res.status(404).json({
          status: false,
          message: 'Receipt not found'
        });
      }

      res.json({
        status: true,
        data: receipt
      });
    } catch (error) {
      console.error('Error getting receipt by ID:', error);
      res.status(500).json({
        status: false,
        message: 'Internal Server Error while fetching receipt',
        error: error.message,
        stack: error.stack
      });
    }
  },

  async searchReceipts(req, res) {
    try {
      console.log('Searching receipts...');
      const { q } = req.query;

      if (!q || q.length < 2) {
        return res.status(400).json({
          status: false,
          message: 'Search query must be at least 2 characters long'
        });
      }

      const results = await receiptService.searchReceipts(q);

      res.json({
        status: true,
        data: results,
        query: q
      });
    } catch (error) {
      console.error('Error searching receipts:', error);
      res.status(500).json({
        status: false,
        message: 'Internal Server Error during receipt search',
        error: error.message,
        stack: error.stack
      });
    }
  },

  async getStats(req, res) {
    try {
      console.log('Getting receipt stats...');
      const stats = await receiptService.getReceiptStats();

      res.json({
        status: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting receipt stats:', error);
      res.status(500).json({
        status: false,
        message: 'Internal Server Error while fetching receipt stats',
        error: error.message,
        stack: error.stack
      });
    }
  }
};

module.exports = ReceiptController;
