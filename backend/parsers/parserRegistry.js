/**
 * ============================================================================
 * PARSER REGISTRY & FACTORY
 * ============================================================================
 *
 * Purpose:
 *   Central registry for all supplier-specific PDF parsers
 *   - Maintains list of available parsers
 *   - Instantiates parsers on demand
 *   - Routes PDF parsing to correct supplier parser
 *   - Handles supplier detection across all parsers
 *
 * Architecture:
 *   - Singleton pattern (single instance)
 *   - Lazy loading of parsers (only load when needed)
 *   - Easy to add new suppliers: just register new parser class
 *   - Clean separation of concerns
 *
 * How to Add a New Supplier:
 *   1. Create new parser file: backend/parsers/supplierNameParser.js
 *   2. Extend SupplierParser base class
 *   3. Implement parse() and detectSupplier() methods
 *   4. Register in this file:
 *      registry.register('supplier-name', SupplierNameParser);
 *   5. Add supplier to database with UUID
 *   6. Update parser class constructor with correct supplierId
 *
 * Usage:
 *   const registry = require('./parserRegistry');
 *   const parser = registry.getParser('booker');
 *   const result = await parser.parse(pdfText);
 * ============================================================================
 */

const BookerParser = require('./bookerParser');
const TolchardsParser = require('./tolchardsParser');
const MainSupplierMatcher = require('./mainSupplierMatcher');
// TODO: Import additional parsers as they're created
// const SupplierNameParser = require('./supplierNameParser');

/**
 * Parser Registry & Factory
 * Manages all available supplier parsers with two-layer detection:
 *   Layer 1: MainSupplierMatcher - Fast keyword scanning (all suppliers)
 *   Layer 2: Parser Detection - Detailed checks (top 3-5 candidates only)
 */
class ParserRegistry {
  // ========== CONSTRUCTOR & SINGLETON ==========

  /**
   * Initialize registry with available parsers
   */
  constructor() {
    // Map of parser name -> parser class
    this.parsers = new Map();

    // Initialize with built-in parsers
    this.register('booker', BookerParser);
    this.register('tolchards', TolchardsParser);
    // TODO: Register additional suppliers as parsers are created
  }

  // ========== PARSER REGISTRATION ==========

  /**
   * Register a new parser in the registry
   * Called during initialization and when adding new suppliers
   *
   * @param {string} supplierKey - Unique key for supplier (lowercase, no spaces)
   * @param {Class} parserClass - Parser class (must extend SupplierParser)
   * @throws {Error} If parser class is invalid
   */
  register(supplierKey, parserClass) {
    if (!parserClass || typeof parserClass !== 'function') {
      throw new Error(`Invalid parser class for "${supplierKey}"`);
    }

    this.parsers.set(supplierKey.toLowerCase(), parserClass);
    console.log(`✓ Registered parser: ${supplierKey}`);
  }

  // ========== PARSER RETRIEVAL ==========

  /**
   * Get parser instance for a specific supplier
   *
   * @param {string} supplierKey - Unique supplier key (e.g., 'booker')
   * @returns {SupplierParser} Instantiated parser, or null if not found
   */
  getParser(supplierKey) {
    const key = supplierKey.toLowerCase();
    const ParserClass = this.parsers.get(key);

    if (!ParserClass) {
      console.warn(`Parser not found for supplier: ${supplierKey}`);
      return null;
    }

    // Instantiate and return new parser
    return new ParserClass();
  }

  /**
   * Get all registered parser keys
   * Useful for debugging and logging
   *
   * @returns {Array<string>} Array of registered supplier keys
   */
  getRegisteredSuppliers() {
    return Array.from(this.parsers.keys());
  }

  // ========== SUPPLIER DETECTION ==========

