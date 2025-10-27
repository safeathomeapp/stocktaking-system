/**
 * ============================================================================
 * FUZZY MATCHING CONFIGURATION
 * ============================================================================
 *
 * Configuration for supplier item to master product fuzzy matching logic.
 * These settings control how strict or lenient the matching algorithm is.
 *
 * CONFIDENCE_THRESHOLD:
 *   - Minimum score (0-100) for automatic matching without user review
 *   - Scores >= threshold: Auto-matched (read-only in Step 4)
 *   - Scores < threshold: Manual review required (user selects from candidates)
 *   - Start high during testing to force manual review and verify matches
 *   - Adjust down in production as confidence builds
 *
 * Recommended values:
 *   - Testing/Development: 80-85 (more manual review for validation)
 *   - Production: 85-90 (trust the system with high confidence)
 *
 * SCORING ALGORITHM:
 *   finalScore = (nameSimilarity * 0.60)
 *              + (unitSizeMatch * 0.20)
 *              + (packSizeMatch * 0.15)
 *              + (categoryMatch * 0.05)
 *
 * Where:
 *   - nameSimilarity: PostgreSQL similarity() function (0-1, scaled to 0-100)
 *   - unitSizeMatch: 100 if exact match, 0 otherwise (e.g., "250ml" == "250ml")
 *   - packSizeMatch: 100 if exact match, 0 otherwise (e.g., "6-pack" == "6-pack")
 *   - categoryMatch: 100 if exact match, 0 otherwise
 *
 * ============================================================================
 */

export const FUZZY_MATCH_CONFIG = {
  /**
   * Confidence threshold for automatic matching (0-100)
   * Users can override auto-matches, but will be warned
   * CHANGE THIS VALUE TO ADJUST MATCHING STRICTNESS
   */
  CONFIDENCE_THRESHOLD: 80,

  /**
   * Minimum number of candidates to show (always show at least 1)
   */
  MIN_CANDIDATES_SHOWN: 1,

  /**
   * Maximum number of candidates to show (prevent UI clutter)
   */
  MAX_CANDIDATES_SHOWN: 5,

  /**
   * Scoring weights (must sum to 1.0)
   * Adjust these to emphasize different factors
   */
  SCORING_WEIGHTS: {
    NAME: 0.60,           // Product name similarity
    UNIT_SIZE: 0.20,      // Exact unit size match (e.g., 250ml)
    PACK_SIZE: 0.15,      // Exact pack size match (e.g., 6-pack)
    CATEGORY: 0.05,       // Exact category match
  },

  /**
   * Messages shown to user
   */
  MESSAGES: {
    AUTO_MATCH_HIGH:
      'The system is highly confident this is the correct match. Click to select or create a different product.',
    AUTO_MATCH_LOW:
      'The system found a potential match, but is not fully confident. Please review and confirm or select a different product.',
    MANUAL_REVIEW:
      'The system could not automatically match this item. Please select the correct product from the list below, or create a new one.',
    OVERRIDE_WARNING:
      'You are overriding the system recommendation. This item will be marked for manual review by admin.',
    CREATE_NEW_CONFIRM:
      'Creating new master product. This will be available for future invoices. Confirm to proceed.',
  },
};

export default FUZZY_MATCH_CONFIG;
