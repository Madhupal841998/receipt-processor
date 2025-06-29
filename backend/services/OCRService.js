const { createWorker } = require("tesseract.js");
const pdf = require("pdf-parse");
const fs = require("fs");
const { DateTime } = require("luxon");

class OCRService {
  constructor() {
    this.worker = createWorker();
    this.workerInitialized = false;
    
    // Enhanced merchant patterns with more variations
    this.knownMerchants = {
      // Fast Food
      'McDonald\'s': [/mcdonald'?s/i, /mcdonalds/i, /golden arches/i],
      'Burger King': [/burger\s*king/i, /bk\s*lounge/i],
      'KFC': [/kfc/i, /kentucky fried chicken/i],
      'Subway': [/subway/i],
      'Taco Bell': [/taco\s*bell/i],
      'Pizza Hut': [/pizza\s*hut/i],
      'Domino\'s': [/domino'?s/i, /dominos/i],
      'Wendy\'s': [/wendy'?s/i, /wendys/i],
      'In-N-Out': [/in\s*n\s*out/i, /in-n-out/i],
      'Five Guys': [/five\s*guys/i, /5\s*guys/i],
      'Chipotle': [/chipotle/i],
      'Panda Express': [/panda\s*express/i, /pandaexpress/i],
      
      // Retail
      'Walmart': [/walmart/i, /wal\s*mart/i],
      'Target': [/target/i],
      'Best Buy': [/best\s*buy/i, /bestbuy/i],
      'Home Depot': [/home\s*depot/i, /homedepot/i],
      'Lowe\'s': [/lowe'?s/i, /lowes/i],
      'CVS': [/cvs/i, /cvs\s*pharmacy/i],
      'Walgreens': [/walgreens/i],
      'Costco': [/costco/i],
      'Sam\'s Club': [/sam'?s\s*club/i, /sams\s*club/i],
      
      // Coffee & Casual Dining
      'Starbucks': [/starbucks/i, /sbux/i],
      'Dunkin\'': [/dunkin'?/i, /dunkin\s*donuts/i],
      'Applebee\'s': [/applebee'?s/i, /applebees/i],
      'Chili\'s': [/chili'?s/i, /chilis/i],
      'Olive Garden': [/olive\s*garden/i],
      'Red Lobster': [/red\s*lobster/i],
      'Denny\'s': [/denny'?s/i, /dennys/i],
      'IHOP': [/ihop/i, /international house of pancakes/i],
      
      // Gas Stations
      'Shell': [/shell/i],
      'Exxon': [/exxon/i, /esso/i],
      'BP': [/\bbp\b/i, /british petroleum/i],
      'Chevron': [/chevron/i],
      'Mobil': [/mobil/i],
      '7-Eleven': [/7\s*eleven/i, /7-11/i, /711/i],
      
      // Grocery
      'Safeway': [/safeway/i],
      'Kroger': [/kroger/i],
      'Publix': [/publix/i],
      'Whole Foods': [/whole\s*foods/i, /wholefoods/i],
      'Trader Joe\'s': [/trader\s*joe'?s/i, /traderjoes/i]
    };

    // Enhanced payment method patterns
    this.paymentPatterns = [
      // Card types with last 4 digits
      { pattern: /(visa|mastercard|mc|amex|american\s*express|discover|diners?\s*club|jcb)[\s\*]*(\d{4})/i, type: 'card' },
      { pattern: /(visa|mastercard|mc|amex|american\s*express|discover|diners?\s*club|jcb)[\s\*\-]*\*+[\s\*\-]*(\d{4})/i, type: 'card' },
      { pattern: /\*+(\d{4})\s*(visa|mastercard|mc|amex|american\s*express|discover|diners?\s*club|jcb)/i, type: 'card' },
      
      // Debit/Credit cards
      { pattern: /(debit|credit)\s*card[\s\*]*(\d{4})/i, type: 'card' },
      { pattern: /(debit|credit)[\s\*]*\*+[\s\*]*(\d{4})/i, type: 'card' },
      
      // Digital payments
      { pattern: /(apple\s*pay|google\s*pay|samsung\s*pay|android\s*pay)/i, type: 'digital' },
      { pattern: /(paypal|venmo|zelle|cashapp|cash\s*app)/i, type: 'digital' },
      
      // Cash
      { pattern: /\b(cash|change\s*due|change\s*given)\b/i, type: 'cash' },
      
      // EMV/Chip
      { pattern: /(chip|contactless|tap)\s*(read|payment)/i, type: 'chip' },
      { pattern: /emv[\s:]*(\w+)/i, type: 'chip' }
    ];

    // Money patterns - more comprehensive
    this.moneyPatterns = [
      /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2}))\s*\$/g,
      /USD\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2}))\s*USD/gi,
      /\b(\d+\.\d{2})\b/g,
      // Handle parentheses for negative amounts
      /\$?\s*\((\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\)/g,
      // Handle negative signs
      /-\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g
    ];
  }

  async initializeWorker() {
    if (this.workerInitialized) return;
    await this.worker.load();
    await this.worker.loadLanguage("eng");
    await this.worker.initialize("eng");
    this.workerInitialized = true;
  }

  async extractTextFromPdf(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdf(dataBuffer);
    return pdfData.text;
  }

  async extractTextFromImage(filePath) {
    await this.initializeWorker();
    const { data: { text } } = await this.worker.recognize(filePath);
    return text;
  }

  async extractText(filePath, fileType) {
    if (fileType === "application/pdf") {
      return this.extractTextFromPdf(filePath);
    } else if (fileType.startsWith("image/")) {
      return this.extractTextFromImage(filePath);
    }
    throw new Error("Unsupported file type");
  }

  // Enhanced text cleaning
  cleanText(text) {
    if (!text) return "";
    
    // Replace common OCR mistakes
    let cleaned = text
      .replace(/[`'']/g, "'")  // Fix apostrophes
      .replace(/[""]/g, '"')   // Fix quotes
      .replace(/—/g, '-')      // Fix dashes
      .replace(/\s+/g, ' ')    // Multiple spaces to single
      .replace(/[^\w\s.,\-$()\/:#@&]/g, ' ') // Remove special chars but keep common ones
      .trim();
    
    return cleaned;
  }

  // Improved date parsing
  parseDate(text) {
    if (!text) return null;
    
    const dateString = this.cleanText(text);
    
    // Common date patterns
    const patterns = [
      // MM/DD/YYYY and variations
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})/,
      
      // Month names
      /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{1,2}),?\s+(\d{4})/i,
      /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{4})/i,
      
      // YYYY-MM-DD
      /(\d{4})-(\d{1,2})-(\d{1,2})/,
      
      // Time stamps
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s+(\d{1,2}):(\d{2})/
    ];

    for (const pattern of patterns) {
      const match = dateString.match(pattern);
      if (match) {
        try {
          // Try Luxon first
          const dt = DateTime.fromFormat(match[0], 'M/d/yyyy');
          if (dt.isValid) return dt.toJSDate();
          
          // Fallback to native Date
          const date = new Date(match[0]);
          if (!isNaN(date.getTime())) return date;
        } catch (e) {
          continue;
        }
      }
    }

    return null;
  }

  // Completely rebuilt merchant extraction
  extractMerchant(lines) {
    if (!lines || lines.length === 0) return "Unknown Merchant";

    // First, try known merchant patterns
    for (const [merchantName, patterns] of Object.entries(this.knownMerchants)) {
      for (const pattern of patterns) {
        for (const line of lines) {
          if (pattern.test(line)) {
            return merchantName;
          }
        }
      }
    }

    // Look for merchant in header (first 5 lines)
    const headerLines = lines.slice(0, 5);
    
    // Skip lines that are clearly not merchant names
    const skipPatterns = [
      /^\s*$/,  // Empty lines
      /date|time|receipt|invoice|order/i,
      /^\d+$|^[\d\s\-\*\.]+$/,  // Only numbers/symbols
      /total|subtotal|tax|amount/i,
      /www\.|\.com|\.net|\.org|http/i,  // URLs
      /phone|tel:|address|street|city|state|zip/i,
      /thank\s*you|welcome|visit\s*again/i
    ];

    for (const line of headerLines) {
      const cleanLine = this.cleanText(line).trim();
      
      // Skip if matches skip patterns
      if (skipPatterns.some(pattern => pattern.test(cleanLine))) continue;
      
      // Must have letters and reasonable length
      if (cleanLine.length >= 3 && cleanLine.length <= 50 && /[a-zA-Z]/.test(cleanLine)) {
        // Remove common suffixes
        let merchantName = cleanLine.replace(/\s*(LLC|Inc|Corp|Ltd|Restaurant|Store|Shop|Cafe|Market)\b\.?/gi, '').trim();
        
        if (merchantName.length >= 3) {
          return merchantName;
        }
      }
    }

    // Look for location indicators
    const locationPatterns = [
      /store\s*#?\s*(\d+)/i,
      /location\s*#?\s*(\d+)/i,
      /restaurant\s*#?\s*(\d+)/i
    ];

    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i];
      for (const pattern of locationPatterns) {
        if (pattern.test(line) && i > 0) {
          const prevLine = this.cleanText(lines[i-1]).trim();
          if (prevLine.length >= 3 && prevLine.length <= 50) {
            return prevLine.replace(/\s*(LLC|Inc|Corp|Ltd)\b\.?/gi, '').trim();
          }
        }
      }
    }

    return "Unknown Merchant";
  }

  // Rebuilt payment method extraction
  extractPaymentMethod(lines) {
    if (!lines || lines.length === 0) return "Unknown Payment Method";

    for (const line of lines) {
      const cleanLine = this.cleanText(line);
      
      for (const paymentInfo of this.paymentPatterns) {
        const match = cleanLine.match(paymentInfo.pattern);
        if (match) {
          switch (paymentInfo.type) {
            case 'card':
              const cardType = match[1] ? match[1].toLowerCase() : '';
              const lastFour = match[2] || '';
              
              // Normalize card type names
              let normalizedCardType = cardType;
              if (cardType.includes('mc') || cardType.includes('mastercard')) normalizedCardType = 'Mastercard';
              else if (cardType.includes('visa')) normalizedCardType = 'Visa';
              else if (cardType.includes('amex') || cardType.includes('american')) normalizedCardType = 'American Express';
              else if (cardType.includes('discover')) normalizedCardType = 'Discover';
              else if (cardType.includes('diners')) normalizedCardType = 'Diners Club';
              else normalizedCardType = cardType.charAt(0).toUpperCase() + cardType.slice(1);
              
              return lastFour ? `${normalizedCardType} ****${lastFour}` : normalizedCardType;
              
            case 'digital':
              return match[1].split(/\s+/).map(word => 
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              ).join(' ');
              
            case 'cash':
              return 'Cash';
              
            case 'chip':
              return 'Chip/Contactless';
              
            default:
              return match[1] || match[0];
          }
        }
      }
    }

    return "Unknown Payment Method";
  }

  // Enhanced monetary value extraction
  extractMonetaryValue(text, fallback = 0) {
    if (!text) return fallback;
    
    const cleanText = this.cleanText(text);
    let bestMatch = fallback;
    let highestConfidence = 0;

    for (const pattern of this.moneyPatterns) {
      let match;
      while ((match = pattern.exec(cleanText)) !== null) {
        let value = parseFloat(match[1].replace(/,/g, ''));
        
        // Handle negative amounts
        if (text.includes('(') || text.includes('-')) {
          value = -Math.abs(value);
        }
        
        if (!isNaN(value)) {
          // Calculate confidence based on context
          let confidence = 0.5;
          
          // Higher confidence for values with currency symbols
          if (match[0].includes('$') || match[0].includes('USD')) confidence += 0.3;
          
          // Higher confidence for properly formatted amounts
          if (/\d+\.\d{2}/.test(match[1])) confidence += 0.2;
          
          if (confidence > highestConfidence && Math.abs(value) > 0) {
            bestMatch = Math.abs(value);  // Always return positive for amounts
            highestConfidence = confidence;
          }
        }
      }
      pattern.lastIndex = 0; // Reset regex
    }

    return bestMatch;
  }

  // Completely rebuilt item extraction
  extractItems(lines) {
    if (!lines || lines.length === 0) return [];

    const items = [];
    const skipPatterns = [
      /total|subtotal|tax|tip|gratuity|balance|payment|change|discount/i,
      /receipt|invoice|order|date|time|server|table|check|guest/i,
      /thank\s*you|welcome|visit\s*again/i,
      /^\s*$/,  // Empty lines
      /www\.|\.com|\.net|\.org|http/i,
      /phone|address|street|city|state|zip/i
    ];

    // Patterns for different item line formats
    const itemPatterns = [
      // Quantity, description, price: "2 HAMBURGER 12.99"
      { pattern: /^(\d+)\s+(.+?)\s+(\d+\.\d{2})$/i, qtyIdx: 1, descIdx: 2, priceIdx: 3 },
      
      // Description and price: "HAMBURGER 12.99"
      { pattern: /^(.+?)\s+(\d+\.\d{2})$/i, qtyIdx: null, descIdx: 1, priceIdx: 2 },
      
      // Price and description: "12.99 HAMBURGER"
      { pattern: /^(\d+\.\d{2})\s+(.+)$/i, qtyIdx: null, priceIdx: 1, descIdx: 2 },
      
      // Quantity, description, @, price: "2 HAMBURGER @ 6.50"
      { pattern: /^(\d+)\s+(.+?)\s+@\s*(\d+\.\d{2})$/i, qtyIdx: 1, descIdx: 2, priceIdx: 3 },
      
      // With dollar signs: "$12.99 HAMBURGER" or "HAMBURGER $12.99"
      { pattern: /^\$(\d+\.\d{2})\s+(.+)$/i, qtyIdx: null, priceIdx: 1, descIdx: 2 },
      { pattern: /^(.+?)\s+\$(\d+\.\d{2})$/i, qtyIdx: null, descIdx: 1, priceIdx: 2 }
    ];

    for (const line of lines) {
      const cleanLine = this.cleanText(line).trim();
      
      // Skip lines that don't look like items
      if (skipPatterns.some(pattern => pattern.test(cleanLine))) continue;
      if (cleanLine.length < 3 || cleanLine.length > 100) continue;

      for (const itemPattern of itemPatterns) {
        const match = cleanLine.match(itemPattern.pattern);
        if (match) {
          let quantity = 1;
          let description = '';
          let price = 0;

          // Extract quantity
          if (itemPattern.qtyIdx && match[itemPattern.qtyIdx]) {
            quantity = parseInt(match[itemPattern.qtyIdx]) || 1;
          }

          // Extract description
          if (itemPattern.descIdx && match[itemPattern.descIdx]) {
            description = match[itemPattern.descIdx].trim();
            // Clean up description
            description = description.replace(/[^\w\s\-'&]/g, ' ').replace(/\s+/g, ' ').trim();
          }

          // Extract price
          if (itemPattern.priceIdx && match[itemPattern.priceIdx]) {
            price = parseFloat(match[itemPattern.priceIdx]) || 0;
          }

          // Validate the extracted data
          if (description && description.length >= 2 && price > 0 && price < 1000) {
            // Check if description looks reasonable (has letters)
            if (/[a-zA-Z]/.test(description)) {
              items.push({
                quantity: quantity,
                description: description,
                price: Math.round(price * 100) / 100,
                total: Math.round(quantity * price * 100) / 100
              });
              break; // Found a match, move to next line
            }
          }
        }
      }
    }

    return items;
  }

  // Main parsing function with improved logic
  parseReceiptText(text) {
    if (!text || text.trim().length === 0) {
      return this.getEmptyResult();
    }

    const cleanedText = this.cleanText(text);
    const lines = cleanedText.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const result = {
      merchant: "",
      date: null,
      total: 0,
      subtotal: 0,
      tax: 0,
      tip: 0,
      paymentMethod: "",
      items: [],
      rawLines: lines,
      confidence: {
        merchant: 0,
        date: 0,
        total: 0,
        subtotal: 0,
        tax: 0,
        tip: 0,
        paymentMethod: 0,
        items: 0
      }
    };

    // Extract merchant
    result.merchant = this.extractMerchant(lines);
    result.confidence.merchant = result.merchant !== "Unknown Merchant" ? 0.9 : 0.1;

    // Extract date
    for (const line of lines.slice(0, 15)) {  // Check first 15 lines for date
      const date = this.parseDate(line);
      if (date) {
        result.date = date;
        result.confidence.date = 0.9;
        break;
      }
    }
    if (!result.date) {
      result.date = new Date();
      result.confidence.date = 0.1;
    }

    // Extract monetary values with better context awareness
    const amountLines = this.extractAmounts(lines);
    
    result.total = amountLines.total || 0;
    result.subtotal = amountLines.subtotal || 0;
    result.tax = amountLines.tax || 0;
    result.tip = amountLines.tip || 0;
    
    result.confidence.total = amountLines.total > 0 ? 0.9 : 0.1;
    result.confidence.subtotal = amountLines.subtotal > 0 ? 0.9 : 0.1;
    result.confidence.tax = amountLines.tax > 0 ? 0.9 : 0.1;
    result.confidence.tip = amountLines.tip > 0 ? 0.9 : 0.1;

    // Extract payment method
    result.paymentMethod = this.extractPaymentMethod(lines);
    result.confidence.paymentMethod = result.paymentMethod !== "Unknown Payment Method" ? 0.9 : 0.1;

    // Extract items
    result.items = this.extractItems(lines);
    result.confidence.items = result.items.length > 0 ? Math.min(0.9, result.items.length * 0.2) : 0.1;

    // Validate and cross-check amounts
    this.validateAmounts(result);

    return result;
  }

  // Helper method to extract amounts with better context
  extractAmounts(lines) {
    const amounts = {
      total: 0,
      subtotal: 0,
      tax: 0,
      tip: 0
    };

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      const amount = this.extractMonetaryValue(line);

      if (amount <= 0) continue;

      // Total patterns
      if (lowerLine.match(/\b(total|amount due|balance|grand total|final total|payment)\b/) && !amounts.total) {
        amounts.total = amount;
      }
      // Subtotal patterns
      else if (lowerLine.match(/\b(subtotal|sub total|sub-total|merchandise)\b/) && !amounts.subtotal) {
        amounts.subtotal = amount;
      }
      // Tax patterns
      else if (lowerLine.match(/\b(tax|vat|gst|sales tax|state tax)\b/) && !amounts.tax) {
        amounts.tax = amount;
      }
      // Tip patterns
      else if (lowerLine.match(/\b(tip|gratuity|service|service charge)\b/) && !amounts.tip) {
        amounts.tip = amount;
      }
    }

    return amounts;
  }

  // Helper method to validate and cross-check amounts
  validateAmounts(result) {
    // If we have items but no subtotal, calculate it
    if (result.items.length > 0 && result.subtotal === 0) {
      result.subtotal = result.items.reduce((sum, item) => sum + item.total, 0);
      result.confidence.subtotal = 0.7;
    }

    // If we have subtotal and tax but no total, calculate it
    if (result.subtotal > 0 && result.total === 0) {
      result.total = result.subtotal + result.tax + result.tip;
      result.confidence.total = 0.7;
    }

    // If we have total and subtotal but no tax, calculate it
    if (result.total > 0 && result.subtotal > 0 && result.tax === 0) {
      const calculatedTax = result.total - result.subtotal - result.tip;
      if (calculatedTax > 0 && calculatedTax < result.subtotal * 0.3) {  // Reasonable tax rate
        result.tax = calculatedTax;
        result.confidence.tax = 0.6;
      }
    }

    // Round all monetary values
    result.total = Math.round(result.total * 100) / 100;
    result.subtotal = Math.round(result.subtotal * 100) / 100;
    result.tax = Math.round(result.tax * 100) / 100;
    result.tip = Math.round(result.tip * 100) / 100;
  }

  getEmptyResult() {
    return {
      merchant: "Unknown Merchant",
      date: new Date(),
      total: 0,
      subtotal: 0,
      tax: 0,
      tip: 0,
      paymentMethod: "Unknown Payment Method",
      items: [],
      rawLines: [],
      confidence: {
        merchant: 0,
        date: 0.1,
        total: 0,
        subtotal: 0,
        tax: 0,
        tip: 0,
        paymentMethod: 0,
        items: 0
      }
    };
  }

  async terminate() {
    if (this.workerInitialized) {
      await this.worker.terminate();
      this.workerInitialized = false;
    }
  }
}
module.exports = OCRService;