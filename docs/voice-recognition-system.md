# Voice Recognition & Global Product Database System

## 🎯 System Overview

**Vision**: Voice-driven stock-taking with intelligent product suggestions from a global master database.

**User Experience**:
1. User says: *"Becks 275ml"* or *"Chardonnay"*
2. System performs fuzzy matching against global product database
3. Returns intelligent suggestions (e.g., 20 different Chardonnays)
4. User selects correct match from dropdown
5. Product added to current stock-taking session

## 🏗️ System Architecture

```
Voice Input → Speech-to-Text → Fuzzy Matching → Global DB → Suggestions → User Selection → Session Entry
```

### Components:
1. **Voice Recognition** - Browser Web Speech API
2. **Global Master Database** - Cross-venue product catalog
3. **Fuzzy Matching Engine** - Intelligent product search
4. **Suggestion UI** - Smart dropdown with confidence scores
5. **Learning System** - Improves with usage across venues

## 🗄️ Database Schema Design

### New Table: `master_products`

```sql
CREATE TABLE master_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Core Product Information
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    category VARCHAR(100), -- Beer, Wine, Spirits, Soft Drinks, etc.
    subcategory VARCHAR(100), -- Lager, Red Wine, Vodka, etc.

    -- Physical Attributes
    size VARCHAR(50), -- 275ml, 750ml, 1L, etc.
    unit_type VARCHAR(50) CHECK (unit_type IN ('bottle', 'can', 'keg', 'case', 'jar', 'packet', 'other')),
    alcohol_percentage DECIMAL(4,2), -- 4.5%, 12.5%, 40.0%

    -- Identification
    barcode VARCHAR(100),
    ean_code VARCHAR(20),

    -- Search Optimization
    search_terms TEXT[], -- Array of alternative names/spellings
    phonetic_key VARCHAR(100), -- Soundex/Metaphone for voice matching

    -- Usage Statistics
    usage_count INTEGER DEFAULT 0, -- How often this product is selected
    last_used TIMESTAMP,

    -- Venue Tracking
    venues_seen UUID[], -- Array of venue IDs where this product was found
    first_seen_venue UUID REFERENCES venues(id),

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) -- User/system that added this product
);
```

### Enhanced Table: `products` (Venue-Specific)

```sql
-- Add reference to master product
ALTER TABLE products ADD COLUMN master_product_id UUID REFERENCES master_products(id);

-- Add local customization
ALTER TABLE products ADD COLUMN local_name VARCHAR(255); -- Venue's custom name
ALTER TABLE products ADD COLUMN supplier VARCHAR(100);
ALTER TABLE products ADD COLUMN cost_price DECIMAL(10,2);
ALTER TABLE products ADD COLUMN selling_price DECIMAL(10,2);
```

### Voice Recognition Log: `voice_recognition_log`

```sql
CREATE TABLE voice_recognition_log (
    id SERIAL PRIMARY KEY,
    session_id UUID REFERENCES stock_sessions(id),

    -- Voice Input
    raw_audio_text TEXT NOT NULL, -- What speech-to-text heard
    confidence_score DECIMAL(3,2), -- Speech recognition confidence

    -- Fuzzy Matching Results
    search_query TEXT, -- Processed search terms
    suggestions_returned JSONB, -- Array of suggested products with scores

    -- User Action
    selected_product_id UUID REFERENCES master_products(id),
    user_selected BOOLEAN DEFAULT false,
    manual_entry BOOLEAN DEFAULT false, -- User typed instead of voice

    -- Performance Metrics
    processing_time_ms INTEGER,
    suggestion_accuracy DECIMAL(3,2), -- Was correct product in top N results?

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🧠 Fuzzy Matching Algorithm

### Multi-Layer Matching Strategy:

1. **Exact Match** (100% confidence)
   - Direct name/brand match
   - Barcode/EAN match

2. **High Confidence** (80-99%)
   - Brand + size match: "Becks 275ml"
   - Brand + category: "Smirnoff Vodka"

3. **Medium Confidence** (60-79%)
   - Phonetic matching: "Shar-don-ay" → "Chardonnay"
   - Partial word matching: "Bud" → "Budweiser"

4. **Low Confidence** (40-59%)
   - Category matching: "Red wine" → All red wines
   - Similar sounding: "Stella" → "Stellar", "Estella"

### Search Query Processing:

```javascript
// Example voice input processing
"Becks 275ml" → {
  brand: "Becks",
  size: "275ml",
  category: "Beer",
  searchTerms: ["becks", "beck's", "275ml", "275", "beer"]
}

