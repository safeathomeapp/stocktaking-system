# Step 1: Upload & Supplier Detection - Design Document

## Overview

Step 1 is the entry point to the invoice import workflow. Users upload a supplier invoice PDF, and the system automatically detects which supplier provided the invoice. This sets the foundation for the entire 5-step import process.

## Workflow Position

```
🚀 START HERE
    ↓
Step 1: Upload & Detect Supplier ← YOU ARE HERE
    ↓
Step 2: Review & Select Items (with progressive learning)
    ↓
Step 3: Confirm Ignored Items & Record Reasons
    ↓
Step 4: Match to Master Products (manual review)
    ↓
Step 5: Final Summary & Save to Database
```

## Architecture

### Two-Layer Supplier Detection System

The system uses two layers to reliably identify suppliers:

#### Layer 1: Fast Keyword Matching (50ms)
- **Component**: `MainSupplierMatcher`
- **Process**: Scans all suppliers in database for keywords
- **Output**: Top 5 candidates ranked by confidence score
- **Scales**: Handles 100+ suppliers with constant performance

#### Layer 2: Parser Validation (100ms)
- **Process**: Validates top 3 candidates with detailed parsing
- **Each parser**: Performs supplier-specific checks
- **Output**: Best match by confidence score
- **Total time**: ~250ms per invoice

**Why two layers?**
- Fast initial screening eliminates most non-matches
- Selective validation prevents false positives
- Total process is still <300ms for any supplier

### Component Props Interface

**Step1_Upload receives:**

```javascript
{
  // Callbacks for parent component
  onUploadComplete: (file, pdfText, supplier, items, metadata) => void,

  // Venue context (optional - for pre-filtering suppliers)
  venueId: "UUID or null"
}
```

**onUploadComplete callback sends:**

```javascript
{
  file: File,                    // The uploaded PDF file object

  pdfText: "...",                // Raw extracted text from PDF

  supplier: {
    id: "74f1b14b-...",          // UUID of supplier in database
    name: "Booker Limited",       // Supplier display name
    confidence: 70,               // Confidence score (1-100)
    detectionMethod: "two-layer"  // How it was detected
  },

  items: [
    {
      supplierSku: "063724",
      supplierName: "Coke Zero 330ml Can",
      categoryHeader: "RETAIL GROCERY",
      packSize: "24x330ml",
      unitSize: "330ml",
      quantity: 1,
      unitPrice: 4.25,
      rrp: 5.99,
      lineTotal: 4.25,
      vatCode: "B",
      vatRate: 20
    },
    // ... more items
  ],

  metadata: {
    invoiceNumber: "3596857",
    invoiceDate: "2025-05-01",
    totalAmount: 1245.67,
    subtotal: 1204.50,
    vatTotal: 41.17
  }
}
```

## UI Layout

```
┌────────────────────────────────────────────────────────┐
│  Upload Supplier Invoice                              │
│                                                        │
│  Drag and drop your PDF invoice here                 │
│  or                                                    │
│  [Choose File]                                        │
│                                                        │
│  Supported: PDF files up to 10MB                     │
│  Suppliers: Booker Limited (configured)              │
├────────────────────────────────────────────────────────┤
│  Need help? Supported suppliers: [Help ▼]            │
└────────────────────────────────────────────────────────┘

After upload:

┌────────────────────────────────────────────────────────┐
│  Processing... 🔄                                     │
│  Extracting PDF text...                              │
│  Detecting supplier...                                │
│  Parsing invoice items...                             │
│                                                        │
│  (Progress bar showing 3 steps)                       │
└────────────────────────────────────────────────────────┘

Success:

┌────────────────────────────────────────────────────────┐
│  ✅ Invoice Detected Successfully                      │
│                                                        │
│  Supplier: Booker Limited (70% confidence)           │
│  Invoice: #3596857 | Date: 01/05/2025               │
│  Items Parsed: 58 items                              │
│  Total Amount: £1,245.67                             │
│                                                        │
│  [← Back]  [Next: Review Items →]                    │
└────────────────────────────────────────────────────────┘

Error:

┌────────────────────────────────────────────────────────┐
│  ❌ Could Not Detect Supplier                          │
│                                                        │
│  The system couldn't identify which supplier this     │
│  invoice is from. Please check:                       │
│                                                        │
│  • File is a valid supplier invoice PDF              │
│  • Supplier is in the system (Booker Limited)        │
│                                                        │
│  [← Back]  [Try Another File]                        │
└────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Drag-and-Drop File Upload

- **Drag zone**: Highlight area where users can drag PDFs
- **File picker**: Traditional file selection button
- **Accepted formats**: PDF only
- **File size limit**: 10MB max
- **Visual feedback**: Hover effects, drop zone highlighting

### 2. PDF Text Extraction

- **Library**: PDFParse (Node.js backend)
- **Processing**: Runs on backend server
- **Speed**: <100ms for typical invoices
- **Error handling**: Returns error if PDF unreadable

### 3. Supplier Detection

**Success conditions:**
- Supplier identified with ≥60% confidence
- System has a parser for this supplier
- Parser successfully validates supplier format

**Failure conditions:**
- No supplier keywords found
- Multiple suppliers match equally
- Supplier has no parser configured
- PDF is corrupt or unreadable

### 4. Invoice Parsing

- **Per-supplier parsers**: Custom logic for each supplier format
- **Booker parser**: Extracts:
  - Invoice metadata (number, date, totals)
  - Line items grouped by category
  - Item details (SKU, name, quantity, pricing)
- **Error handling**: Partial parsing with warnings if some items fail

### 5. Progress Indication

- Show processing stages:
  - Extracting text
  - Detecting supplier
  - Parsing items
- Visual progress bar (3 steps)
- Estimated time remaining

## Workflow Integration

### From InvoiceWorkflow Perspective

```javascript
// Step 1 handler in InvoiceWorkflow
const handleUploadComplete = (file, pdfText, supplier, items, metadata) => {
  setUploadedFile(file);
  setRawPdfText(pdfText);
  setDetectedSupplier(supplier);
  setParsedItems(items);
  setInvoiceMetadata(metadata);

  // Move to Step 2
  setCurrentStep(2);
};
```

### State Passed to Step 2

```javascript
{
  parsedItems: [58 items],
  detectedSupplier: { id, name, confidence },
  invoiceMetadata: { invoiceNumber, invoiceDate, totals }
}
```

## API Endpoint

### POST /api/invoices/parse

**Purpose**: Upload and parse invoice PDF

**Request:**
```javascript
POST http://localhost:3005/api/invoices/parse
Content-Type: multipart/form-data

