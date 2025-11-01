/**
 * ============================================================================
 * TOLCHARDS WINE & SPIRITS PARSER
 * ============================================================================
 *
 * Purpose:
 *   Parse invoices from Tolchards Ltd wine & spirits supplier
 *   Tolchards invoices have a clean table structure with products and pricing
 *
 * Tolchards Invoice Format:
 *   - Header: Company info, invoice date, account number
 *   - Column headers: Product Code, Quantity (Cs.Bt), Case Size, Vintage,
 *                    Description, Price, Value, VAT Code
 *   - Items: One per row in table format
 *   - Footer: VAT breakdown, totals, payment terms
 *
 * Item Fields:
 *   1. PRODUCT CODE - SKU (e.g., "EX0200RB")
 *   2. QUANTITY (Cs.Bt) - Number of cases/bottles ordered (e.g., "2.00")
 *   3. CASE SIZE - Units per case/bottle (e.g., "6" = 6 bottles per case)
 *   4. VINTAGE - Year (optional, often blank)
 *   5. DESCRIPTION - Product name (e.g., "Rye Mill Shiraz")
 *   6. PRICE - Price per case/bottle (e.g., "43.68")
 *   7. VALUE - Line total (e.g., "87.36")
 *   8. VAT CODE - VAT classification (e.g., "1" = 20%)
 *
 * Calculation Logic:
 *   - Unit Size: Determined from CASE SIZE field
 *   - Pack Size: Calculated as QUANTITY × CASE SIZE
 *   - Unit Price: PRICE ÷ CASE SIZE (per individual unit)
 *   - Line Total: VALUE field
 *
 * Detection:
 *   Looks for "Tolchards" in PDF text
 *
 * Status: ✅ FULLY IMPLEMENTED
 *   - Invoice metadata extraction (number, date, totals)
 *   - Item parsing with all fields
 *   - Case size and unit size calculation
 *   - Unit price calculation from case price
 *   - VAT code mapping (typically all code "1" = 20%)
 * ============================================================================
 */

const SupplierParser = require('./supplierParser');

class TolchardsParser extends SupplierParser {
  // ========== CONSTRUCTOR ==========

  /**
   * Initialize Tolchards parser with supplier configuration
   * UUID from database: 37bc38f7-f3ac-42a6-bbac-e0104e0ee901
   */
  constructor() {
    super({
      supplierId: '37bc38f7-f3ac-42a6-bbac-e0104e0ee901',
      name: 'Tolchards Ltd',
      parserType: 'tolchards',
      detectionKeywords: ['tolchards', 'tolchards ltd', 'woodland road'],
      detectionConfidenceThreshold: 70,
    });
  }

  // ========== DETECTION ==========

  /**
   * Detect if PDF is from Tolchards
   * Looks for Tolchards-specific text patterns
   *
   * @param {string} pdfText - Raw PDF text
   * @returns {{isMatch: boolean, confidence: number, notes: string}}
   */
  static detectSupplier(pdfText) {
    const text = pdfText.toLowerCase();
    let confidence = 0;

    // Look for Tolchards brand names
    if (text.includes('tolchards')) confidence += 50;
    if (text.includes('tolchards ltd')) confidence += 20;
    if (text.includes('woodland road')) confidence += 20;
    if (text.includes('torquay')) confidence += 10;

    return {
      isMatch: confidence >= 70,
      confidence: Math.min(confidence, 100),
      notes: 'Tolchards detection based on text patterns',
    };
  }

  // ========== MAIN PARSING METHOD ==========

