/**
 * ============================================================================
 * MAIN SUPPLIER MATCHER
 * ============================================================================
 *
 * Purpose:
 *   Fast, database-driven supplier detection for large-scale systems
 *   Enables system to scale from 1 to 100+ suppliers without code changes
 *
 * Architecture:
 *   - Scans keywords table from suppliers database
 *   - Calculates confidence score based on keyword matches
 *   - Returns top 3-5 candidates sorted by confidence
 *   - Parser-specific detection only runs on candidates (not all suppliers)
 *
 * Why Two-Layer Detection:
 *   Layer 1 (Main Matcher): Fast keyword scan (~100ms for 100 suppliers)
 *   Layer 2 (Parser Validators): Detailed checks only on top 3-5 candidates
 *
 *   This scales infinitely:
 *   - 5 suppliers: 100ms (keyword) + 150ms (validation) = 250ms
 *   - 100 suppliers: 100ms (keyword) + 150ms (validation) = 250ms  ✓
 *   - 1000 suppliers: 200ms (keyword) + 150ms (validation) = 350ms ✓
 *
 * Keyword Configuration:
 *   Stored in suppliers table, `keywords` column
 *   Format: comma or pipe-separated: "booker,booker wholesale,booker limited"
 *   Each keyword is searched in PDF text (case-insensitive)
 *
 * How It Works:
 *   1. Load all suppliers + keywords from database
 *   2. For each supplier, count keyword matches in PDF text
 *   3. Calculate confidence: (matches × base_score) capped at 100%
 *   4. Sort by confidence descending
 *   5. Return top 5 candidates
 *
 * Performance:
 *   Keyword Scan: O(n) where n = number of suppliers (very fast)
 *   String Search: Native JavaScript .includes() (optimized)
 *   Memory: Minimal - just keywords, no parser instantiation
 * ============================================================================
 */

/**
 * Main Supplier Matcher - Fast keyword-based detection
 */
class MainSupplierMatcher {
  // ========== CONSTANTS ==========

  // Base confidence per keyword match
  static BASE_SCORE_PER_KEYWORD = 25;

  // Maximum confidence score
  static MAX_CONFIDENCE = 100;

  // Number of top candidates to return
  static TOP_CANDIDATES_TO_RETURN = 5;

  // ========== MAIN METHOD ==========

  /**
   * Find candidate suppliers based on keyword matches in PDF text
   *
   * Scans all active suppliers in database and ranks them by
   * how many of their keywords appear in the PDF text.
   *
   * Example:
   *   PDF text contains: "Booker Limited invoice"
   *   Booker keywords: "booker", "booker wholesale", "booker limited"
   *   Matches: 2 matches ("booker" + "booker limited")
   *   Confidence: 2 × 25 = 50%
   *
   * @param {string} pdfText - Raw text extracted from PDF
   * @param {Pool} pool - PostgreSQL connection pool
   * @returns {Promise<Array>} Top candidates sorted by confidence
   *   [
   *     { supplierId, supplierName, confidence, matchedKeywords, keywords },
   *     ...
   *   ]
   * @throws {Error} If database query fails
   */
  static async findCandidates(pdfText, pool) {
    if (!pdfText || !pool) {
      throw new Error('pdfText and pool are required');
    }

    console.log('\n[MainSupplierMatcher] Starting supplier detection...');

    try {
      // ========== STEP 1: Load suppliers from database ==========

      const result = await pool.query(`
        SELECT sup_id, sup_name, keywords
        FROM suppliers
        WHERE sup_active = true
        ORDER BY sup_name
      `);

      const suppliers = result.rows;

      if (suppliers.length === 0) {
        console.warn('[MainSupplierMatcher] No active suppliers found in database');
        return [];
      }

      console.log(`[MainSupplierMatcher] Loaded ${suppliers.length} active suppliers from database`);

      // ========== STEP 2: Convert text to lowercase for matching ==========

      const textLower = pdfText.toLowerCase();

      // ========== STEP 3: Score each supplier ==========

      const candidates = [];

      for (const supplier of suppliers) {
        // Skip suppliers without keywords configured
        if (!supplier.keywords || supplier.keywords.trim().length === 0) {
          continue;
        }

        // Split keywords (comma or pipe separated)
        const keywords = supplier.keywords
          .split(/[,|]/)
          .map(kw => kw.trim().toLowerCase())
          .filter(kw => kw.length > 0);

        // Count matches
        let matchCount = 0;
        const matchedKeywords = [];

        for (const keyword of keywords) {
          if (textLower.includes(keyword)) {
            matchCount++;
            matchedKeywords.push(keyword);
          }
        }

        // Only include suppliers with at least one match
        if (matchCount > 0) {
          // Calculate confidence: matches × base_score, capped at 100
          const confidence = Math.min(matchCount * this.BASE_SCORE_PER_KEYWORD, this.MAX_CONFIDENCE);

          candidates.push({
            supplierId: supplier.sup_id,
            supplierName: supplier.sup_name,
            keywords: keywords,
            matchedKeywords: matchedKeywords,
            matchCount: matchCount,
            confidence: confidence,
          });
        }
      }

      // ========== STEP 4: Sort by confidence descending ==========

      candidates.sort((a, b) => b.confidence - a.confidence);

      // ========== STEP 5: Return top candidates ==========

      const topCandidates = candidates.slice(0, this.TOP_CANDIDATES_TO_RETURN);

      console.log(
        `[MainSupplierMatcher] Found ${candidates.length} candidate(s), returning top ${topCandidates.length}`
      );

      // Log candidates for debugging
      this.logCandidates(topCandidates);

      return topCandidates;
    } catch (error) {
      console.error('[MainSupplierMatcher] Database query failed:', error.message);
      throw error;
    }
  }

  // ========== HELPER METHODS ==========

  /**
   * Log candidates for debugging
   *
   * @param {Array} candidates - Candidates from findCandidates()
   */
  static logCandidates(candidates) {
    console.log('\n--- Supplier Detection Candidates ---');

    if (candidates.length === 0) {
      console.log('No candidates found');
    } else {
      candidates.forEach((candidate, idx) => {
        console.log(
          `${idx + 1}. ${candidate.supplierName} - ${candidate.confidence}% ` +
          `(${candidate.matchCount} keyword${candidate.matchCount !== 1 ? 's' : ''} matched)`
        );
        console.log(`   Matched: ${candidate.matchedKeywords.join(', ')}`);
      });
    }

    console.log('------------------------------------\n');
  }

  /**
   * Get keyword string for display
   * Used in logging and debugging
   *
   * @param {Array} keywords - Array of keywords
   * @returns {string} Comma-separated keywords
   */
  static formatKeywords(keywords) {
    if (!keywords || keywords.length === 0) {
      return 'None';
    }
    return keywords.join(', ');
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = MainSupplierMatcher;