  /**
   * Detect which supplier a PDF belongs to
   * Runs detection on all registered parsers and returns best match
   *
   * Algorithm:
   *   1. Run detectSupplier() on all parsers
   *   2. Sort by confidence score (highest first)
   *   3. Return top match if confidence >= threshold
   *   4. Return null if no parser exceeds threshold
   *
   * @param {string} pdfText - Raw PDF text to analyze
   * @param {number} minimumConfidence - Min confidence threshold (default: 60)
   * @returns {{
   *   supplierKey: string,
   *   parser: SupplierParser,
   *   confidence: number,
   *   parserResults: Array
   * } | null}
   */
  detectSupplier(pdfText, minimumConfidence = 60) {
    const detectionResults = [];

    // Run detection on each registered parser
    for (const [supplierKey, ParserClass] of this.parsers.entries()) {
      try {
        const detection = ParserClass.detectSupplier(pdfText);

        detectionResults.push({
          supplierKey,
          ParserClass,
          confidence: detection.confidence || 0,
          isMatch: detection.isMatch || false,
          notes: detection.notes || '',
        });
      } catch (error) {
        console.warn(`Detection failed for parser ${supplierKey}:`, error.message);
      }
    }

    // Sort by confidence (highest first)
    detectionResults.sort((a, b) => b.confidence - a.confidence);

    // Log detection results for debugging
    this.logDetectionResults(detectionResults);

    // Check if top match meets threshold
    if (detectionResults.length === 0) {
      console.warn('No parsers detected supplier');
      return null;
    }

    const topMatch = detectionResults[0];
    if (topMatch.confidence < minimumConfidence) {
      console.warn(
        `Top match confidence (${topMatch.confidence}%) below threshold (${minimumConfidence}%)`
      );
      return null;
    }

    // Instantiate top matching parser
    const parser = new topMatch.ParserClass();

    return {
      supplierKey: topMatch.supplierKey,
      parser,
      confidence: topMatch.confidence,
      parserResults: detectionResults,
    };
  }

  /**
   * Log all detection results for debugging
   * Shows confidence scores for all parsers
   *
   * @param {Array} results - Detection results from all parsers
   */
  logDetectionResults(results) {
    console.log('\n--- Supplier Detection Results ---');
    results.forEach((result, idx) => {
      const badge = result.isMatch ? '✓' : '✗';
      console.log(
        `${idx + 1}. [${badge}] ${result.supplierKey}: ${result.confidence}% - ${result.notes}`
      );
    });
    console.log('-----------------------------------\n');
  }

  // ========== PARSING WORKFLOW - TWO-LAYER DETECTION ==========

