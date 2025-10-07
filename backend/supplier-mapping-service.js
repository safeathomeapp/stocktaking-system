const { Pool } = require('pg');

class SupplierMappingService {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Parse Bookers invoice data and map to master products format
   * Example input: {
   *   internal_code: "BK789123",
   *   description: "Coca Cola Can",
   *   pack: "24",
   *   size: "330ml",
   *   qty: "2",
   *   price: "18.50",
   *   value: "37.00",
   *   VAT: "7.40",
   *   STD_RRP: "1.20",
   *   POR: "12345"
   * }
   */
  async parseBookersData(bookersData) {
    console.log('🔍 Parsing Bookers data:', bookersData);

    // Extract product information using parsing rules
    const productInfo = {
      name: this.extractProductName(bookersData.description),
      case_size: parseInt(bookersData.pack) || 1,
      master_category: this.determineMasterCategory(bookersData.description),
      category: this.determineCategory(bookersData.description),
      brand: this.extractBrand(bookersData.description)
    };

    console.log('✨ Parsed product info:', productInfo);
    return productInfo;
  }

  /**
   * Extract clean product name from description
   */
  extractProductName(description) {
    if (!description) return '';

    // Remove common container words and clean up
    let name = description
      .replace(/\b(bottle|can|keg|box|bag|pack|case)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Capitalize first letter of each word
    return name.replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Extract container type from description
   */
  extractContainerType(description) {
    if (!description) return 'bottle'; // default

    const containerTypes = {
      'can': /\bcan\b/i,
      'bottle': /\bbottle\b/i,
      'keg': /\bkeg\b/i,
      'box': /\bbox\b/i,
      'bag': /\bbag\b/i
    };

    for (const [type, regex] of Object.entries(containerTypes)) {
      if (regex.test(description)) {
        return type;
      }
    }

    return 'bottle'; // default
  }

  /**
   * Normalize size format
   */
  normalizeSize(size) {
    if (!size) return '';

    // Handle common size formats
    const sizeStr = size.toString().toLowerCase();

    // Convert common variations
    if (sizeStr.includes('litre') || sizeStr.includes('liter')) {
      return sizeStr.replace(/litre?s?/g, 'L');
    }

    if (sizeStr.includes('gallon')) {
      return sizeStr.replace(/gallons?/g, 'gallons');
    }

    return size;
  }

  /**
   * Generate descriptive unit size
   */
  generateUnitSize(pack, size, description) {
    const packNum = parseInt(pack) || 1;
    const containerType = this.extractContainerType(description);
    const normalizedSize = this.normalizeSize(size);

    if (packNum === 1) {
      if (containerType === 'keg') {
        return `1 keg (${normalizedSize})`;
      }
      return `1 ${containerType}`;
    }

    return `${packNum} ${containerType}s per case`;
  }

  /**
   * Determine master category
   */
  determineMasterCategory(description) {
    if (!description) return 'misc';

    const desc = description.toLowerCase();

    const categories = {
      'wine': /\b(wine|chardonnay|merlot|sauvignon|pinot|prosecco|champagne|cabernet|shiraz|riesling)\b/i,
      'beer': /\b(beer|lager|ale|stout|bitter|ipa|pilsner)\b/i,
      'spirits': /\b(vodka|gin|whiskey|whisky|rum|brandy|spirit|liqueur|cognac|bourbon|scotch)\b/i,
      'draught': /\b(keg|draught|draft|tap)\b/i,
      'soft_drinks': /\b(cola|coke|pepsi|fanta|sprite|water|juice|lemonade|tonic|soda|mineral|soft drink)\b/i
    };

    for (const [category, regex] of Object.entries(categories)) {
      if (regex.test(desc)) {
        return category;
      }
    }

    return 'misc';
  }

  /**
   * Determine specific category
   */
  determineCategory(description) {
    if (!description) return '';

    const desc = description.toLowerCase();

    // Wine categories
    if (/chardonnay/i.test(desc)) return 'chardonnay';
    if (/sauvignon/i.test(desc)) return 'sauvignon blanc';
    if (/merlot/i.test(desc)) return 'merlot';
    if (/pinot grigio/i.test(desc)) return 'pinot grigio';
    if (/prosecco/i.test(desc)) return 'prosecco';

    // Beer categories
    if (/lager/i.test(desc)) return 'lager';
    if (/ale/i.test(desc)) return 'ale';
    if (/stout/i.test(desc)) return 'stout';
    if (/bitter/i.test(desc)) return 'bitter';

    // Spirit categories
    if (/vodka/i.test(desc)) return 'vodka';
    if (/gin/i.test(desc)) return 'gin';
    if (/whiskey|whisky/i.test(desc)) return 'whiskey';
    if (/rum/i.test(desc)) return 'rum';

    // Soft drinks
    if (/cola|coke/i.test(desc)) return 'cola';
    if (/water/i.test(desc)) return 'water';
    if (/juice/i.test(desc)) return 'juice';
    if (/lemonade/i.test(desc)) return 'lemonade';
    if (/tonic/i.test(desc)) return 'tonic';
    if (/mineral/i.test(desc)) return 'mineral';
    if (/soda/i.test(desc)) return 'soda';

    return '';
  }

  /**
   * Extract brand from description
   */
  extractBrand(description) {
    if (!description) return '';

    const commonBrands = [
      'Coca Cola', 'Pepsi', 'Heineken', 'Stella Artois', 'Guinness', 'Corona',
      'Budweiser', 'Beck\'s', 'Carlsberg', 'Absolut', 'Smirnoff', 'Jack Daniel\'s',
      'Jameson', 'Bombay', 'Tanqueray', 'Bacardi', 'Captain Morgan'
    ];

    const desc = description.toLowerCase();

    for (const brand of commonBrands) {
      if (desc.includes(brand.toLowerCase())) {
        return brand;
      }
    }

    // Try to extract first word as potential brand
    const words = description.split(' ');
    return words[0] || '';
  }

  /**
   * Find or create master product from supplier data
   */
  async findOrCreateMasterProduct(supplierData, supplierId) {
    try {
      // Parse the supplier data
      const productInfo = await this.parseBookersData(supplierData);

      // Try to find existing master product by name similarity
      const existingProduct = await this.findSimilarMasterProduct(productInfo.name, productInfo);

      if (existingProduct) {
        console.log('✅ Found existing master product:', existingProduct.name);

        // Create/update supplier mapping
        await this.createSupplierMapping(supplierId, existingProduct.id, supplierData, productInfo, 0.8, true);

        return existingProduct;
      }

      // Create new master product
      const newProduct = await this.createMasterProduct(productInfo);
      console.log('🆕 Created new master product:', newProduct.name);

      // Create supplier mapping
      await this.createSupplierMapping(supplierId, newProduct.id, supplierData, productInfo, 1.0, true);

      return newProduct;

    } catch (error) {
      console.error('❌ Error processing supplier data:', error);
      throw error;
    }
  }

  /**
   * Find similar master product using fuzzy matching
   */
  async findSimilarMasterProduct(name, productInfo) {
    const result = await this.pool.query(`
      SELECT * FROM master_products
      WHERE similarity(name, $1) > 0.6
      OR similarity(name, $2) > 0.7
      ORDER BY similarity(name, $1) DESC
      LIMIT 1
    `, [name, `${productInfo.brand} ${name}`]);

    return result.rows[0] || null;
  }

  /**
   * Create new master product
   */
  async createMasterProduct(productInfo) {
    const result = await this.pool.query(`
      INSERT INTO master_products (
        name, master_category, category, case_size, brand, active
      ) VALUES ($1, $2, $3, $4, $5, true)
      RETURNING *
    `, [
      productInfo.name,
      productInfo.master_category,
      productInfo.category,
      productInfo.case_size,
      productInfo.brand
    ]);

    return result.rows[0];
  }

  /**
   * Create supplier mapping entry
   */
  async createSupplierMapping(supplierId, masterProductId, supplierData, parsedInfo, confidence, autoMapped) {
    await this.pool.query(`
      INSERT INTO supplier_product_mappings (
        supplier_id, master_product_id, supplier_product_code,
        supplier_description, supplier_pack_size, supplier_unit_size,
        supplier_brand, supplier_data, mapping_confidence, auto_mapped
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (supplier_id, supplier_product_code)
      DO UPDATE SET
        master_product_id = $2,
        supplier_description = $4,
        mapping_confidence = $9,
        updated_at = CURRENT_TIMESTAMP
    `, [
      supplierId,
      masterProductId,
      supplierData.internal_code,
      supplierData.description,
      supplierData.pack,
      supplierData.size,
      parsedInfo.brand,
      JSON.stringify(supplierData),
      confidence,
      autoMapped
    ]);
  }

  /**
   * Process CSV data with field mapping
   */
  async processCSVData(csvData, supplierId, fieldMapping) {
    const results = [];

    for (const row of csvData) {
      try {
        // Map CSV fields to standard format
        const mappedData = this.mapCSVFields(row, fieldMapping);

        // Process as standard supplier data
        const masterProduct = await this.findOrCreateMasterProduct(mappedData, supplierId);
        results.push(masterProduct);

      } catch (error) {
        console.error('❌ Error processing CSV row:', row, error);
        results.push({ error: error.message, row });
      }
    }

    return results;
  }

  /**
   * Map CSV fields based on supplier configuration
   */
  mapCSVFields(csvRow, fieldMapping) {
    const mappedData = {};

    for (const [ourField, theirField] of Object.entries(fieldMapping)) {
      if (csvRow[theirField] !== undefined) {
        mappedData[ourField] = csvRow[theirField];
      }
    }

    return mappedData;
  }
}

module.exports = SupplierMappingService;