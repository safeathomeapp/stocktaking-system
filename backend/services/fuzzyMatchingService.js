/**
 * Fuzzy Matching Service for Voice Recognition
 * Provides intelligent product search and matching capabilities
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

class FuzzyMatchingService {

  /**
   * Main fuzzy search function
   * @param {string} query - Raw voice input text
   * @param {Object} options - Search options
   * @returns {Array} - Sorted array of product suggestions with confidence scores
   */
  async searchMasterProducts(query, options = {}) {
    const {
      maxResults = 20,
      minConfidence = 40,
      sessionId = null,
      venueId = null,
      includeAliases = true
    } = options;

    const startTime = Date.now();

    try {
      // Step 1: Process and normalize the query
      const processedQuery = this.processVoiceQuery(query);

      // Step 2: Multi-strategy search
      const searchResults = await this.performMultiStrategySearch(processedQuery, venueId);

      // Step 3: Calculate confidence scores and rank results
      const rankedResults = this.rankAndScoreResults(searchResults, processedQuery);

      // Step 4: Filter and limit results
      const filteredResults = rankedResults
        .filter(result => result.confidence >= minConfidence)
        .slice(0, maxResults);

      // Step 5: Log the search for learning
      if (sessionId) {
        await this.logVoiceRecognition({
          sessionId,
          rawAudioText: query,
          processedQuery: processedQuery.searchString,
          suggestionsReturned: filteredResults,
          totalSuggestions: filteredResults.length,
          processingTimeMs: Date.now() - startTime,
          venueId
        });
      }

      return {
        suggestions: filteredResults,
        processingTime: Date.now() - startTime,
        totalResults: filteredResults.length,
        query: processedQuery
      };

    } catch (error) {
      console.error('Fuzzy search error:', error);
      throw new Error('Search service unavailable');
    }
  }

  /**
   * Process voice query into searchable components
   * @param {string} rawQuery - Raw voice input
   * @returns {Object} - Processed query components
   */
  processVoiceQuery(rawQuery) {
    // Normalize the input
    const normalized = rawQuery.toLowerCase().trim();

    // Extract components using patterns
    const patterns = {
      size: /(\d+(?:\.\d+)?)\s*(ml|l|cl|oz|pint|litre|liter)/i,
      percentage: /(\d+(?:\.\d+)?)\s*(%|percent|proof)/i,
      numbers: /\b(\d+)\b/g
    };

    const size = patterns.size.exec(normalized);
    const percentage = patterns.percentage.exec(normalized);

    // Remove size and percentage info to get product name
    let productName = normalized
      .replace(patterns.size, '')
      .replace(patterns.percentage, '')
      .trim();

    // Common voice-to-text corrections
    const corrections = {
      'becks': "beck's",
      'jack daniels': "jack daniel's",
      'gordons': "gordon's",
      'shar don ay': 'chardonnay',
      'shar don nay': 'chardonnay',
      'pin oh grig io': 'pinot grigio',
      'cab sav': 'cabernet sauvignon',
      'bud': 'budweiser'
    };

    // Apply corrections
    Object.keys(corrections).forEach(wrong => {
      if (productName.includes(wrong)) {
        productName = productName.replace(wrong, corrections[wrong]);
      }
    });

    // Extract potential brand and product
    const words = productName.split(/\s+/).filter(w => w.length > 0);

    return {
      originalQuery: rawQuery,
      searchString: productName,
      words: words,
      size: size ? size[1] + size[2] : null,
      percentage: percentage ? parseFloat(percentage[1]) : null,
      searchTerms: this.generateSearchTerms(words)
    };
  }

  /**
   * Generate comprehensive search terms from query words
   */
  generateSearchTerms(words) {
    const terms = [...words];

    // Add common variations
    words.forEach(word => {
      // Add phonetic variations
      if (word === 'stella') terms.push('stellar');
      if (word === 'guinness') terms.push('guinnes', 'guiness');
      if (word === 'chardonnay') terms.push('chard', 'chardonay');

      // Add partial matches for longer words
      if (word.length > 4) {
        terms.push(word.substring(0, 4)); // First 4 characters
      }
    });

    return terms;
  }

  /**
   * Perform multi-strategy search across different matching methods
   */
  async performMultiStrategySearch(processedQuery, venueId) {
    const searchPromises = [
      this.exactNameSearch(processedQuery),
      this.brandCategorySearch(processedQuery),
      this.fuzzyTextSearch(processedQuery),
      this.phoneticSearch(processedQuery),
      this.aliasSearch(processedQuery, venueId)
    ];

    const results = await Promise.all(searchPromises);

    // Combine and deduplicate results
    const combinedResults = [];
    const seenIds = new Set();

    results.forEach(resultSet => {
      resultSet.forEach(product => {
        if (!seenIds.has(product.id)) {
          seenIds.add(product.id);
          combinedResults.push(product);
        }
      });
    });

    return combinedResults;
  }

  /**
   * Exact name matching (highest confidence)
   */
  async exactNameSearch(query) {
    const sql = `
      SELECT mp.*, 'exact' as match_type, 100 as base_confidence
      FROM master_products mp
      WHERE LOWER(mp.name) = $1
         OR LOWER(mp.brand) = $1
         OR LOWER(mp.normalized_name) = $2
      ORDER BY mp.usage_count DESC
      LIMIT 10
    `;

    const result = await pool.query(sql, [
      query.searchString,
      query.searchString.replace(/\s+/g, '')
    ]);

    return result.rows;
  }

  /**
   * Brand + category/size matching
   */
  async brandCategorySearch(query) {
    if (query.words.length < 2) return [];

    const sql = `
      SELECT mp.*, 'brand_category' as match_type, 85 as base_confidence
      FROM master_products mp
      WHERE (
        LOWER(mp.brand) = ANY($1)
        AND (
          LOWER(mp.category) = ANY($1)
          OR LOWER(mp.subcategory) = ANY($1)
          OR ($2::text IS NOT NULL AND LOWER(mp.size) LIKE '%' || $2 || '%')
        )
      )
      ORDER BY mp.usage_count DESC
      LIMIT 15
    `;

    const result = await pool.query(sql, [
      query.words,
      query.size ? query.size.replace(/[^\d]/g, '') : null
    ]);

    return result.rows;
  }

  /**
   * Full-text fuzzy search
   */
  async fuzzyTextSearch(query) {
    const sql = `
      SELECT
        mp.*,
        'fuzzy' as match_type,
        (
          similarity(mp.normalized_name, $1) * 40 +
          similarity(mp.name, $2) * 30 +
          similarity(mp.brand, $2) * 20 +
          (CASE WHEN mp.search_terms && $3 THEN 10 ELSE 0 END)
        ) as base_confidence
      FROM master_products mp
      WHERE mp.normalized_name % $1
         OR mp.name % $2
         OR mp.brand % $2
         OR mp.search_terms && $3
      ORDER BY base_confidence DESC, mp.usage_count DESC
      LIMIT 20
    `;

    const result = await pool.query(sql, [
      query.searchString.replace(/\s+/g, ''),
      query.searchString,
      query.searchTerms
    ]);

    return result.rows.filter(row => row.base_confidence > 30);
  }

  /**
   * Phonetic matching for mispronunciations
   */
  async phoneticSearch(query) {
    if (query.words.length === 0) return [];

    // Calculate phonetic keys for each word
    const phoneticPromises = query.words.map(word =>
      pool.query('SELECT calculate_phonetic_key($1) as phonetic', [word])
    );

    const phoneticResults = await Promise.all(phoneticPromises);
    const phoneticKeys = phoneticResults.map(r => r.rows[0].phonetic);

    const sql = `
      SELECT mp.*, 'phonetic' as match_type, 70 as base_confidence
      FROM master_products mp
      WHERE mp.phonetic_key = ANY($1)
         OR calculate_phonetic_key(mp.name) = ANY($1)
         OR calculate_phonetic_key(mp.brand) = ANY($1)
      ORDER BY mp.usage_count DESC
      LIMIT 15
    `;

    const result = await pool.query(sql, [phoneticKeys]);
    return result.rows;
  }

  /**
   * Search venue-specific product names
   */
  async aliasSearch(query, venueId) {
    if (!venueId) return [];

    const sql = `
      SELECT
        mp.*,
        vp.name as alias_name,
        'alias' as match_type,
        90 as base_confidence
      FROM master_products mp
      JOIN venue_products vp ON mp.id = vp.master_product_id
      WHERE vp.venue_id = $1
        AND (
          LOWER(vp.name) = $2
          OR vp.name % $2
        )
      ORDER BY mp.usage_count DESC
      LIMIT 10
    `;

    const result = await pool.query(sql, [venueId, query.searchString]);
    return result.rows;
  }

  /**
   * Rank and score search results
   */
  rankAndScoreResults(results, query) {
    return results.map(product => {
      let confidence = product.base_confidence || 50;

      // Boost confidence based on various factors

      // Exact size match
      if (query.size && product.size &&
          product.size.toLowerCase().includes(query.size.toLowerCase())) {
        confidence += 15;
      }

      // Usage frequency boost
      if (product.usage_count > 100) confidence += 10;
      else if (product.usage_count > 50) confidence += 5;

      // Recent usage boost
      if (product.last_used) {
        const daysSinceUsed = (Date.now() - new Date(product.last_used)) / (1000 * 60 * 60 * 24);
        if (daysSinceUsed < 7) confidence += 5;
        else if (daysSinceUsed < 30) confidence += 2;
      }

      // Success rate boost
      if (product.success_rate > 80) confidence += 8;
      else if (product.success_rate > 60) confidence += 4;

      // Venue count boost (popular across venues)
      if (product.total_venues_count > 10) confidence += 5;
      else if (product.total_venues_count > 5) confidence += 2;

      // Cap confidence at 100
      confidence = Math.min(confidence, 100);

      return {
        id: product.id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        subcategory: product.subcategory,
        size: product.size,
        unitType: product.unit_type,
        alcoholPercentage: product.alcohol_percentage,
        confidence: Math.round(confidence),
        usageCount: product.usage_count,
        lastUsed: product.last_used,
        matchType: product.match_type,
        aliasName: product.alias_name || null
      };
    }).sort((a, b) => {
      // Sort by confidence first, then usage count
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      return b.usageCount - a.usageCount;
    });
  }

  /**
   * Log voice recognition attempt for learning
   */
  async logVoiceRecognition(logData) {
    const sql = `
      INSERT INTO voice_recognition_log (
        session_id,
        raw_audio_text,
        processed_query,
        suggestions_returned,
        total_suggestions,
        processing_time_ms,
        venue_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;

    const values = [
      logData.sessionId,
      logData.rawAudioText,
      logData.processedQuery,
      JSON.stringify(logData.suggestionsReturned),
      logData.totalSuggestions,
      logData.processingTimeMs,
      logData.venueId
    ];

    const result = await pool.query(sql, values);
    return result.rows[0].id;
  }

  /**
   * Update usage statistics when a product is selected
   */
  async recordProductSelection(productId, logId, selectionRank) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Update master product usage
      await client.query(`
        UPDATE master_products
        SET
          usage_count = usage_count + 1,
          last_used = CURRENT_TIMESTAMP,
          success_rate = (
            SELECT COALESCE(
              (COUNT(*) FILTER (WHERE selection_rank <= 3) * 100.0 / COUNT(*)),
              50.0
            )
            FROM voice_recognition_log
            WHERE selected_product_id = $1
          )
        WHERE id = $1
      `, [productId]);

      // Update voice recognition log
      await client.query(`
        UPDATE voice_recognition_log
        SET
          selected_product_id = $1,
          selection_rank = $2,
          user_selected = true
        WHERE id = $3
      `, [productId, selectionRank, logId]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Add new product to master database
   */
  async addMasterProduct(productData) {
    const sql = `
      INSERT INTO master_products (
        name, brand, category, subcategory, size, unit_type,
        alcohol_percentage, search_terms, first_seen_venue
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const searchTerms = this.generateSearchTerms(
      productData.name.split(/\s+/).concat(
        productData.brand ? productData.brand.split(/\s+/) : []
      )
    );

    const values = [
      productData.name,
      productData.brand,
      productData.category,
      productData.subcategory,
      productData.size,
      productData.unit_type,
      productData.alcohol_percentage,
      searchTerms,
      productData.venue_id
    ];

    const result = await pool.query(sql, values);
    return result.rows[0];
  }
}

module.exports = new FuzzyMatchingService();