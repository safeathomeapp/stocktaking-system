/**
 * ============================================================================
 * INVOICE API ROUTES
 * ============================================================================
 *
 * Purpose:
 *   Express routes for invoice processing
 *   Handles PDF upload, parsing, and supplier detection
 *
 * Endpoints:
 *   POST /api/invoices/parse
 *     - Upload and parse PDF invoice
 *     - Auto-detect supplier
 *     - Returns parsed items ready for Step 2 (Review)
 *
 * Integration Points:
 *   - Parser registry: Routes PDFs to correct supplier parser
 *   - Database: Queries supplier info, stores results
 *   - Frontend: Receives parsed data for review UI
 *
 * File Handling:
 *   - Uses express-fileupload middleware
 *   - Temporary PDF file stored and deleted after processing
 *   - No file persistence (all data in database)
 *
 * Error Handling:
 *   - Validates file type and size
 *   - Catches PDF parsing errors gracefully
 *   - Returns meaningful error messages to frontend
 * ============================================================================
 */

const express = require('express');
const multer = require('multer');
// pdf-parse v2.2.6 uses PDFParse class (not function)
const { PDFParse } = require('pdf-parse');
const pool = require('../src/database');
const parserRegistry = require('../parsers/parserRegistry');

// ============================================================================
// SETUP
// ============================================================================

const router = express.Router();

// Configure multer for PDF file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only accept PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only PDF files accepted.`));
    }
  },
});

// ============================================================================
// ROUTES
// ============================================================================

/**
 * POST /api/invoices/parse
 *
 * Upload and parse supplier invoice PDF
 *
 * Multipart Form Data:
 *   - file: PDF file
 *   - venueId: UUID of venue (optional, for context)
 *
 * Response: {
 *   success: boolean,
 *   supplier: {
 *     id: string,           // Supplier UUID
 *     name: string,         // Supplier name
 *     confidence: number    // 0-100 detection confidence
 *   },
 *   parsedItems: Array<{
 *     supplierSku: string,
 *     supplierName: string,
 *     packSize?: string,
 *     unitSize?: string,
 *     quantity: number,
 *     unitPrice: number,
 *     nettPrice: number,
 *     lineTotal: number,
 *     categoryHeader?: string
 *   }>,
 *   metadata: {
 *     invoiceNumber: string,
 *     invoiceDate: string,  // ISO format
 *     totalAmount: number,
 *     subtotal: number,
 *     vatTotal: number
 *   },
 *   rawText: string,        // Full PDF text (for debugging)
 *   parserUsed: string,     // Parser type used
 *   notes?: string          // Any parsing notes
 * }
 *
 * Error Response: {
 *   success: false,
 *   error: string,          // Error message
 *   details?: string        // Stack trace in development
 * }
 */
router.post('/parse', upload.single('file'), async (req, res) => {
  try {
    // ========== VALIDATION ==========

    // Check file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided. Please upload a PDF.',
      });
    }

    const file = req.file;

    // Validate file type
    if (file.mimetype !== 'application/pdf') {
      return res.status(400).json({
        success: false,
        error: `Invalid file type. Expected PDF, got ${file.mimetype}`,
      });
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: `File too large (${Math.round(file.size / 1024 / 1024)}MB). Max: 5MB`,
      });
    }

    // Check file is not empty
    if (file.size === 0) {
      return res.status(400).json({
        success: false,
        error: 'File is empty',
      });
    }

    console.log(`\n📄 Processing PDF: ${file.name} (${Math.round(file.size / 1024)}KB)`);

    // ========== PDF EXTRACTION ==========

    let pdfData;
    try {
      // Extract text from PDF using PDFParse class
      // multer stores file data in req.file.buffer
      const parser = new PDFParse({ data: file.buffer });
      const result = await parser.getText();
      pdfData = {
        text: result.text,
        numpages: result.numpages || 1,
      };
      console.log(`✓ Extracted PDF, ${pdfData.text.length} characters`);
    } catch (error) {
      console.error(`PDF parsing error: ${error.message}`);
      return res.status(400).json({
        success: false,
        error: 'Failed to parse PDF. File may be corrupted or protected.',
        details: error.message,
      });
    }

    const rawPdfText = pdfData.text;

    // ========== SUPPLIER DETECTION & PARSING ==========

    try {
      // Use parser registry to detect supplier and parse invoice
      // Pass pool for database-driven supplier detection
      const result = await parserRegistry.parseInvoice(rawPdfText, pool);

      if (!result.success) {
        console.error(`Parse failed: ${result.error}`);
        return res.status(400).json({
          success: false,
          error: result.error || 'Failed to parse invoice',
          details: result.details,
          candidates: result.candidates,
          suggestion: result.suggestion,
        });
      }

      console.log(`✓ Parse successful: ${result.parsedItems.length} items parsed`);
      console.log(`✓ Supplier: ${result.supplier.name} (${result.supplier.confidence}%)`);

      // ========== RESPONSE ==========

      return res.status(200).json({
        success: true,
        supplier: result.supplier,
        parsedItems: result.parsedItems,
        metadata: result.metadata,
        rawText: rawPdfText,
        parserUsed: result.parserUsed,
        notes: result.notes,
      });
    } catch (error) {
      console.error(`Parsing error: ${error.message}`);
      console.error(error.stack);

      return res.status(500).json({
        success: false,
        error: 'Internal parsing error',
        details: error.message,
      });
    }
  } catch (error) {
    console.error(`Unexpected error in /parse endpoint:`, error);

    return res.status(500).json({
      success: false,
      error: 'Unexpected server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = router;