Body:
  file: [PDF file]
  venueId: [optional UUID for context]
```

**Success Response (200):**
```javascript
{
  success: true,
  supplier: {
    id: "74f1b14b-6020-4575-a23c-2ff7a4a6f7d2",
    name: "Booker Limited",
    confidence: 70,
    detectionMethod: "two-layer"
  },
  parsedItems: [
    {
      supplierSku: "063724",
      supplierName: "Coke Zero 330ml Can",
      categoryHeader: "RETAIL GROCERY",
      // ... full item details
    },
    // ... 57 more items
  ],
  metadata: {
    invoiceNumber: "3596857",
    invoiceDate: "2025-05-01",
    totalAmount: 1245.67,
    subtotal: 1204.50,
    vatTotal: 41.17
  },
  rawText: "Full extracted PDF text..."
}
```

**Error Response (400):**
```javascript
{
  success: false,
  error: "Could not detect supplier from PDF",
  suggestion: "Ensure the PDF is a valid supplier invoice from a supported supplier"
}
```

## Error Handling

### Upload Errors

1. **No file selected**
   - Message: "Please select a PDF file"
   - Action: Let user try again

2. **Invalid file type**
   - Message: "Only PDF files are supported"
   - Action: Let user select different file

3. **File too large**
   - Message: "File exceeds 10MB limit"
   - Action: Let user select smaller file

### Parsing Errors

1. **PDF extraction fails**
   - Message: "Could not read PDF. File may be corrupted or encrypted"
   - Action: Let user try different file

2. **Supplier not detected**
   - Message: "Could not identify supplier. Ensure PDF is from a supported supplier"
   - Suggestion: Show list of supported suppliers
   - Action: Let user try different file

3. **Parser validation fails**
   - Message: "PDF format doesn't match expected structure"
   - Action: Let user try different file from same supplier

4. **Network error**
   - Message: "Server error processing PDF. Please try again"
   - Action: Retry request with exponential backoff

## Testing Scenarios

1. **Happy Path**: Upload valid Booker invoice → Detect supplier → Parse items → Proceed
2. **Unknown Supplier**: Upload invoice from unknown supplier → Show error → Let user retry
3. **Corrupted PDF**: Upload unreadable PDF → Show error → Let user retry
4. **Large File**: Upload 15MB PDF → Show file size error → Let user retry
5. **Network Timeout**: Server slow to respond → Show timeout error → Let user retry
6. **Multiple Suppliers**: If future system has ambiguity → Pick highest confidence → Proceed

## Performance Characteristics

| Operation | Time | Notes |
|-----------|------|-------|
| PDF text extraction | ~100ms | Via PDFParse library |
| Supplier detection (Layer 1) | ~50ms | Keyword matching |
| Supplier detection (Layer 2) | ~100ms | Parser validation |
| Item parsing | ~50ms | Per-supplier parser |
| **Total (end-to-end)** | **~250ms** | Usually <300ms |

## Supported Suppliers

Currently implemented:
- ✅ **Booker Limited** - Configured and tested

Future:
- 🔲 **Tolchards Ltd** (Wine merchant)
- 🔲 **Other suppliers** (framework supports adding more)

## Implementation Notes

### File: `frontend/src/components/InvoiceWorkflow/Step1_Upload.js`

Key functions:
- `handleDragOver` - Highlight drop zone on drag
- `handleDrop` - Process dropped files
- `handleFileSelect` - Process file picker selection
- `uploadFile` - Send to `/api/invoices/parse` endpoint
- `handleProgress` - Update UI with processing stages

### File: `backend/server.js`

Key endpoint:
- `POST /api/invoices/parse` (Line: ~2000) - Main upload handler

### File: `backend/parsers/bookerParser.js`

Booker-specific logic:
- Extract invoice metadata
- Parse items by category
- Handle Booker-specific formatting quirks

## Future Enhancements

- [ ] Multiple file upload (batch invoices)
- [ ] Drag-drop folder upload
- [ ] Email import (forward invoice to system)
- [ ] Barcode scanning (camera on tablet)
- [ ] Automatic retry for failed uploads
- [ ] Cache detected supplier (same supplier multiple times)
- [ ] Show extracted text for debugging
- [ ] Support for compressed PDFs
