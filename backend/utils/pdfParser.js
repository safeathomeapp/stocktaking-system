const { PDFParse } = require('pdf-parse');

/**
 * Extract text from PDF buffer
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Promise<{text: string, pages: number}>}
 */
async function extractTextFromPDF(pdfBuffer) {
  try {
    const data = await PDFParse(pdfBuffer);
    return {
      text: data.text,
      pages: data.numpages,
      info: data.info
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF: ' + error.message);
  }
}

/**
 * Parse invoice text and convert to structured data
 * This is a basic parser that looks for common patterns
 * @param {string} text - Extracted PDF text
 * @returns {Object} Parsed invoice data
 */
function parseInvoiceText(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  const invoiceData = {
    rawText: text,
    lines: lines,
    header: {},
    items: []
  };

  // Common invoice header patterns
  const patterns = {
    invoiceNumber: /invoice\s*(?:no|number|#)?[:\s]+([A-Z0-9\-]+)/i,
    invoiceDate: /(?:invoice\s*)?date[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}\s+\w+\s+'\d{2}|\d{1,2}\s+\w+\s+\d{4})/i,
    deliveryNumber: /delivery\s*(?:no|number|#)?[:\s]+([A-Z0-9\-]+)/i,
    total: /total[:\s]+[£$€]?\s*(\d+[,.]?\d*\.?\d{2})/i,
    subtotal: /sub\s*total[:\s]+[£$€]?\s*(\d+[,.]?\d*\.?\d{2})/i,
    vat: /vat[:\s]+[£$€]?\s*(\d+[,.]?\d*\.?\d{2})/i
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

  // Try to identify table-like structures (line items)
  // Look for lines with numbers and prices
  const itemPattern = /^(.+?)\s+(\d+(?:\.\d{1,2})?)\s+[£$€]?\s*(\d+[,.]?\d*\.?\d{2})/;

  for (const line of lines) {
    const match = line.match(itemPattern);
    if (match) {
      invoiceData.items.push({
        description: match[1].trim(),
        quantity: match[2],
        price: match[3]
      });
    }
  }

  return invoiceData;
}

/**
 * Convert extracted invoice data to CSV-like structure
 * @param {Object} invoiceData - Parsed invoice data
 * @returns {Array<Array<string>>} CSV-like array structure
 */
function convertToTableFormat(invoiceData) {
  if (!invoiceData.items || invoiceData.items.length === 0) {
    // Return raw lines as single-column data if no items detected
    return [
      ['Raw Text'],
      ...invoiceData.lines.slice(0, 50).map(line => [line])
    ];
  }

  // Create table with detected items
  const headers = ['Description', 'Quantity', 'Price'];
  const rows = invoiceData.items.map(item => [
    item.description,
    item.quantity,
    item.price
  ]);

  return [headers, ...rows];
}

module.exports = {
  extractTextFromPDF,
  parseInvoiceText,
  convertToTableFormat
};
