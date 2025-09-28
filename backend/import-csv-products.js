const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

class CSVProductImporter {

  constructor() {
    this.importStats = {
      totalRows: 0,
      successfulImports: 0,
      duplicatesSkipped: 0,
      errorsEncountered: 0,
      validationErrors: 0
    };
  }

  /**
   * Import products from CSV file
   * @param {string} csvFilePath - Path to CSV file
   * @param {Object} options - Import options
   */
  async importFromCSV(csvFilePath, options = {}) {
    const {
      skipDuplicates = true,
      validateData = true,
      batchSize = 100,
      venueId = null // If provided, creates venue-specific products too
    } = options;

    console.log('📂 Starting CSV import from:', csvFilePath);
    console.log('⚙️ Options:', { skipDuplicates, validateData, batchSize });

    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`CSV file not found: ${csvFilePath}`);
    }

    const products = [];
    let currentBatch = [];

    return new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
          this.importStats.totalRows++;

          try {
            const product = this.parseCSVRow(row);

            if (validateData && !this.validateProduct(product)) {
              this.importStats.validationErrors++;
              console.warn(`⚠️  Row ${this.importStats.totalRows}: Validation failed -`, product.name || 'Unknown');
              return;
            }

            currentBatch.push(product);

            // Process batch when it reaches batchSize
            if (currentBatch.length >= batchSize) {
              this.processBatch(currentBatch, venueId, skipDuplicates);
              currentBatch = [];
            }

          } catch (error) {
            this.importStats.errorsEncountered++;
            console.error(`❌ Row ${this.importStats.totalRows}: Parse error -`, error.message);
          }
        })
        .on('end', async () => {
          try {
            // Process final batch
            if (currentBatch.length > 0) {
              await this.processBatch(currentBatch, venueId, skipDuplicates);
            }

            await this.generateImportReport();
            resolve(this.importStats);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
  }

  /**
   * Parse a single CSV row into product object
   * @param {Object} row - CSV row object
   * @returns {Object} - Parsed product object
   */
  parseCSVRow(row) {
    // Flexible column name mapping (handles different CSV formats)
    const columnMap = this.createColumnMap(row);

    const product = {
      name: this.cleanString(row[columnMap.name]),
      brand: this.cleanString(row[columnMap.brand]),
      category: this.cleanString(row[columnMap.category]),
      subcategory: this.cleanString(row[columnMap.subcategory]),
      size: this.cleanString(row[columnMap.size]),
      unit_type: this.normalizeUnitType(row[columnMap.unit_type]),
      alcohol_percentage: this.parseFloat(row[columnMap.alcohol_percentage]),
      barcode: this.cleanString(row[columnMap.barcode]),
      ean_code: this.cleanString(row[columnMap.ean_code]),
      search_terms: this.generateSearchTerms(row, columnMap)
    };

    return product;
  }

  /**
   * Create flexible column mapping for different CSV formats
   */
  createColumnMap(row) {
    const headers = Object.keys(row).map(h => h.toLowerCase().trim());

    const map = {
      name: this.findColumn(headers, ['name', 'product_name', 'product', 'title']),
      brand: this.findColumn(headers, ['brand', 'manufacturer', 'producer', 'brewery']),
      category: this.findColumn(headers, ['category', 'type', 'product_type', 'group']),
      subcategory: this.findColumn(headers, ['subcategory', 'subtype', 'variety', 'style']),
      size: this.findColumn(headers, ['size', 'volume', 'amount', 'quantity']),
      unit_type: this.findColumn(headers, ['unit_type', 'unit', 'packaging', 'container']),
      alcohol_percentage: this.findColumn(headers, ['alcohol_percentage', 'alcohol', 'abv', 'alcohol_content', '%_alcohol']),
      barcode: this.findColumn(headers, ['barcode', 'upc', 'gtin']),
      ean_code: this.findColumn(headers, ['ean_code', 'ean', 'ean13'])
    };

    return map;
  }

  /**
   * Find the best matching column name
   */
  findColumn(headers, possibleNames) {
    for (const possible of possibleNames) {
      const found = headers.find(h => h.includes(possible));
      if (found) return found;
    }
    return possibleNames[0]; // Return first option as fallback
  }

  /**
   * Clean and normalize string values
   */
  cleanString(value) {
    if (!value || value === '') return null;
    return String(value).trim().replace(/\s+/g, ' ');
  }

  /**
   * Parse float values safely
   */
  parseFloat(value) {
    if (!value || value === '') return null;
    const parsed = parseFloat(String(value).replace(/[^\d.]/g, ''));
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Normalize unit type to match database constraints
   */
  normalizeUnitType(value) {
    if (!value) return 'other';

    const normalized = String(value).toLowerCase().trim();

    const unitMap = {
      'bottle': ['bottle', 'bottles', 'btl', 'bt'],
      'can': ['can', 'cans', 'tin', 'tins'],
      'keg': ['keg', 'kegs', 'barrel', 'barrels'],
      'case': ['case', 'cases', 'box', 'boxes', 'carton', 'cartons'],
      'jar': ['jar', 'jars', 'pot', 'pots'],
      'packet': ['packet', 'packets', 'pack', 'packs', 'bag', 'bags']
    };

    for (const [unitType, variations] of Object.entries(unitMap)) {
      if (variations.some(variant => normalized.includes(variant))) {
        return unitType;
      }
    }

    return 'other';
  }

  /**
   * Generate search terms from product data
   */
  generateSearchTerms(row, columnMap) {
    const terms = new Set();

    const name = row[columnMap.name];
    const brand = row[columnMap.brand];

    if (name) {
      terms.add(name.toLowerCase());
      name.split(/\s+/).forEach(word => {
        if (word.length > 2) terms.add(word.toLowerCase());
      });
    }

    if (brand) {
      terms.add(brand.toLowerCase());
      brand.split(/\s+/).forEach(word => {
        if (word.length > 2) terms.add(word.toLowerCase());
      });
    }

    // Add common variations
    if (brand && name) {
      terms.add(`${brand.toLowerCase()} ${name.toLowerCase()}`);
    }

    return Array.from(terms);
  }

  /**
   * Validate product data
   */
  validateProduct(product) {
    // Required fields
    if (!product.name || product.name.length < 2) {
      return false;
    }

    // Valid unit type
    const validUnitTypes = ['bottle', 'can', 'keg', 'case', 'jar', 'packet', 'other'];
    if (!validUnitTypes.includes(product.unit_type)) {
      return false;
    }

    // Alcohol percentage range
    if (product.alcohol_percentage !== null &&
        (product.alcohol_percentage < 0 || product.alcohol_percentage > 100)) {
      return false;
    }

    return true;
  }

  /**
   * Process a batch of products
   */
  async processBatch(products, venueId, skipDuplicates) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const product of products) {
        try {
          await this.insertMasterProduct(client, product, skipDuplicates);

          // Also create venue-specific product if venueId provided
          if (venueId) {
            await this.createVenueProduct(client, product, venueId);
          }

          this.importStats.successfulImports++;
        } catch (error) {
          if (error.code === '23505' && skipDuplicates) {
            // Duplicate key error - skip
            this.importStats.duplicatesSkipped++;
          } else {
            this.importStats.errorsEncountered++;
            console.error(`❌ Error importing ${product.name}:`, error.message);
          }
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Insert product into master_products table
   */
  async insertMasterProduct(client, product, skipDuplicates) {
    const sql = `
      INSERT INTO master_products (
        name, brand, category, subcategory, size, unit_type,
        alcohol_percentage, barcode, ean_code, search_terms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ${skipDuplicates ? 'ON CONFLICT (normalized_name, brand, size) DO NOTHING' : ''}
      RETURNING id
    `;

    const values = [
      product.name,
      product.brand,
      product.category,
      product.subcategory,
      product.size,
      product.unit_type,
      product.alcohol_percentage,
      product.barcode,
      product.ean_code,
      product.search_terms
    ];

    const result = await client.query(sql, values);
    return result.rows[0]?.id;
  }

  /**
   * Create venue-specific product entry
   */
  async createVenueProduct(client, masterProduct, venueId) {
    // Get venue areas
    const areasResult = await client.query(
      'SELECT id FROM venue_areas WHERE venue_id = $1 ORDER BY display_order LIMIT 1',
      [venueId]
    );

    if (areasResult.rows.length === 0) return;

    const areaId = areasResult.rows[0].id;

    const sql = `
      INSERT INTO products (
        venue_id, area_id, name, category, brand, size, unit_type, expected_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT DO NOTHING
    `;

    const values = [
      venueId,
      areaId,
      masterProduct.name,
      masterProduct.category,
      masterProduct.brand,
      masterProduct.size,
      masterProduct.unit_type,
      1 // Default expected count
    ];

    await client.query(sql, values);
  }

  /**
   * Generate import report
   */
  async generateImportReport() {
    console.log('\n📊 Import Complete! Summary:');
    console.log(`   📁 Total rows processed: ${this.importStats.totalRows}`);
    console.log(`   ✅ Successful imports: ${this.importStats.successfulImports}`);
    console.log(`   ⏭️  Duplicates skipped: ${this.importStats.duplicatesSkipped}`);
    console.log(`   ⚠️  Validation errors: ${this.importStats.validationErrors}`);
    console.log(`   ❌ Other errors: ${this.importStats.errorsEncountered}`);

    // Check final count
    const countResult = await pool.query('SELECT COUNT(*) as count FROM master_products');
    console.log(`   📦 Total products in database: ${countResult.rows[0].count}`);

    // Show some sample products
    const sampleResult = await pool.query(`
      SELECT name, brand, category, size, usage_count
      FROM master_products
      ORDER BY created_at DESC
      LIMIT 5
    `);

    console.log('\n📋 Recently imported products:');
    sampleResult.rows.forEach(product => {
      console.log(`   • ${product.name} (${product.brand}) - ${product.category} ${product.size}`);
    });
  }
}

// Command line usage
async function main() {
  const csvFilePath = process.argv[2];
  const venueId = process.argv[3]; // Optional

  if (!csvFilePath) {
    console.log('📋 CSV Product Importer Usage:');
    console.log('   node import-csv-products.js <csv-file-path> [venue-id]');
    console.log('');
    console.log('📂 Expected CSV columns (flexible naming):');
    console.log('   • name (required) - Product name');
    console.log('   • brand - Brand/manufacturer');
    console.log('   • category - Product category (Beer, Wine, Spirits, etc.)');
    console.log('   • subcategory - Subcategory (Lager, Red Wine, Vodka, etc.)');
    console.log('   • size - Size/volume (275ml, 750ml, etc.)');
    console.log('   • unit_type - bottle, can, keg, case, jar, packet, other');
    console.log('   • alcohol_percentage - Alcohol content (optional)');
    console.log('   • barcode - Product barcode (optional)');
    console.log('   • ean_code - EAN code (optional)');
    console.log('');
    console.log('💡 The importer will automatically map column names and handle variations.');
    process.exit(1);
  }

  try {
    const importer = new CSVProductImporter();
    await importer.importFromCSV(csvFilePath, {
      skipDuplicates: true,
      validateData: true,
      batchSize: 50,
      venueId: venueId
    });

    console.log('🎉 Import completed successfully!');
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = CSVProductImporter;