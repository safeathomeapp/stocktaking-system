const { createWorker } = require('tesseract.js');
const { pdfToPng } = require('pdf-to-png-converter');
const fs = require('fs');
const path = require('path');

/**
 * Extract text from scanned PDF using OCR
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Promise<{text: string, pages: Array<{pageNum: number, text: string}>}>}
 */
async function extractTextFromScannedPDF(pdfBuffer) {
  let worker;
  try {
    // Convert PDF to PNG images
    console.log('Converting PDF to images...');
    const pngPages = await pdfToPng(pdfBuffer, {
      disableFontFace: false,
      useSystemFonts: false,
      viewportScale: 2.0, // Higher scale for better OCR accuracy
    });

    console.log(`Converted ${pngPages.length} pages to images`);

    // Initialize Tesseract worker
    worker = await createWorker('eng');

    const pages = [];
    let fullText = '';

    // Process each page
    for (let i = 0; i < pngPages.length; i++) {
      console.log(`Processing page ${i + 1}/${pngPages.length}...`);

      const { data: { text } } = await worker.recognize(pngPages[i].content);

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
