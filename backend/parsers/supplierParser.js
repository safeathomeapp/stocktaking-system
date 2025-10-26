/**
 * ============================================================================
 * BASE SUPPLIER PARSER CLASS
 * ============================================================================
 *
 * Purpose:
 *   Provides abstract base class for all supplier-specific PDF parsers.
 *   Ensures consistent interface and structure across all supplier implementations.
 *
 * Architecture:
 *   - Abstract base class (never instantiated directly)
 *   - Each supplier extends this class: class BooberParser extends SupplierParser
 *   - Enforces implementation of parse() method
 *   - Provides common utility methods for text extraction and item parsing
 *
 * Usage:
 *   Subclasses must implement:
 *     - parse(pdfText) -> Promise<ParseResult>
 *     - detectSupplier(pdfText) -> SupplierDetection (static)
 *
 * Output Format:
 *   All parsers return standardized ParseResult object:
 *   {
 *     success: boolean,
 *     supplier: {
 *       id: string,                 // Unique supplier ID
 *       name: string,               // Supplier name
 *       confidence: number          // 0-100 confidence score
 *     },
 *     parsedItems: Array<ParsedItem>,
 *     metadata: {
 *       invoiceNumber: string,
 *       invoiceDate: string,        // ISO format
 *       totalAmount: number,
 *       subtotal: number,
 *       vatTotal: number
 *     },
 *     rawText: string,             // Full PDF text (for debugging)
 *     parserUsed: string,          // Which parser processed this
 *     notes: string                // Any parsing notes/warnings
 *   }
 *
 * ParsedItem format:
 *   {
 *     supplierSku: string,
 *     supplierName: string,
 *     description?: string,
 *     packSize?: string,           // "24x500ml" or "1L" etc
 *     unitSize?: string,           // "500ml" or "750ml" etc
 *     quantity: number,
 *     unitPrice: number,
 *     nettPrice: number,
 *     vatCode?: string,            // e.g., "Standard", "Zero", "Exempt"
 *     vatRate?: number,            // e.g., 20 for 20%
 *     vatAmount?: number,
 *     lineTotal: number,
 *     categoryHeader?: string      // For Booker: which category this item belongs to
 *   }
 * ============================================================================
 */

/**
 * Abstract base parser class
 * All supplier-specific parsers must extend this
 */
class SupplierParser {
  // ========== CONSTRUCTOR ==========

  /**
   * Initialize parser with supplier configuration
   *
   * @param {Object} config - Supplier configuration
   * @param {string} config.supplierId - UUID of supplier in database
   * @param {string} config.name - Supplier display name
   * @param {Array<string>} config.detectionKeywords - Keywords to detect this supplier
   * @param {number} config.detectionConfidenceThreshold - Min confidence 0-100
   */
  constructor(config) {
    this.supplierId = config.supplierId;
    this.supplierName = config.name;
    this.detectionKeywords = config.detectionKeywords || [];
    this.detectionConfidenceThreshold = config.detectionConfidenceThreshold || 60;
    this.parserType = config.parserType || 'unknown';
  }

  // ========== ABSTRACT METHODS (Must be implemented by subclasses) ==========

  /**
   * Parse PDF text and extract invoice items
   * MUST be implemented by subclass
   *
   * @param {string} pdfText - Raw text extracted from PDF
   * @returns {Promise<ParseResult>}
   * @throws {Error} If PDF cannot be parsed
   */
  async parse(pdfText) {
    throw new Error('parse() method must be implemented by subclass');
  }

  /**
   * Detect if this parser is suitable for given PDF text
   * Called during supplier detection phase
   * SHOULD be implemented by subclass, or use default detection
   *
   * @param {string} pdfText - Raw text extracted from PDF
   * @returns {{isMatch: boolean, confidence: number, notes: string}}
   */
  static detectSupplier(pdfText) {
    // Default detection - subclasses should override
    return {
      isMatch: false,
      confidence: 0,
      notes: 'No detection logic implemented',
    };
  }

  // ========== PROTECTED UTILITY METHODS ==========