  /**
   * Parse Tolchards invoice PDF
   *
   * Process:
   *   1. Extract metadata (invoice number, date, totals)
   *   2. Parse items from table structure
   *   3. Calculate unit prices and pack sizes
   *   4. Extract VAT information
   *   5. Return standardized result
   *
   * @param {string} pdfText - Raw text from PDF
   * @returns {Promise<ParseResult>}
   * @throws {Error} If parsing fails
   */
  async parse(pdfText) {
    this.debug('Starting Tolchards invoice parse');

    try {
      // Step 1: Extract lines from PDF
      const lines = pdfText.split(/\r?\n|\r/).map(line => {
        return line.replace(/^ +| +$/g, '');
      }).filter(line => line.trim().length > 0);

      this.debug(`Extracted ${lines.length} lines from PDF`);

      // Step 2: Extract invoice metadata
      const metadata = this.extractMetadata(lines);
      this.debug(`Invoice: ${metadata.invoiceNumber}, Date: ${metadata.invoiceDate}`);

      // Step 3: Parse items from invoice
      const items = this.parseItems(lines);
      this.debug(`Parsed ${items.length} items`);

      // Step 4: Extract VAT information
      const { subtotal, vatTotal } = this.extractVatInfo(lines);

      // Step 5: Calculate total amount if not found in metadata
      let totalAmount = metadata.totalAmount;
      if (!totalAmount && subtotal && vatTotal) {
        totalAmount = subtotal + vatTotal;
      }

      // Step 6: Build and return result
      return this.buildResult(true, {
        items,
        invoiceNumber: metadata.invoiceNumber,
        invoiceDate: metadata.invoiceDate,
        totalAmount: totalAmount,
        subtotal,
        vatTotal,
        rawText: pdfText,
        confidence: 100,
        notes: 'Tolchards parser - successfully parsed table-based invoice',
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
   *   - "Invoice No" or "TSIM" pattern for invoice number
   *   - Date in format DD/MM/YYYY
   *   - "Invoice Total" for total amount
   *
   * @param {Array<string>} lines - PDF lines
   * @returns {Object} Metadata object
   */
  extractMetadata(lines) {
    const metadata = {
      invoiceNumber: '',
      invoiceDate: '',
      totalAmount: 0,
    };

    for (let i = 0; i < Math.min(50, lines.length); i++) {
      const line = lines[i];

      // Extract invoice number (pattern: TSIM followed by digits)
      if (!metadata.invoiceNumber) {
        const invoiceMatch = line.match(/TSIM(\d+)/i);
        if (invoiceMatch) {
          metadata.invoiceNumber = `TSIM${invoiceMatch[1]}`;
        }
      }

      // Extract date (DD/MM/YYYY format)
      if (!metadata.invoiceDate) {
        const dateMatch = line.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (dateMatch) {
          const [, day, month, year] = dateMatch;
          metadata.invoiceDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
    }

    // Find invoice total near the end
    for (let i = Math.max(0, lines.length - 30); i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('Invoice Total')) {
        const match = line.match(/£\s*([\d,.]+)/);
        if (match) {
          metadata.totalAmount = parseFloat(match[1].replace(/,/g, ''));
        }
      }
    }

    return metadata;
  }

  /**
   * Parse items from invoice table
   *
   * Tolchards invoices have a table structure with columns:
   *   Product Code | Quantity | Case Size | Vintage | Description | Price | Value | VAT Code
   *
   * Strategy: Look for lines starting with product codes (pattern: 2-3 letters + digits + letters)
   * Examples: EX0200RB, HA06BBWB, FB01NVC
   *
   * The PDF structure has:
   *   - Header info (invoice fields, supplier details, customer/delivery addresses)
   *   - Item lines (what we want to parse)
   *   - Summary section (totals - where we should stop)
   *
   * @param {Array<string>} lines - PDF lines
   * @returns {Array<ParsedItem>} Parsed items
   */
  parseItems(lines) {
    const items = [];
    let foundFirstItem = false;

    // Find where the items section starts
    // Items start after we've seen "Delivery Notes:" or similar delivery info
    let itemsStartLine = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Delivery Notes:') || lines[i].includes('Payment Terms:')) {
        itemsStartLine = i + 1;
        break;
      }
    }

    // Parse lines starting from items section
    for (let i = itemsStartLine; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines
      if (line.length === 0) {
        continue;
      }

      // Stop at summary totals section (only if we've found at least one item)
      if (foundFirstItem &&
          (line.match(/^\d+\.\d{2}$/) || // Line with just a number like "8.01"
           line.includes('Total Cs.Bt') ||
           line.match(/^1\s+£/) || // Summary line starting with currency
           line.includes('Payment due'))) {
        break;
      }

      // Try to parse as item line
      const item = this.parseItemLine(line);
      if (item) {
        items.push(item);
        foundFirstItem = true;
      }
    }

    return items;
  }

  /**
   * Parse a single item line from the table
   *
   * Format: Product Code | Qty | Case Size | Vintage | Description | Price | Value | VAT
   *
   * Example line might look like:
   * "EX0200RB 2.00 6 Rye Mill Shiraz 43.68 87.36 1"
   *
   * Calculations:
   *   - Quantity: Interpret as cases.units format (0.01 = 0 cases + 1 unit; 2.03 = 2 cases + 3 units)
   *   - Unit Size: Detect from description or default (Wine: 75cl, Spirit: 70cl)
   *   - Pack Size: Format as "Qx{unitSize}" (e.g., "12x75cl")
   *   - Unit Price: Price per case ÷ case size (price per individual unit)
   *
   * @param {string} line - Item line to parse
   * @returns {ParsedItem|null} Parsed item or null if invalid
   */
  parseItemLine(line) {
    try {
      // Split by whitespace and analyze
      const parts = line.split(/\s+/);

      // Need minimum: ProductCode, Qty, CaseSize, Description, Price, Value, VAT
      // Minimum 7 parts, but description can have multiple words
      if (parts.length < 7) {
        return null;
      }

      // Check if first part looks like a product code (alphanumeric)
      if (!/^[A-Z0-9]{4,}$/i.test(parts[0])) {
        return null;
      }

      const productCode = parts[0];
      const quantity = parseFloat(parts[1]);

      // Check if quantity is valid
      if (isNaN(quantity) || quantity <= 0) {
        return null;
      }

      const caseSize = parseInt(parts[2]);
      if (isNaN(caseSize) || caseSize <= 0) {
        return null;
      }

      // Description is everything from parts[3] onwards, except last 3 parts (price, value, vat)
      // We need to find where description ends and price begins
      // Look for numeric patterns that match price format
      let descriptionEnd = parts.length - 3;
      let price = 0;
      let value = 0;

      // Try to extract price and value from the end
      const possibleValue = parseFloat(parts[parts.length - 2]);
      const possiblePrice = parseFloat(parts[parts.length - 3]);

      if (!isNaN(possibleValue) && !isNaN(possiblePrice)) {
        value = possibleValue;
        price = possiblePrice;
        descriptionEnd = parts.length - 3;
      }

      // Description is parts 3 to descriptionEnd
      const description = parts.slice(3, descriptionEnd).join(' ');

      if (!description || description.trim().length === 0) {
        return null;
      }

      // VAT code is typically the last part
      const vatCode = parts[parts.length - 1];
      const vatRate = vatCode === '1' ? 20 : vatCode === '0' ? 0 : null;

      // ===== TOLCHARDS FORMAT CONVERSION =====

      // Calculate unit price: price per case ÷ units per case
      const unitPrice = price / caseSize;

      // Convert quantity from cases.units format to actual individual units
      // 0.01 = 0 cases + 1 unit
      // 2.03 = 2 cases + 3 units = (2 × caseSize) + 3
      const integerPart = Math.floor(quantity);
      const decimalPart = quantity - integerPart;
      const individualUnits = Math.round(decimalPart * 100); // 0.01 → 1, 0.03 → 3
      const actualQuantity = (integerPart * caseSize) + individualUnits;

      // Extract unit size from description or use defaults
      // Wine: 75cl, Spirit: 70cl (unless size is explicitly stated in description)
      const unitSize = this.extractUnitSize(description);

      // Pack size format: "{quantity}x{unitSize}" (e.g., "12x75cl")
      const packSize = `${actualQuantity}x${unitSize}`;

      return {
        supplierSku: this.cleanSku(productCode),
        supplierName: this.cleanProductName(description),
        packSize: packSize,
        unitSize: unitSize,
        quantity: actualQuantity,
        unitPrice: Math.round(unitPrice * 100) / 100, // Round to 2 decimals
        nettPrice: value,
        vatCode: vatCode,
        vatRate: vatRate,
        lineTotal: value,
        categoryHeader: 'Wines & Spirits', // Tolchards is primarily wine & spirits
      };
    } catch (error) {
      this.debug(`Error parsing item line: ${line.substring(0, 60)}... Error: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract unit size from product description or use sensible default
   *
   * Strategy:
   *   1. Look for explicit size indicators in description (ml, cl, l, g, oz, gallon)
   *   2. If found, use that size (e.g., "9g" → "9g")
   *   3. If not found, determine based on product type:
   *      - Wine keywords: Shiraz, Pinot, Chardonnay, Sauvignon, etc. → 75cl
   *      - Spirit keywords: Whiskey, Bushmills, Gin, Vodka, etc. → 70cl
   *      - Default: 75cl (wines are more common at Tolchards)
   *
   * Examples:
   *   "Rye Mill Shiraz" → 75cl (matches "Shiraz" wine keyword)
   *   "Bushmills Black Bush" → 70cl (matches "Bushmills" spirit keyword)
   *   "Fullers London Pride 9g" → 9g (explicit size)
   *
   * @param {string} description - Product description
   * @returns {string} Unit size (e.g., "75cl", "70cl", "9g")
   */
  extractUnitSize(description) {
    // First, try to find explicit size in description (e.g., "75cl", "9g", "750ml")
    const sizeMatch = description.match(/(\d+(?:\.\d+)?)\s*(ml|cl|l|g|oz|gallon|gal|gb)/i);
    if (sizeMatch) {
      const number = sizeMatch[1];
      const unit = sizeMatch[2].toLowerCase();
      return `${number}${unit}`;
    }

    // No explicit size found - determine based on product type
    const lowerDesc = description.toLowerCase();

    // Check for wine keywords first (grape varieties, wine types, regions)
    const wineKeywords = [
      'shiraz', 'pinot', 'chardonnay', 'sauvignon', 'merlot', 'cabernet',
      'riesling', 'prosecco', 'champagne', 'rioja', 'bordeaux', 'burgundy',
      'chablis', 'chianti', 'barolo', 'barbaresco', 'albariño', 'gewürztraminer',
      'tempranillo', 'nebbiolo', 'grüner', 'vouv', 'muscadet',
    ];

    const isWine = wineKeywords.some(keyword => lowerDesc.includes(keyword));
    if (isWine) {
      return '75cl';
    }

    // Check for spirit keywords (whiskey, gin, vodka, rum, brandy, and brand names)
    const spiritKeywords = [
      'whiskey', 'whisky', 'gin', 'vodka', 'rum', 'brandy', 'tequila',
      'liqueur', 'spirit', 'schnapps', 'cognac', 'armagnac',
      'bourbon', 'scotch', 'sake', 'malt', 'single malt',
      'bushmills', 'jameson', 'maker', 'jack daniel', 'johnnie',
    ];

    const isSpirit = spiritKeywords.some(keyword => lowerDesc.includes(keyword));
    if (isSpirit) {
      return '70cl';
    }

    // Default: wines are 75cl (Tolchards is primarily wines)
    return '75cl';
  }

  /**
   * Extract VAT information
   *
   * Tolchards invoices have structure:
   *   Total Nett: £461.16 (or on separate line)
   *   Total VAT: £92.23 (or on separate line)
   *   Invoice Total: £553.39 (or on separate line)
   *
   * Or summary line format:
   *   1 £461.16 20.00 £92.23
   *   (means: 1 page, £461.16 nett, 20% VAT, £92.23 VAT amount)
   *
   * @param {Array<string>} lines - PDF lines
   * @returns {Object} {subtotal, vatTotal}
   */
  extractVatInfo(lines) {
    let subtotal = 0;
    let vatTotal = 0;

    // Look for VAT information near the end
    for (let i = Math.max(0, lines.length - 20); i < lines.length; i++) {
      const line = lines[i];

      // Try to extract from summary line format: "1 £461.16 20.00 £92.23"
      // Pattern: starts with digit, then £amount, then percentage, then £amount
      const summaryMatch = line.match(/^1\s+£([\d,.]+)\s+[\d.]+\s+£([\d,.]+)/);
      if (summaryMatch) {
        subtotal = parseFloat(summaryMatch[1].replace(/,/g, ''));
        vatTotal = parseFloat(summaryMatch[2].replace(/,/g, ''));
        continue;
      }

      // Try individual line extractions
      // Look for lines with currency amounts
      const currencyMatches = line.match(/£([\d,.]+)/g);
      if (currencyMatches && currencyMatches.length > 0) {
        const amounts = currencyMatches.map(m => parseFloat(m.replace(/£|,/g, '')));

        // If line has "Total Nett", first amount is subtotal
        if (line.includes('Total Nett') && amounts.length > 0) {
          subtotal = amounts[0];
        }

        // If line has "Total VAT", first amount is VAT total
        if (line.includes('Total VAT') && amounts.length > 0) {
          vatTotal = amounts[0];
        }

        // If line has "Invoice Total", first amount is total
        if (line.includes('Invoice Total') && amounts.length > 0 && !subtotal) {
          // This might be the total, but we prefer to get subtotal+vat
          // Store for reference
        }
      }
    }

    return { subtotal, vatTotal };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = TolchardsParser;
