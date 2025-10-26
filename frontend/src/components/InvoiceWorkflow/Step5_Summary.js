/**
 * ============================================================================
 * STEP 5: FINAL SUMMARY & CONFIRMATION
 * ============================================================================
 *
 * Status: STUB - Waiting for implementation
 *
 * Purpose:
 *   - Show final summary of invoice import
 *   - Display all data to be saved
 *   - Confirm and submit to database
 *   - Show success message and navigation options
 *
 * Display:
 *   - Invoice metadata (number, date, totals)
 *   - Summary of items: checked, ignored, matched
 *   - Breakdown by category (if applicable)
 *   - Final totals
 *   - Confirm button to save everything
 *
 * Backend Operations (on submit):
 *   - Create invoices record
 *   - Create invoice_line_items (checked items only)
 *   - Create/update supplier_item_list (matches)
 *   - Create venue_ignored_items (unchecked items with reasons)
 *
 * Next Steps:
 *   1. Create summary display layout
 *   2. Add final confirmation button
 *   3. Implement database save logic
 * ============================================================================
 */

import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  text-align: center;
  padding: 40px;
  background: #f8f9fa;
  border-radius: 8px;
`;

const Title = styled.h2`
  color: #333;
  margin-bottom: 20px;
`;

const Message = styled.p`
  color: #666;
  font-size: 16px;
`;

const Step5_Summary = ({
  invoiceMetadata,
  parsedItems,
  itemCheckboxes,
  matchedItems,
  ignoredItems,
  ignoreReasons,
  detectedSupplier,
  onSubmit,
  onBack,
  isSubmitting,
}) => {
  return (
    <Container>
      <Title>Step 5: Final Summary & Confirmation</Title>
      <Message>
        This component is a stub and will be implemented after Step 4 is complete.
      </Message>
      <Message>
        <strong>Invoice Number:</strong> {invoiceMetadata?.invoiceNumber || 'N/A'}
      </Message>
      <Message>
        <strong>Total Items:</strong> {parsedItems?.length || 0}
      </Message>
    </Container>
  );
};

export default Step5_Summary;