  /**
   * Extract lines from text, handling various line endings
   * Useful for PDF text which may have inconsistent line breaks
   *
   * @param {string} text - Text to split into lines
   * @returns {Array<string>} Array of lines, empty lines removed
   */
  extractLines(text) {
    return text
      .split(/\r?\n|\r/)
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  /**
   * Find line containing search text (case insensitive)
   *
   * @param {Array<string>} lines - Array of lines to search
   * @param {string} searchText - Text to find
   * @param {number} startIndex - Start searching from this line index
   * @returns {number} Index of found line, or -1
   */
  findLineIndex(lines, searchText, startIndex = 0) {
    const search = searchText.toLowerCase();
    for (let i = startIndex; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(search)) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Extract currency amount from text
   * Handles various formats: £1,000.00, 1000.00, etc.
   *
   * @param {string} text - Text containing amount
   * @returns {number} Parsed amount, or 0 if not found
   */
  extractAmount(text) {
    // Match various currency formats: £1,000.00, $1000.00, 1,000.00, etc.
    const match = text.match(/[\£\$]?\s*([0-9,]+\.?[0-9]*)/);
    if (match) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
    return 0;
  }

  /**
   * Extract number from text, handling various formats
   *
   * @param {string} text - Text containing number
   * @returns {number} Parsed number, or 0 if not found
   */
  extractNumber(text) {
    const match = text.match(/[\d,]+\.?[\d]*/);
    if (match) {
      return parseFloat(match[0].replace(/,/g, ''));
    }
    return 0;
  }

  /**
   * Extract date from text in various formats
   * Supports: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, etc.
   *
   * @param {string} text - Text containing date
   * @returns {string|null} ISO format date string (YYYY-MM-DD) or null
   */
  extractDate(text) {
    // Try DD/MM/YYYY format
    let match = text.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
    if (match) {
      const [_, day, month, year] = match;
      const date = new Date(year, month - 1, day);
      return date.toISOString().split('T')[0];
    }

    // Try YYYY-MM-DD format
    match = text.match(/(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
    if (match) {
      const [_, year, month, day] = match;
      const date = new Date(year, month - 1, day);
      return date.toISOString().split('T')[0];
    }

    return null;
  }

  /**
   * Clean supplier SKU (product code)
   * Removes extra whitespace, normalizes format
   *
   * @param {string} sku - Raw SKU from PDF
   * @returns {string} Cleaned SKU
   */
  cleanSku(sku) {
    return sku.trim().toUpperCase();
  }

  /**
   * Clean product name
   * Removes extra whitespace, normalizes capitalization
   *
   * @param {string} name - Raw product name from PDF
   * @returns {string} Cleaned name
   */
  cleanProductName(name) {
    return name
      .trim()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Build standardized result object
   * Ensures all parsers return consistent format
   *
   * @param {boolean} success - Was parsing successful
   * @param {Object} data - Parser-specific data
   * @returns {Object} StandardizedParseResult
   */
  buildResult(success, data = {}) {
    return {
      success,
      supplier: {
        id: this.supplierId,
        name: this.supplierName,
        confidence: data.confidence || 0,
      },
      parsedItems: data.items || [],
      metadata: {
        invoiceNumber: data.invoiceNumber || '',
        invoiceDate: data.invoiceDate || '',
        totalAmount: data.totalAmount || 0,
        subtotal: data.subtotal || 0,
        vatTotal: data.vatTotal || 0,
      },
      rawText: data.rawText || '',
      parserUsed: this.parserType,
      notes: data.notes || '',
    };
  }

  /**
   * Log debug information during parsing
   * Useful for troubleshooting supplier-specific format issues
   *
   * @param {string} message - Debug message
   * @param {*} data - Optional data to log
   */
  debug(message, data = null) {
    console.log(`[${this.parserType}] ${message}`, data || '');
  }

  /**
   * Log warning during parsing
   * Used when parser encounters unexpected but recoverable issues
   *
   * @param {string} message - Warning message
   */
  warn(message) {
    console.warn(`[${this.parserType}] WARNING: ${message}`);
  }

  /**
   * Log error during parsing
   * Used when parser encounters serious issues
   *
   * @param {string} message - Error message
   */
  error(message) {
    console.error(`[${this.parserType}] ERROR: ${message}`);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = SupplierParser;
