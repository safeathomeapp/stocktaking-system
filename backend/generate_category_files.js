#!/usr/bin/env node

/**
 * ============================================
 * TEMPORARY SCRIPT - SAFE TO DELETE
 * ============================================
 * Created: October 22, 2025
 * Purpose: Generate individual markdown files for each product category
 * Usage: node generate_category_files.js
 * Status: ✅ Run once to generate product listing files in docs/products/
 * Cleanup: Delete this file after files are generated
 * Output: Creates /docs/products/*.md files
 * ============================================
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'stocktaking_local',
  user: 'postgres'
});

const docsDir = 'C:/Users/kevth/Desktop/Stocktake/stocktaking-system/docs/products';

// Ensure docs/products directory exists
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
  console.log(`Created directory: ${docsDir}`);
}

async function generateCategoryFiles() {
  try {
    // Get all unique categories
    const categoriesResult = await pool.query(
      `SELECT DISTINCT category FROM master_products WHERE active = true ORDER BY category`
    );

    const categories = categoriesResult.rows.map(r => r.category);
    console.log(`Found ${categories.length} categories`);

    const categoryFiles = [];

    for (const category of categories) {
      // Get all products for this category organized by subcategory
      const productsResult = await pool.query(
        `SELECT category, subcategory, name, brand, unit_type, unit_size, case_size
         FROM master_products
         WHERE category = $1 AND active = true
         ORDER BY subcategory, name`,
        [category]
      );

      const products = productsResult.rows;
      const productCount = products.length;

      // Group by subcategory
      const grouped = {};
      products.forEach(p => {
        if (!grouped[p.subcategory]) {
          grouped[p.subcategory] = [];
        }
        grouped[p.subcategory].push(p);
      });

      // Create markdown filename (safe for filesystem)
      const safeName = category
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const filename = `products-${safeName}.md`;
      const filepath = path.join(docsDir, filename);

      // Build markdown content
      let markdown = `# ${category} Products\n\n`;
      markdown += `**Total Products**: ${productCount}\n`;
      markdown += `**Last Updated**: ${new Date().toISOString().split('T')[0]}\n\n`;
      markdown += `[← Back to Master Products Index](../masterproducts.md)\n\n`;
      markdown += `## Product Listing\n\n`;

      // Add products by subcategory
      Object.keys(grouped).sort().forEach(subcategory => {
        const subcategoryProducts = grouped[subcategory];
        markdown += `### ${subcategory} (${subcategoryProducts.length} products)\n\n`;
        markdown += `| Product Name | Brand | Unit Type | Size | Case Size |\n`;
        markdown += `|---|---|---|---|---|\n`;

        subcategoryProducts.forEach(p => {
          const size = p.unit_size ? `${p.unit_size}` : '—';
          markdown += `| ${p.name} | ${p.brand || '—'} | ${p.unit_type || '—'} | ${size} | ${p.case_size || '—'} |\n`;
        });

        markdown += `\n`;
      });

      // Write file
      fs.writeFileSync(filepath, markdown);
      console.log(`✅ Created: ${filename} (${productCount} products)`);

      categoryFiles.push({
        category,
        filename,
        count: productCount
      });
    }

    // Generate index of all category files
    generateCategoryIndex(categoryFiles);

    console.log(`\n✅ Generated ${categoryFiles.length} category files in docs/products/`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

function generateCategoryIndex(categoryFiles) {
  const indexPath = path.join(docsDir, 'INDEX.md');

  let index = `# Product Categories Index\n\n`;
  index += `**Generated**: ${new Date().toISOString().split('T')[0]}\n`;
  index += `**Total Categories**: ${categoryFiles.length}\n`;
  index += `**Total Products**: ${categoryFiles.reduce((sum, c) => sum + c.count, 0)}\n\n`;

  index += `## Categories\n\n`;
  index += `| Category | Products | File |\n`;
  index += `|---|---|---|\n`;

  categoryFiles.forEach(cf => {
    index += `| ${cf.category} | ${cf.count} | [View](${cf.filename}) |\n`;
  });

  index += `\n[← Back to Master Products](../masterproducts.md)\n`;

  fs.writeFileSync(indexPath, index);
  console.log(`✅ Created: INDEX.md`);
}

// Run the script
console.log('Generating category product files...\n');
generateCategoryFiles().catch(console.error);
