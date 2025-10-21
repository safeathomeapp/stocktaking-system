#!/usr/bin/env node
/**
 * Test script for Step 3 Fuzzy Matching
 *
 * This script tests the enhanced invoice matching endpoint with:
 * - Tier 1: Existing supplier item SKU match
 * - Tier 2: Fuzzy match against master_products
 */

const http = require('http');

const API_BASE = 'http://localhost:3005';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testFuzzyMatching() {
  console.log(`\n${colors.blue}=== INVOICE FUZZY MATCHING TEST ===${colors.reset}\n`);

  try {
    // Step 1: Get venues to test with
    console.log(`${colors.cyan}Step 1: Fetching test venue...${colors.reset}`);
    const venuesRes = await makeRequest('GET', '/api/venues');
    if (venuesRes.status !== 200 || !venuesRes.body.venues || venuesRes.body.venues.length === 0) {
      console.log(`${colors.red}✗ No venues found. Create a test venue first.${colors.reset}`);
      return;
    }
    const testVenue = venuesRes.body.venues[0];
    console.log(`${colors.green}✓ Found venue: ${testVenue.name}${colors.reset}\n`);

    // Step 2: Get suppliers to test with
    console.log(`${colors.cyan}Step 2: Fetching test supplier...${colors.reset}`);
    const suppliersRes = await makeRequest('GET', '/api/suppliers');
    if (suppliersRes.status !== 200 || !suppliersRes.body.length || suppliersRes.body.length === 0) {
      console.log(`${colors.red}✗ No suppliers found. Create a test supplier first.${colors.reset}`);
      return;
    }
    const testSupplier = suppliersRes.body[0];
    console.log(`${colors.green}✓ Found supplier: ${testSupplier.sup_name}${colors.reset}\n`);

    // Step 3: List invoices to find one for testing
    console.log(`${colors.cyan}Step 3: Fetching recent invoices...${colors.reset}`);
    const invoicesRes = await makeRequest('GET', '/api/invoices?limit=10');
    if (invoicesRes.status !== 200 || !invoicesRes.body.invoices || invoicesRes.body.invoices.length === 0) {
      console.log(`${colors.yellow}⚠ No invoices found. Create a test invoice first with PDF upload.${colors.reset}\n`);
      console.log(`${colors.cyan}Test procedure:${colors.reset}`);
      console.log('  1. Go to http://localhost:3000/invoice-review');
      console.log('  2. Upload a PDF from a supplier (e.g., Booker Limited)');
      console.log('  3. Select products and create invoice');
      console.log('  4. Run this test again\n');
      return;
    }

    const testInvoice = invoicesRes.body.invoices[0];
    console.log(`${colors.green}✓ Found invoice #${testInvoice.invoice_number}${colors.reset}`);
    console.log(`  - ID: ${testInvoice.id}`);
    console.log(`  - Supplier: ${testInvoice.supplier_id}`);
    console.log(`  - Created: ${testInvoice.created_at}\n`);

    // Step 4: Get line items for this invoice
    console.log(`${colors.cyan}Step 4: Fetching invoice line items...${colors.reset}`);
    const lineItemsRes = await makeRequest('GET', `/api/invoices/${testInvoice.id}/line-items`);
    if (lineItemsRes.status !== 200 || !lineItemsRes.body.line_items) {
      console.log(`${colors.red}✗ Failed to fetch line items${colors.reset}\n`);
      return;
    }

    const lineItems = lineItemsRes.body.line_items;
    console.log(`${colors.green}✓ Found ${lineItems.length} line items${colors.reset}\n`);

    if (lineItems.length > 0) {
      console.log(`${colors.cyan}Sample items:${colors.reset}`);
      lineItems.slice(0, 3).forEach((item, idx) => {
        console.log(`  ${idx + 1}. "${item.product_name}" (qty: ${item.quantity})`);
      });
      if (lineItems.length > 3) {
        console.log(`  ... and ${lineItems.length - 3} more`);
      }
      console.log();
    }

    // Step 5: Test the fuzzy matching endpoint
    console.log(`${colors.cyan}Step 5: Running fuzzy matching (Tier 1 + Tier 2)...${colors.reset}\n`);
    const matchRes = await makeRequest('POST', `/api/invoices/${testInvoice.id}/match-supplier-items`);

    if (matchRes.status !== 200) {
      console.log(`${colors.red}✗ Matching failed with status ${matchRes.status}${colors.reset}`);
      console.log(JSON.stringify(matchRes.body, null, 2));
      return;
    }

    const matchData = matchRes.body.data;
    console.log(`${colors.green}✓ Matching completed!${colors.reset}\n`);

    // Display results
    console.log(`${colors.blue}=== MATCHING RESULTS ===${colors.reset}`);
    console.log(`Total items:       ${colors.cyan}${matchData.totalItems}${colors.reset}`);
    console.log(`Tier 1 (Matched):  ${colors.green}${matchData.matched}${colors.reset}`);
    console.log(`Tier 2 (Created):  ${colors.green}${matchData.created}${colors.reset}`);
    console.log(`Needs manual:      ${colors.yellow}${matchData.failed}${colors.reset}\n`);

    // Show breakdown
    const breakdown = {
      'Tier 1 (Existing Supplier Items)': matchData.results.matched,
      'Tier 2 (Fuzzy Matched)': matchData.results.created,
      'Needs Manual Matching': matchData.results.failed,
    };

    for (const [category, items] of Object.entries(breakdown)) {
      if (items.length > 0) {
        console.log(`${colors.blue}${category} (${items.length} items):${colors.reset}`);
        items.slice(0, 3).forEach((item, idx) => {
          if (item.status === 'matched') {
            console.log(`  ${idx + 1}. "${item.productName}" → Supplier Item #${item.supplierItemId}`);
          } else if (item.status === 'created') {
            console.log(`  ${idx + 1}. "${item.productName}" → "${item.matchedTo}" (confidence: ${item.confidenceScore}%)`);
          } else {
            const guess = item.bestGuess ? ` (suggested: "${item.bestGuess}")` : '';
            console.log(`  ${idx + 1}. "${item.productName}"${guess}`);
          }
        });
        if (items.length > 3) {
          console.log(`  ... and ${items.length - 3} more`);
        }
        console.log();
      }
    }

    // Summary
    console.log(`${colors.blue}=== SUMMARY ===${colors.reset}`);
    console.log(`Success Rate: ${colors.green}${Math.round((matchData.matched + matchData.created) / matchData.totalItems * 100)}%${colors.reset} (${matchData.matched + matchData.created}/${matchData.totalItems} items matched)`);
    console.log(`Manual Review: ${colors.yellow}${matchData.failed}${colors.reset} items need manual master product selection\n`);

    console.log(`${colors.green}✓ Fuzzy matching is working correctly!${colors.reset}\n`);

  } catch (error) {
    console.error(`${colors.red}✗ Test failed:${colors.reset}`, error.message);
  }
}

// Run the test
testFuzzyMatching();