  /**
   * Complete parsing workflow with two-layer detection:
   *
   *   LAYER 1: MainSupplierMatcher (Fast)
   *     - Scans all suppliers in database by keywords
   *     - Returns top 3-5 candidates sorted by confidence
   *     - Time: ~100ms for any number of suppliers
   *
   *   LAYER 2: Parser Validation (Selective)
   *     - Only runs detailed detectSupplier() on top candidates
   *     - Skips unnecessary parser checks
   *     - Picks best match
   *
   *   PARSING:
   *     - Instantiate winning parser
   *     - Run parse() to extract items
   *     - Return standardized result
   *
   * Scales from 1 to 100+ suppliers with constant performance
   *
   * @param {string} pdfText - Raw PDF text
   * @param {Pool} pool - PostgreSQL connection pool
   * @returns {Promise<{
   *   success: boolean,
   *   supplier: {id, name, confidence},
   *   parsedItems: Array,
   *   metadata: Object,
   *   rawText: string,
   *   parserUsed: string,
   *   detectionResults: Object
   * }>}
   */
  async parseInvoice(pdfText, pool) {
    try {
      // ========== LAYER 1: FAST KEYWORD DETECTION ==========

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('INVOICE PARSING WORKFLOW - TWO-LAYER DETECTION');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Step 1: Use MainSupplierMatcher to find candidates
      const candidates = await MainSupplierMatcher.findCandidates(pdfText, pool);

      if (candidates.length === 0) {
        console.warn('[ParseInvoice] No supplier candidates found');
        return {
          success: false,
          error: 'Could not detect supplier from PDF. No matching keywords found.',
          suggestion: 'Ensure the PDF is a valid supplier invoice with recognizable supplier information.',
          candidatesChecked: 0,
        };
      }

      // ========== LAYER 2: SELECTIVE PARSER VALIDATION ==========

      console.log(`\n[ParseInvoice] Running detailed detection on top ${Math.min(candidates.length, 3)} candidates...\n`);

      const detailResults = [];

      // Only run detailed detection on top 3 candidates (not all suppliers!)
      for (const candidate of candidates.slice(0, 3)) {
        // Get supplier's parser key by matching supplier name to parser
        // This is a mapping - you may need to customize based on your setup
        const parserKey = this.getParserKeyForSupplier(candidate.supplierName);

        if (!parserKey) {
          console.log(
            `[ParseInvoice] No parser found for ${candidate.supplierName}, skipping detailed detection`
          );
          continue;
        }

        // Get the parser class
        const ParserClass = this.parsers.get(parserKey);
        if (!ParserClass) {
          console.log(`[ParseInvoice] Parser class not found for ${parserKey}`);
          continue;
        }

        // Run detailed detection
        try {
          const detection = ParserClass.detectSupplier(pdfText);

          detailResults.push({
            ...candidate,
            parserKey: parserKey,
            parserDetection: detection,
            finalConfidence: detection.confidence || candidate.confidence,
          });

          console.log(
            `  ✓ ${candidate.supplierName}: ${detection.confidence || candidate.confidence}% ` +
            `(${detection.notes || 'keyword match'})`
          );
        } catch (error) {
          console.warn(`  ✗ ${candidate.supplierName}: Detection failed - ${error.message}`);
        }
      }

      if (detailResults.length === 0) {
        console.warn('[ParseInvoice] No parsers successfully validated candidates');
        return {
          success: false,
          error: 'No available parser for detected suppliers',
          candidates: candidates,
        };
      }

      // ========== PICK BEST MATCH ==========

      const bestMatch = detailResults.sort((a, b) => b.finalConfidence - a.finalConfidence)[0];

      console.log(`\n[ParseInvoice] Best match: ${bestMatch.supplierName} (${bestMatch.finalConfidence}%)`);
      console.log(`[ParseInvoice] Using parser: ${bestMatch.parserKey}\n`);

      // ========== PARSE WITH WINNING PARSER ==========

      const parser = this.getParser(bestMatch.parserKey);
      if (!parser) {
        return {
          success: false,
          error: `Parser instantiation failed for ${bestMatch.parserKey}`,
        };
      }

      console.log(`[ParseInvoice] Starting PDF parse with ${bestMatch.parserKey} parser...\n`);

      const result = await parser.parse(pdfText);

      // ========== ENHANCE RESULT WITH DETECTION INFO ==========

      result.supplier.confidence = bestMatch.finalConfidence;
      result.supplier.detectionMethod = 'two-layer';
      result.detectionResults = {
        candidates: candidates,
        detailedResults: detailResults,
        selectedParser: bestMatch.parserKey,
      };

      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log('✓ PARSE COMPLETE');
      console.log(`  Supplier: ${result.supplier.name}`);
      console.log(`  Items: ${result.parsedItems.length}`);
      console.log(`  Parser: ${result.parserUsed}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      return result;
    } catch (error) {
      console.error('\n[ParseInvoice] Workflow error:', error);
      return {
        success: false,
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
    }
  }

  // ========== HELPER: MAP SUPPLIER NAME TO PARSER KEY ==========

  /**
   * Map supplier name to parser key
   * Customize this mapping based on your supplier/parser relationships
   *
   * @param {string} supplierName - Name from database
   * @returns {string|null} Parser key, or null if not found
   */
  getParserKeyForSupplier(supplierName) {
    // Simple mapping - can be enhanced with database lookup
    // Update this as new suppliers are added
    const nameToParserKey = {
      'Booker Limited': 'booker',
      'Booker Wholesale': 'booker', // Also accept this name
      'Tolchards Ltd': 'tolchards',
      'Tolchards': 'tolchards', // Also accept shorter name
      // Add more as suppliers are added
      // 'Supplier 2': 'supplier2',
      // 'Supplier 3': 'supplier3',
    };

    return nameToParserKey[supplierName] || null;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

// Create and export single instance
const registry = new ParserRegistry();

module.exports = registry;
