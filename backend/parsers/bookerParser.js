/**
 * ============================================================================
 * BOOKER WHOLESALE PARSER
 * ============================================================================
 *
 * Purpose:
 *   Parse invoices from Booker Wholesale supplier
 *   Booker invoices have a category-based structure with:
 *     - Category headers (e.g., "SPIRITS", "BEER & CIDER")
 *     - Items grouped under each category
 *     - Category subtotals
 *
 * Booker Invoice Format (Examples - to be confirmed with actual PDF):
 *   - Invoice number, date at top
 *   - Lines organized by category
 *   - Each category may have subtotal
 *   - Category display includes item count and monetary value
 *
 * Status:
 *   ⏳ STUB - Waiting for sample Booker invoice to implement parsing logic
 *   Once sample provided, will implement:
 *     - PDF line extraction
 *     - Category header detection
 *     - Item parsing within categories
 *     - Pack size and unit size extraction
 *
 * Detection:
 *   Looks for "Booker" or "Booker Wholesale" in PDF text
 *
 * Next Steps:
 *   1. User provides sample Booker invoice PDF
 *   2. We examine the format and exact layout
 *   3. Implement parse() method with category support
 *   4. Test with multiple Booker invoices to ensure robustness
 * ============================================================================
 */

const SupplierParser = require('./supplierParser');

class BookerParser extends SupplierParser {
  // ========== CONSTRUCTOR ==========

  /**
   * Initialize Booker parser with supplier configuration
   * UUID from database: 74f1b14b-6020-4575-a23c-2ff7a4a6f7d2
   */
  constructor() {
    super({
      supplierId: '74f1b14b-6020-4575-a23c-2ff7a4a6f7d2',
      name: 'Booker Limited',
      parserType: 'booker',
      detectionKeywords: ['booker', 'booker wholesale', 'booker limited'],
      detectionConfidenceThreshold: 70,
    });
  }

  // ========== DETECTION ==========

  /**
   * Detect if PDF is from Booker
   * Looks for Booker-specific text patterns
   *
   * @param {string} pdfText - Raw PDF text
   * @returns {{isMatch: boolean, confidence: number, notes: string}}
   */
  static detectSupplier(pdfText) {
    const text = pdfText.toLowerCase();
    let confidence = 0;

    // Look for "Booker" brand names
    if (text.includes('booker')) confidence += 40;
    if (text.includes('booker wholesale')) confidence += 30;
    if (text.includes('booker limited')) confidence += 30;

    // Look for typical Booker format elements
    // TODO: Add more specific pattern matching once we see actual invoices

    return {
      isMatch: confidence >= 70,
      confidence: Math.min(confidence, 100),
      notes: 'Booker detection based on text patterns',
    };
  }

  // ========== MAIN PARSING METHOD ==========

  /**
   * Parse Booker invoice PDF
   *
   * Current Status: STUB
   *   - File structure defined
   *   - Helper methods available in base class
   *   - Ready to implement once sample invoice reviewed
   *
   * @param {string} pdfText - Raw text from PDF
   * @returns {Promise<ParseResult>}
   * @throws {Error} If parsing fails
   */
  async parse(pdfText) {
    this.debug('Starting Booker invoice parse');

    try {
      // Step 1: Extract lines from PDF
      const lines = this.extractLines(pdfText);
      this.debug(`Extracted ${lines.length} lines from PDF`);

      // Step 2: Extract invoice metadata (invoice number, date, totals)
      // TODO: Implement metadata extraction
      const metadata = {
        invoiceNumber: '',
        invoiceDate: '',
        totalAmount: 0,
        subtotal: 0,
        vatTotal: 0,
      };

      // Step 3: Parse items organized by category
      // Booker groups items under category headers
      // TODO: Implement category detection and item parsing
      const items = [];

      // Step 4: Build and return result
      return this.buildResult(true, {
        items,
        invoiceNumber: metadata.invoiceNumber,
        invoiceDate: metadata.invoiceDate,
        totalAmount: metadata.totalAmount,
        subtotal: metadata.subtotal,
        vatTotal: metadata.vatTotal,
        rawText: pdfText,
        confidence: 100,
        notes: 'Booker parser - implementation pending sample invoice review',
      });
    } catch (error) {
      this.error(`Parse failed: ${error.message}`);
      return this.buildResult(false, {
        rawText: pdfText,
        notes: `Parse error: ${error.message}`,
      });
    }
  }

  // ========== HELPER METHODS ==========

  /**
   * STUB: Extract invoice metadata
   * Will extract: invoice number, date, totals
   *
   * @param {Array<string>} lines - PDF lines
   * @returns {Object} Metadata object
   */
  extractMetadata(lines) {
    // TODO: Implement once we see invoice format
    return {
      invoiceNumber: '',
      invoiceDate: '',
      totalAmount: 0,
      subtotal: 0,
      vatTotal: 0,
    };
  }

  /**
   * STUB: Parse items with category grouping
   * Booker invoices organize items by category (SPIRITS, BEER, etc.)
   *
   * @param {Array<string>} lines - PDF lines
   * @returns {Array<ParsedItem>} Array of parsed items with category info
   */
  parseItems(lines) {
    // TODO: Implement category detection
    //   - Find category headers
    //   - Group items under each category
    //   - Extract pack size and unit size
    //   - Return items with categoryHeader field populated

    return [];
  }

  /**
   * STUB: Extract pack size from item line
   * Example: "24 x 500ml" -> "24x500ml"
   *
   * @param {string} itemLine - Item text from PDF
   * @returns {string} Pack size string or empty
   */
  extractPackSize(itemLine) {
    // TODO: Implement pack size extraction
    // Look for patterns like: "24x500ml", "12x750ml", "1L", etc.
    return '';
  }

  /**
   * STUB: Extract unit size from item line
   * Example: "500ml" or "750ml"
   *
   * @param {string} itemLine - Item text from PDF
   * @returns {string} Unit size string or empty
   */
  extractUnitSize(itemLine) {
    // TODO: Implement unit size extraction
    // Look for patterns like: "ml", "L", "cl", etc.
    return '';
  }

  /**
   * STUB: Detect category header line
   * Booker invoices have category headers like "SPIRITS & LIQUEURS"
   *
   * @param {string} line - Line to check
   * @returns {boolean} True if this is a category header
   */
  isCategoryHeader(line) {
    // TODO: Implement category detection
    // Look for all-caps headers, specific keywords, etc.
    return false;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = BookerParser;
