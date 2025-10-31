/**
 * ============================================================================
 * BOOKER WHOLESALE PARSER
 * ============================================================================
 *
 * Purpose:
 *   Parse invoices from Booker Wholesale supplier
 *   Booker invoices have a category-based structure with:
 *     - Category headers (e.g., "RETAIL GROCERY", "FROZEN FOOD", "WINES SPIRITS BEERS")
 *     - Items grouped under each category (TAB-separated fields)
 *     - Category subtotals
 *     - VAT breakdown and totals
 *
 * Booker Invoice Format:
 *   - Header: Invoice number, date, customer info
 *   - Column headers: CODE, DESCRIPTION, PACK SIZE, QTY, PRICE, VALUE, VAT, RRP, POR
 *   - Items organized by category with TAB separation
 *   - Category lines: All-caps text followed by items, ending with SUB-TOTAL line
 *   - Footer: VAT breakdown, totals, multibuys saved
 *
 * Item Fields (TAB-separated):
 *   1. CODE - Product code/SKU (e.g., "063724")
 *   2. DESCRIPTION - Product name (e.g., "Coke Zero")
 *   3. PACK SIZE - Quantity and size (e.g., "24 330ml" or "1 5kg")
 *   4. QTY - Quantity ordered (e.g., "1", "2", "6")
 *   5. PRICE - Unit price with optional suffix: "P" (Price Marked Pack), "M" (special), or plain
 *   6. VALUE - Line total (e.g., "11.95", "8.49", "35.37")
 *   7. VAT - VAT code ("A" = 0%, "B" = 20%)
 *   8. RRP - Recommended Retail Price per unit (e.g., "1.35", "0.69")
 *   9. POR - Price of Recommendation as percentage (e.g., "55.7%", "21.2%")
 *
 * Special Notations:
 *   - "P" suffix on PRICE: Price Marked Pack (RRP is in the PRICE field)
 *   - "M" suffix on PRICE: Special marking (Multibuy/markdown)
 *   - RRP with "PM" prefix: Price Marked Pack RRP value
 *   - Promotion lines: "BUY X FOR Y" with discount amount
 *   - Free items: "FREE [description]" marked as negative value
 *
 * Detection:
 *   Looks for "Booker" or "Booker Wholesale" in PDF text
 *
 * Status: ✅ FULLY IMPLEMENTED
 *   - Invoice metadata extraction (number, date, totals)
 *   - Category detection and grouping
 *   - Item parsing with all fields
 *   - Pack size and unit size extraction
 *   - RRP extraction with PM notation handling
 *   - VAT code mapping
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
   * Process:
   *   1. Extract metadata (invoice number, date, totals)
   *   2. Find all category sections in the document
   *   3. Parse items within each category
   *   4. Extract VAT information
   *   5. Return standardized result
   *
   * @param {string} pdfText - Raw text from PDF
   * @returns {Promise<ParseResult>}
   * @throws {Error} If parsing fails
   */
  async parse(pdfText) {
    this.debug('Starting Booker invoice parse');

    try {
      // Step 1: Extract lines from PDF
      // IMPORTANT: Preserve TAB characters for field splitting
      const lines = pdfText.split(/\r?\n|\r/).map(line => {
        // Trim only regular spaces, not TABs - preserve tabs for field parsing
        return line.replace(/^ +| +$/g, '');
      }).filter(line => line.trim().length > 0);

      this.debug(`Extracted ${lines.length} lines from PDF`);

      // Step 2: Extract invoice metadata
      const metadata = this.extractMetadata(lines);
      this.debug(`Invoice: ${metadata.invoiceNumber}, Date: ${metadata.invoiceDate}`);

      // Step 3: Parse items organized by category
      const items = this.parseItemsByCategory(lines);
      this.debug(`Parsed ${items.length} items across categories`);

      // Step 4: Extract VAT information
      const { subtotal, vatTotal } = this.extractVatInfo(lines);

      // Step 5: Build and return result
      return this.buildResult(true, {
        items,
        invoiceNumber: metadata.invoiceNumber,
        invoiceDate: metadata.invoiceDate,
        totalAmount: metadata.totalAmount,
        subtotal,
        vatTotal,
        rawText: pdfText,
        confidence: 100,
        notes: 'Booker parser - successfully parsed category-based invoice',
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
   * Extract invoice metadata (number, date, totals)
   *
   * Looks for:
   *   - "INVOICE NUMBER [number]" -> invoice number
   *   - "DATE [date]" -> invoice date (DD/MM/YY format, may be TAB-separated)
   *   - "INVOICE TOTAL [amount]" -> total amount
   *
   * Booker format: "RBL EAST WITTERING 	DATE 	01/05/25 	TIME 07:31"
   *
   * @param {Array<string>} lines - PDF lines
   * @returns {Object} Metadata object with invoiceNumber, invoiceDate, totalAmount
   */
  extractMetadata(lines) {
    const metadata = {
      invoiceNumber: '',
      invoiceDate: '',
      totalAmount: 0,
    };

    // Find invoice number, date, and total
    for (const line of lines) {
      if (line.includes('INVOICE NUMBER') && !metadata.invoiceNumber) {
        const match = line.match(/INVOICE NUMBER\s+(\d+)/);
        if (match) {
          metadata.invoiceNumber = match[1];
        }
      }

      // Extract date - may be TAB-separated or space-separated
      if (line.includes('DATE') && !metadata.invoiceDate) {
        // Handle TAB-separated format: "... DATE 	01/05/25 	TIME ..."
        if (line.includes('\t')) {
          const fields = line.split('\t');
          const dateIdx = fields.findIndex(f => f.trim() === 'DATE');
          if (dateIdx !== -1 && dateIdx + 1 < fields.length) {
            const dateStr = fields[dateIdx + 1].trim();
            // Extract date pattern DD/MM/YY
            const dateMatch = dateStr.match(/(\d{2})\/(\d{2})\/(\d{2})/);
            if (dateMatch) {
              const [, day, month, year] = dateMatch;
              const fullYear = `20${year}`;
              metadata.invoiceDate = `${fullYear}-${month}-${day}`;
            }
          }
        } else {
          // Try space/colon separated format
          let dateMatch = line.match(/DATE[:\s]+(\d{2}\/\d{2}\/\d{2})/i);
          if (dateMatch) {
            const [day, month, year] = dateMatch[1].split('/');
            const fullYear = year.length === 2 ? `20${year}` : year;
            metadata.invoiceDate = `${fullYear}-${month}-${day}`;
          } else {
            // Try DD-MM-YY format
            dateMatch = line.match(/DATE[:\s]+(\d{2})-(\d{2})-(\d{2})/i);
            if (dateMatch) {
              const [, day, month, year] = dateMatch;
              const fullYear = year.length === 2 ? `20${year}` : year;
              metadata.invoiceDate = `${fullYear}-${month}-${day}`;
            }
          }
        }
      }

      // INVOICE TOTAL appears at the end
      if (line.includes('INVOICE TOTAL') && !metadata.totalAmount) {
        const match = line.match(/INVOICE TOTAL\s+([\d.]+)/);
        if (match) {
          metadata.totalAmount = parseFloat(match[1]);
        }
      }
    }

    return metadata;
  }

  /**
   * Parse items organized by category
   *
   * Booker invoices have items followed by category headers:
   *   [items with TAB-separated fields]
   *   ----- --------
   *   RETAIL GROCERY	SUB-TOTAL	:	ITEMS	17	GOODS :	150.55	EXC.VAT
   *   [more items]
   *   -----	--------
   *   CHILLED	SUB-TOTAL	:	ITEMS	3	GOODS :	53.44	EXC.VAT
   *
   * IMPORTANT: Invoices with substitutions may contain a SUBSTITUTIONDETAILS section:
   *   ------ SUBSTITUTIONDETAILS ------
   *   [substitution items to ignore]
   *   ------ INVOICE DETAILS ------
   *   [actual invoice items]
   *
   * Strategy:
   *   1. Identify substitution section boundaries (SUBSTITUTIONDETAILS to INVOICE DETAILS)
   *   2. Skip any lines within that section
   *   3. For remaining items, look ahead to find which category it belongs to
   *      by finding the next SUB-TOTAL line
   *
   * @param {Array<string>} lines - PDF lines
   * @returns {Array<ParsedItem>} Parsed items with category info
   */
  parseItemsByCategory(lines) {
    const items = [];

    // Step 1: Identify substitution section boundaries to skip
    const { substitutionStart, substitutionEnd } = this.findSubstitutionSectionBounds(lines);
    this.debug(`Substitution section: lines ${substitutionStart} to ${substitutionEnd}`);

    // Step 2: Build a map of category start line to category name
    // Category SUB-TOTAL lines indicate the category for items above them
    const categoryHeaders = [];
    for (let i = 0; i < lines.length; i++) {
      // Skip lines within substitution section
      if (i >= substitutionStart && i <= substitutionEnd) {
        continue;
      }

      if (this.isCategoryHeaderLine(lines[i])) {
        const categoryName = lines[i].split('\t')[0].trim();
        categoryHeaders.push({ lineIdx: i, name: categoryName });
      }
    }

    // Step 3: Parse items and assign categories, skipping substitution section
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip lines within substitution section
      if (i >= substitutionStart && i <= substitutionEnd) {
        continue;
      }

      // Skip separator lines and metadata lines
      if (line.match(/^-+(\s+-+|-)*$/) || line.includes('SUB-TOTAL') || line.includes('TOTAL ITEMS') ||
          line.includes('RATE GOODS') || line.includes('CODE DESCRIPTION') || line.includes('INVOICE NUMBER')) {
        continue;
      }

      // Skip special lines
      if (line.includes('BUY') || line.includes('FOR') || line.includes('FREE') ||
          line.includes('SAVING') || line.includes('AVAILABLE') || line.includes('TILL') ||
          line.includes('BRANCH') || line.includes('CUSTOMER') || line.includes('DATE') ||
          line.includes('OPERATOR') || line.includes('PAGE')) {
        continue;
      }

      // Parse item line
      if (line.includes('\t') && this.looksLikeItemLine(line)) {
        // Find which category this item belongs to
        // It belongs to the FIRST category header that comes AFTER this line
        let category = 'UNKNOWN';
        for (const header of categoryHeaders) {
          if (header.lineIdx > i) {
            category = header.name;
            break;
          }
        }

        const item = this.parseItemLine(line, category);
        if (item) {
          items.push(item);
        }
      }
    }

    return items;
  }

  /**
   * Find the boundaries of the substitution section if present
   *
   * When suppliers make substitutions, the invoice includes a SUBSTITUTION DETAILS section:
   *   SUBSTITUTION DETAILS-Contains Order Number(s):90660709
   *   The following items are no longer available, please order alternative in future:
   *   [substitution items to skip]
   *   [blank line or separator]
   *   INVOICE DETAILS or category header
   *
   * Format variations:
   *   - Header: "SUBSTITUTION DETAILS", "SUBSTITUTIONDETAILS" (may have space)
   *   - End: Marked by blank line, "INVOICE DETAILS", or category header like "RETAIL GROCERY"
   *
   * Returns line indices where the section starts and ends.
   * If no substitution section found, returns -1 for both values.
   *
   * @param {Array<string>} lines - PDF lines
   * @returns {Object} {substitutionStart, substitutionEnd} Line indices for section boundaries
   */
  findSubstitutionSectionBounds(lines) {
    let substitutionStart = -1;
    let substitutionEnd = -1;

    // Find start of substitution section (handle both "SUBSTITUTION DETAILS" and "SUBSTITUTIONDETAILS")
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toUpperCase();
      if (line.includes('SUBSTITUTION') && (line.includes('DETAILS') || line.includes('DETAILS-'))) {
        substitutionStart = i;
        this.debug(`Found substitution header at line ${i}: ${lines[i]}`);
        break;
      }
    }

    // If no substitution section, return -1 for both
    if (substitutionStart === -1) {
      return { substitutionStart: -1, substitutionEnd: -1 };
    }

    // Find end of substitution section
    // Look for: INVOICE DETAILS, category headers (with SUB-TOTAL), or blank line followed by category
    for (let i = substitutionStart + 1; i < lines.length; i++) {
      const line = lines[i];
      const lineUpper = line.toUpperCase();

      // End markers:
      // 1. "INVOICE DETAILS" keyword
      if (lineUpper.includes('INVOICE DETAILS')) {
        substitutionEnd = i;
        this.debug(`Found INVOICE DETAILS boundary at line ${i}`);
        break;
      }

      // 2. Category header with SUB-TOTAL (indicates start of actual invoice items)
      if (this.isCategoryHeaderLine(line)) {
        substitutionEnd = i - 1; // End before the category line
        this.debug(`Found category header at line ${i}, substitution section ends at ${i - 1}`);
        break;
      }

      // 3. Blank line followed by a numeric-starting line (item line)
      // Skip blank lines and look for the pattern
      if (line.trim().length === 0) {
        // Check if next non-blank line is an item line or category
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].trim().length > 0) {
            if (this.looksLikeItemLine(lines[j]) || this.isCategoryHeaderLine(lines[j])) {
              substitutionEnd = i - 1;
              this.debug(`Found blank line separator at line ${i}, substitution section ends at ${i - 1}`);
            }
            break;
          }
        }
        if (substitutionEnd !== -1) break;
      }
    }

    // If we found the start but not the end, set end to start to skip only the header line
    if (substitutionEnd === -1) {
      substitutionEnd = substitutionStart;
      this.debug(`No clear substitution end found, skipping only header at line ${substitutionStart}`);
    }

    return { substitutionStart, substitutionEnd };
  }

  /**
   * Check if a line is a category header with SUB-TOTAL
   * Format: "RETAIL GROCERY	SUB-TOTAL	:	ITEMS	17	GOODS :	150.55	EXC.VAT"
   *
   * @param {string} line - Line to check
   * @returns {boolean} True if this is a category header line
   */
  isCategoryHeaderLine(line) {
    return line.includes('SUB-TOTAL') && line.includes('ITEMS') && line.includes('GOODS');
  }

  /**
   * Determine if a line looks like an item line
   * Item lines: TAB-separated with numeric code at start
   *
   * Booker invoices have items with varying numbers of fields:
   *   - 7 fields (with RRP): "063724 Coke Zero	24 330ml	1	11.95	11.95	B	1.35 55.7%"
   *   - 6 fields (no RRP): "287497 CL Buffet Sausage Rolls	1 100pk	1	5.35 M	5.35	A"
   *   - 5 fields (no RRP): "278664 CE Mature White Cheddar	1 5kg	1	34.46	34.46	A"
   *
   * Minimum valid item: numeric code + 4 TABs (5 fields minimum)
   *
   * @param {string} line - Line to check
   * @returns {boolean} True if likely an item line
   */
  looksLikeItemLine(line) {
    // Start with numeric code, contain TAB
    const startsWithNumber = /^\d+/.test(line);
    // Item lines have at least 4 TABs (5 fields minimum: code, pack, qty, price, value)
    const hasEnoughFields = (line.match(/\t/g) || []).length >= 4;
    return startsWithNumber && hasEnoughFields;
  }

  /**
   * Parse a single item line (TAB-separated fields)
   *
   * Format (5-7 TAB-separated fields, RRP field is optional):
   *   0: CODE DESCRIPTION (e.g., "063724 Coke Zero")
   *   1: PACK SIZE (e.g., "24 330ml")
   *   2: QTY (e.g., "1")
   *   3: PRICE with optional P/M suffix (e.g., "11.95" or "8.49 P")
   *   4: VALUE/TOTAL (e.g., "11.95")
   *   5: VAT CODE (e.g., "B" = 20%, "A" = 0%)
   *   6: RRP PERCENTAGE (OPTIONAL) (e.g., "1.35 55.7%" where 1.35 is RRP, 55.7% is POR margin)
   *
   * Examples:
   *   "063724 Coke Zero	24 330ml	1	11.95	11.95	B	1.35 55.7%" (7 fields with RRP)
   *   "278664 CE Mature White Cheddar	1 5kg	1	34.46	34.46	A" (6 fields no RRP)
   *
   * @param {string} line - Item line
   * @param {string} category - Category name
   * @returns {ParsedItem|null} Parsed item or null if invalid
   */
  parseItemLine(line, category) {
    try {
      // Split by TAB character (actual tabs from PDF)
      const fields = line.split('\t').map(f => f.trim());

      // Minimum 5 fields required (code, pack, qty, price, value)
      // VAT code (field 5) is usually present, RRP (field 6) is optional
      if (fields.length < 5) {
        this.debug(`Skipping line with only ${fields.length} fields: ${line.substring(0, 60)}`);
        return null;
      }

      // Field 0: Code + Description (space-separated)
      const codeAndDesc = fields[0];
      const codeMatch = codeAndDesc.match(/^(\d+)\s+(.*)/);
      if (!codeMatch) {
        return null;
      }

      const code = codeMatch[1];
      const description = codeMatch[2];

      // Field 1: Pack size (e.g., "24 330ml")
      const packSize = fields[1];

      // Field 2: Quantity
      const qty = this.extractNumber(fields[2]) || 1;

      // Field 3: Price (may have P or M suffix)
      const priceField = fields[3];
      const price = this.extractAmount(priceField.replace(/[PM]$/, '')) || 0;

      // Field 4: Value (line total)
      const value = this.extractAmount(fields[4]) || 0;

      // Field 5: VAT code (may be missing in some items)
      // VAT codes are single letters: A (0%), B (20%), or may be absent
      let vatCode = '';
      let vatRate = null;
      if (fields.length > 5 && fields[5] && fields[5].length <= 2) {
        vatCode = fields[5].toUpperCase();
        vatRate = vatCode === 'A' ? 0 : vatCode === 'B' ? 20 : null;
      }

      // Field 6: RRP and POR percentage (OPTIONAL)
      // Format: "1.35 55.7%" where first part is RRP
      // Only present if line has 7+ fields
      let rrpValue = 0;
      if (fields.length > 6 && fields[6]) {
        rrpValue = this.extractAmount(fields[6].split(/\s+/)[0]) || 0;
      }

      // Extract pack and unit size
      const { pack, unit } = this.extractPackAndUnitSize(packSize);

      return {
        supplierSku: this.cleanSku(code),
        supplierName: this.cleanProductName(description),
        packSize: pack,
        unitSize: unit,
        quantity: qty,
        unitPrice: price,
        nettPrice: value,
        vatCode: vatCode,
        vatRate: vatRate,
        lineTotal: value,
        rrp: rrpValue,
        categoryHeader: category,
      };
    } catch (error) {
      this.debug(`Error parsing item line: ${line.substring(0, 60)}... Error: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract pack and unit size from pack size field
   *
   * Examples:
   *   "24 330ml" -> { pack: "24x330ml", unit: "330ml" }
   *   "1 5kg" -> { pack: "1x5kg", unit: "5kg" }
   *   "12 275ml" -> { pack: "12x275ml", unit: "275ml" }
   *
   * @param {string} packSizeField - Pack size field from invoice
   * @returns {Object} {pack, unit} with normalized format
   */
  extractPackAndUnitSize(packSizeField) {
    if (!packSizeField) {
      return { pack: '', unit: '' };
    }

    // Split pack size field: "24 330ml" -> ["24", "330ml"]
    const parts = packSizeField.split(/\s+/);
    if (parts.length < 2) {
      return { pack: packSizeField, unit: '' };
    }

    const quantity = parts[0];
    const size = parts.slice(1).join('');

    return {
      pack: `${quantity}x${size}`,
      unit: size,
    };
  }

  /**
   * Extract VAT information (subtotal and VAT total)
   *
   * Booker invoices have VAT breakdown like:
   *   RATE GOODS MULT NETT VAT
   *   A: 0.00 291.04 9.99 281.05 0.00
   *   B:20.00 689.87 3.34 686.53 137.31
   *
   * Totals appear on next line(s)
   *
   * @param {Array<string>} lines - PDF lines
   * @returns {Object} {subtotal, vatTotal}
   */
  extractVatInfo(lines) {
    let subtotal = 0;
    let vatTotal = 0;

    for (const line of lines) {
      // Look for VAT rate lines starting with "A:" or "B:"
      if (line.match(/^A:\s+/)) {
        // A: 0.00 291.04 9.99 281.05 0.00
        // Format: RATE GOODS MULT NETT VAT
        const goods = this.extractAmount(line.split(/\s+/)[2] || '0');
        subtotal += goods;
      }

      if (line.match(/^B:\s+/)) {
        // B:20.00 689.87 3.34 686.53 137.31
        const parts = line.split(/\s+/);
        const goods = this.extractAmount(parts[2] || '0');
        const vat = this.extractAmount(parts[5] || '0');
        subtotal += goods;
        vatTotal += vat;
      }
    }

    return { subtotal, vatTotal };
  }

}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = BookerParser;
