// Test complete invoice import and matching workflow
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const API_BASE = 'http://localhost:3005/api';

async function testInvoiceImport() {
  try {
    console.log('🧪 TESTING COMPLETE INVOICE IMPORT WORKFLOW\n');

    // ========================================
    // STEP 1: Parse PDF
    // ========================================
    console.log('📄 Step 1: Parsing Booker invoice PDF...\n');

    const pdfPath = path.join('C:', 'Users', 'kevth', 'Downloads', 'Booker-Invoice-3504502 (1).pdf');

    if (!fs.existsSync(pdfPath)) {
      console.error('❌ PDF file not found:', pdfPath);
      return;
    }

    const formData = new FormData();
    formData.append('pdf', fs.createReadStream(pdfPath));

    const parseResponse = await axios.post(`${API_BASE}/invoices/parse-supplier-pdf`, formData, {
      headers: formData.getHeaders()
    });

    const parsedData = parseResponse.data.data;
    console.log('✅ PDF Parsed Successfully:');
    console.log(`   Supplier: ${parsedData.supplier}`);
    console.log(`   Invoice Number: ${parsedData.invoiceNumber}`);
    console.log(`   Invoice Date: ${parsedData.invoiceDate}`);
    console.log(`   Customer Number: ${parsedData.customerNumber}`);
    console.log(`   Total Products: ${parsedData.totalProducts}`);
    console.log('');

    // ========================================
    // STEP 2: Get venue ID (use first venue)
    // ========================================
    console.log('🏢 Step 2: Getting venue ID...\n');

    const venuesResponse = await axios.get(`${API_BASE}/venues`);
    const venues = venuesResponse.data;

    if (venues.length === 0) {
      console.error('❌ No venues found. Please create a venue first.');
      return;
    }

    const venueId = venues[0].id;
    console.log(`✅ Using venue: ${venues[0].name} (ID: ${venueId})`);
    console.log('');

    // ========================================
    // STEP 3: Create Invoice with Line Items
    // ========================================
    console.log('💾 Step 3: Saving invoice to database...\n');

    const invoiceData = {
      supplierName: parsedData.supplier,
      venueId: venueId,
      invoiceNumber: parsedData.invoiceNumber,
      invoiceDate: parsedData.invoiceDate,
      customerNumber: parsedData.customerNumber,
      deliveryNumber: parsedData.deliveryNumber,
      totalAmount: parsedData.products.reduce((sum, p) => sum + (p.unitCost * p.quantity), 0),
      lineItems: parsedData.products.map(p => ({
        sku: p.sku,
        name: p.name,
        description: p.name,
        caseSize: p.quantity || 1,
        unitCost: p.unitCost || 0,
        packSize: p.packSize,
        unitSize: p.unitSize
      }))
    };

    const invoiceResponse = await axios.post(`${API_BASE}/invoices`, invoiceData);
    const invoice = invoiceResponse.data.data.invoice;
    const lineItems = invoiceResponse.data.data.lineItems;

    console.log('✅ Invoice Created:');
    console.log(`   Invoice ID: ${invoice.id}`);
    console.log(`   Invoice Number: ${invoice.invoice_number}`);
    console.log(`   Supplier ID: ${invoiceResponse.data.data.supplierId}`);
    console.log(`   Line Items: ${lineItems.length}`);
    console.log('');

    // ========================================
    // STEP 4: Match to Supplier Item List
    // ========================================
    console.log('🔗 Step 4: Matching line items to supplier_item_list...\n');

    const matchResponse = await axios.post(`${API_BASE}/invoices/${invoice.id}/match-supplier-items`);
    const matchResults = matchResponse.data.data;

    console.log('✅ Supplier Matching Complete:');
    console.log(`   Total Items: ${matchResults.totalItems}`);
    console.log(`   Matched (existing): ${matchResults.matched}`);
    console.log(`   Created (new): ${matchResults.created}`);
    console.log(`   Failed: ${matchResults.failed}`);
    console.log('');

    // Show first 5 matched items
    if (matchResults.results.matched.length > 0) {
      console.log('📌 First 5 Matched Items:');
      matchResults.results.matched.slice(0, 5).forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.productName}`);
        console.log(`      Supplier Item ID: ${item.supplierItemId}`);
        console.log(`      Master Product ID: ${item.masterProductId || 'Not linked yet'}`);
      });
      console.log('');
    }

    // Show first 5 created items
    if (matchResults.results.created.length > 0) {
      console.log('🆕 First 5 Newly Created Supplier Items:');
      matchResults.results.created.slice(0, 5).forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.productName}`);
        console.log(`      Supplier Item ID: ${item.supplierItemId}`);
        console.log(`      Status: Needs master product linking`);
      });
      console.log('');
    }

    // ========================================
    // STEP 5: Fuzzy Match to Master Products
    // ========================================
    console.log('🔍 Step 5: Testing fuzzy match for first unlinked item...\n');

    const firstUnlinkedItem = matchResults.results.created[0] || matchResults.results.matched.find(m => !m.masterProductId);

    if (firstUnlinkedItem) {
      const fuzzyResponse = await axios.post(`${API_BASE}/master-products/fuzzy-match`, {
        productName: firstUnlinkedItem.productName,
        limit: 5
      });

      const fuzzyMatches = fuzzyResponse.data.data;

      console.log(`🎯 Fuzzy matches for "${firstUnlinkedItem.productName}":`);
      if (fuzzyMatches.length > 0) {
        fuzzyMatches.forEach((match, i) => {
          console.log(`   ${i + 1}. ${match.product_name}`);
          console.log(`      Brand: ${match.brand || 'N/A'}`);
          console.log(`      Size: ${match.unit_size || 'N/A'} ${match.unit_type || ''}`);
          console.log(`      Score: ${(match.total_score * 100).toFixed(1)}%`);
        });
      } else {
        console.log('   No matches found in master products catalog');
      }
      console.log('');
    }

    // ========================================
    // SUMMARY
    // ========================================
    console.log('📊 IMPORT SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Invoice ${invoice.invoice_number} imported successfully`);
    console.log(`📦 ${lineItems.length} line items created`);
    console.log(`🔗 ${matchResults.matched} items matched to existing supplier items`);
    console.log(`🆕 ${matchResults.created} new supplier items created`);
    console.log('');
    console.log('Next steps:');
    console.log('1. Review unlinked items in the UI');
    console.log('2. Use fuzzy matching to link to master products');
    console.log('3. Create new master products for items with no match');
    console.log('');
    console.log(`View invoice at: http://localhost:3000 (Invoice ID: ${invoice.id})`);

  } catch (error) {
    console.error('❌ Error during import:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }
}

// Run the test
testInvoiceImport();