"Chardonnay" → {
  variety: "Chardonnay",
  category: "Wine",
  subcategory: "White Wine",
  searchTerms: ["chardonnay", "chard", "white wine"]
}
```

## 🎤 Voice Recognition Implementation

### Frontend Component Structure:

```javascript
// VoiceProductSearch.js
const VoiceProductSearch = ({ onProductSelect, sessionId }) => {
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [confidence, setConfidence] = useState(0);

  const startVoiceRecognition = () => {
    // Web Speech API implementation
  };

  const processVoiceInput = async (transcript) => {
    // Send to fuzzy matching API
    const response = await apiService.searchMasterProducts({
      query: transcript,
      sessionId: sessionId,
      maxResults: 20
    });
    setSuggestions(response.suggestions);
  };

  return (
    <VoiceSearchContainer>
      <VoiceButton
        isListening={isListening}
        onClick={startVoiceRecognition}
      >
        {isListening ? <MicIcon /> : <MicOffIcon />}
      </VoiceButton>

      {suggestions.length > 0 && (
        <SuggestionDropdown>
          {suggestions.map(product => (
            <SuggestionItem
              key={product.id}
              confidence={product.confidence}
              onClick={() => onProductSelect(product)}
            >
              <ProductName>{product.name}</ProductName>
              <ProductDetails>{product.brand} • {product.size}</ProductDetails>
              <ConfidenceScore>{product.confidence}%</ConfidenceScore>
            </SuggestionItem>
          ))}
        </SuggestionDropdown>
      )}
    </VoiceSearchContainer>
  );
};
```

## 🔍 API Endpoints Design

### Master Products Search
```
POST /api/master-products/search
{
  "query": "becks 275ml",
  "sessionId": "uuid",
  "maxResults": 20,
  "minConfidence": 40
}

Response:
{
  "suggestions": [
    {
      "id": "uuid",
      "name": "Beck's",
      "brand": "Beck's",
      "size": "275ml",
      "category": "Beer",
      "confidence": 95,
      "usageCount": 1247,
      "lastUsed": "2025-09-20"
    }
  ],
  "processingTime": 45,
  "totalResults": 1
}
```

### Add to Master Database
```
POST /api/master-products
{
  "name": "New Product Name",
  "brand": "Brand",
  "category": "Category",
  "size": "Size",
  "venueId": "current-venue-uuid"
}
```

### Usage Analytics
```
GET /api/master-products/analytics
Response: {
  "totalProducts": 15000,
  "mostUsed": [...],
  "recentlyAdded": [...],
  "accuracyMetrics": {
    "averageConfidence": 87.5,
    "topSuggestionAccuracy": 78.2
  }
}
```

## 🚀 Implementation Phases

### Phase 1: Foundation
- [ ] Create master_products table
- [ ] Build basic fuzzy search API
- [ ] Implement simple voice recognition UI
- [ ] Test with 100 common products

### Phase 2: Intelligence
- [ ] Advanced fuzzy matching algorithms
- [ ] Machine learning for suggestion ranking
- [ ] Voice recognition confidence scoring
- [ ] Usage-based product ranking

### Phase 3: Learning System
- [ ] Auto-learn from user selections
- [ ] Cross-venue product discovery
- [ ] Phonetic matching improvements
- [ ] Predictive suggestions

## 📊 Example Usage Scenarios

### Scenario 1: New Product Discovery
1. User at "The Crown" says: *"Brewdog Punk IPA"*
2. System finds it in master DB (added by "The Red Lion")
3. Suggests: "Brewdog Punk IPA 330ml (95% confidence)"
4. User confirms → Added to The Crown's inventory

### Scenario 2: Fuzzy Matching
1. User says: *"Shar-don-ay"* (mispronounced)
2. System phonetic matches to "Chardonnay"
3. Shows 20 Chardonnay options sorted by usage frequency
4. User selects "House Chardonnay 750ml"

### Scenario 3: Learning from Context
1. User says: *"House wine"*
2. System learns this venue calls their Chardonnay "House wine"
3. Next time, "House wine" immediately suggests their Chardonnay
4. Venue-specific learning improves accuracy

## 🎯 Success Metrics

### Technical Metrics:
- **Voice Recognition Accuracy**: >90% correct transcription
- **Fuzzy Match Quality**: Correct product in top 5 suggestions >80% of time
- **Response Time**: <500ms for search results
- **Database Growth**: 100+ new products per week across all venues

### User Experience Metrics:
- **Voice Usage Adoption**: >70% of stock entries use voice
- **Selection Accuracy**: Users select top suggestion >60% of time
- **Time Savings**: 50% faster than manual typing
- **Error Reduction**: 30% fewer incorrect product selections

## 🔧 Technical Considerations

### Voice Recognition:
- **Browser Support**: Web Speech API (Chrome, Edge, Safari)
- **Offline Capability**: Cache common products for offline fuzzy matching
- **Noise Handling**: Background noise filtering and confidence thresholds

### Database Performance:
- **Full-text Search**: PostgreSQL with GIN indexes
- **Caching**: Redis for frequent product searches
- **Scaling**: Separate read replicas for search operations

### Privacy & Security:
- **Voice Data**: Process locally, don't store audio
- **Product Data**: Anonymize venue-specific information
- **API Security**: Rate limiting and authentication

---

*This system transforms stock-taking from manual typing to intelligent voice-driven product discovery, learning and improving with every venue visit.*