const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const initializeDatabase = require('./config/database');
const fileController = require('./controllers/fileController');
const receiptController = require('./controllers/receiptController');
const ocrService = require('./services/ocrService');

const app = express();
const db = initializeDatabase();
// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200'
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));


// File routes
app.post('/api/upload', (req, res) => fileController.uploadFile(req, res));
app.post('/api/validate/:id', (req, res) => fileController.validateFile(req, res));
app.post('/api/cleanup', (req, res) => fileController.cleanupFiles(req, res));

// Receipt routes
app.post('/api/process/:id', (req, res) => receiptController.processReceipt(req, res));
app.get('/api/receipts', (req, res) => receiptController.getAllReceipts(req, res));
app.get('/api/receipts/:id', (req, res) => receiptController.getReceiptById(req, res));
app.get('/api/receipts/search', (req, res) => receiptController.searchReceipts(req, res));
app.get('/api/receipts/stats', (req, res) => receiptController.getStats(req, res));

// Static files (for uploaded receipts)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    error: 'Internal Server Error',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: 'The requested resource was not found'
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing server...');
  new ocrService().terminate().then(() => {
    db.close();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Closing server...');
  new ocrService().terminate().then(() => {
    db.close();
    process.exit(0);
  });
});

module.exports = app;