const { createWorker } = require('tesseract.js');
const { fromBuffer } = require('pdf2pic');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Extract text from scanned PDF using OCR
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Promise<{text: string, pages: Array<{pageNum: number, text: string}>}>}
 */
async function extractTextFromScannedPDF(pdfBuffer) {
  let worker;
  const tempFiles = [];

  try {
    // Convert PDF to PNG images using pdf2pic
    console.log('Converting PDF to images...');

    const options = {
      density: 200,           // DPI for better OCR accuracy
      saveFilename: "page",
      savePath: os.tmpdir(),  // Use system temp directory
      format: "png",
      width: 2000,            // Higher resolution for better OCR
      height: 2000
    };

    const pdf2pic = fromBuffer(pdfBuffer, options);

    // Get page count by trying to convert all pages
    const pageCount = 10; // Start with reasonable max
    const pngPages = [];

    for (let i = 1; i <= pageCount; i++) {
      try {
        const result = await pdf2pic(i, true); // true for base64 output
        pngPages.push(result);
      } catch (err) {
        // Stop when we reach a page that doesn't exist
        break;
      }
    }

    console.log(`Converted ${pngPages.length} pages to images`);

    // Initialize Tesseract worker
    worker = await createWorker('eng');

    const pages = [];
    let fullText = '';

    // Process each page
    for (let i = 0; i < pngPages.length; i++) {
      console.log(`Processing page ${i + 1}/${pngPages.length}...`);

      // pdf2pic returns object with base64 property
      const imageBuffer = Buffer.from(pngPages[i].base64, 'base64');
      const { data: { text } } = await worker.recognize(imageBuffer);

      pages.push({
        pageNum: i + 1,
        text: text.trim()
      });

      fullText += text + '\n\n';
    }

    await worker.terminate();

    return {
      text: fullText.trim(),
      pages: pages,
      pageCount: pngPages.length
    };

  } catch (error) {
    if (worker) {
      await worker.terminate();
    }
    console.error('OCR extraction error:', error);
    throw new Error('Failed to extract text from scanned PDF: ' + error.message);
  }
}

/**
 * Parse OCR text and convert to invoice data
 * @param {string} text - Extracted OCR text
 * @returns {Object} Parsed invoice data
 */
function parseOCRInvoiceText(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  const invoiceData = {
    rawText: text,
    lines: lines,
    header: {},
    items: []
  };

  // Enhanced patterns for invoice data
  const patterns = {
    invoiceNumber: /invoice\s*(?:no|number|#)?[:\s]+([A-Z0-9\-]+)/i,
    invoiceDate: /(?:invoice\s*)?date[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}\s+\w+\s+'\d{2}|\d{1,2}\s+\w+\s+\d{4})/i,
    deliveryNumber: /delivery\s*(?:no|number|#)?[:\s]+([A-Z0-9\-]+)/i,
    deliveryDate: /delivery\s*date[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    total: /total[:\s]+[£$€]?\s*(\d+[,.]?\d*\.?\d{2})/i,
    subtotal: /sub\s*total[:\s]+[£$€]?\s*(\d+[,.]?\d*\.?\d{2})/i,
    vat: /vat[:\s]+[£$€]?\s*(\d+[,.]?\d*\.?\d{2})/i,
    accountNumber: /account\s*(?:no|number)?[:\s]+([A-Z0-9\-]+)/i,
    orderNumber: /order\s*(?:no|number)?[:\s]+([A-Z0-9\-]+)/i
  };

  // Extract header information
  for (const line of lines) {
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = line.match(pattern);
      if (match && !invoiceData.header[key]) {
        invoiceData.header[key] = match[1];
      }
    }
  }

  // Try to identify line items with multiple patterns
  // Pattern 1: Qty first (e.g., "1 Energy Drink 83.09 83.09")
  const itemPattern1 = /^(\d+(?:\.\d{1,2})?)\s+(.+?)\s+([£$€]?\d+[,.]?\d*\.?\d{2})\s+([£$€]?\d+[,.]?\d*\.?\d{2})$/;

  // Pattern 2: Description first (e.g., "Energy Drink 1 83.09 83.09")
  const itemPattern2 = /^(.+?)\s+(\d+(?:\.\d{1,2})?)\s+([£$€]?\d+[,.]?\d*\.?\d{2})\s+([£$€]?\d+[,.]?\d*\.?\d{2})$/;

  for (const line of lines) {
    // Try quantity-first pattern
    let match = line.match(itemPattern1);
    if (match) {
      invoiceData.items.push({
        quantity: match[1],
        description: match[2].trim(),
        unitPrice: match[3].replace(/[£$€]/g, ''),
        totalPrice: match[4].replace(/[£$€]/g, '')
      });
      continue;
    }

    // Try description-first pattern
    match = line.match(itemPattern2);
    if (match) {
      invoiceData.items.push({
        description: match[1].trim(),
        quantity: match[2],
        unitPrice: match[3].replace(/[£$€]/g, ''),
        totalPrice: match[4].replace(/[£$€]/g, '')
      });
    }
  }

  return invoiceData;
}

module.exports = {
  extractTextFromScannedPDF,
  parseOCRInvoiceText
};
