/**
 * ============================================================================
 * STEP 2: REVIEW PARSED ITEMS
 * ============================================================================
 *
 * Status: STUB - Waiting for implementation after Step 1 is tested
 *
 * Purpose:
 *   - Display parsed items from PDF
 *   - Show category headers (for Booker)
 *   - Allow user to check/uncheck items (for inclusion in invoice)
 *   - Display supplier detection info
 *
 * User Experience:
 *   - Items listed in same order as PDF
 *   - Category headers expandable/collapsible
 *   - Category header checkbox = select/deselect all items in category
 *   - Individual item checkboxes for fine control
 *   - Preview of invoice totals based on checked items
 *
 * Next Steps:
 *   1. Create item display components
 *   2. Implement category grouping logic
 *   3. Add checkbox state management
 *   4. Handle check/uncheck all functionality
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
  line-height: 1.6;
`;

const Step2_ReviewItems = ({
  parsedItems,
  itemCheckboxes,
  detectedSupplier,
  invoiceMetadata,
  onItemCheckboxChange,
  onComplete,
  onBack,
}) => {
  return (
    <Container>
      <Title>Step 2: Review Parsed Items</Title>
      <Message>
        This component is a stub and will be implemented after Step 1 testing is complete.
      </Message>
      <Message>
        <strong>Supplier Detected:</strong> {detectedSupplier?.name || 'Unknown'}
      </Message>
      <Message>
        <strong>Items to Review:</strong> {parsedItems?.length || 0}
      </Message>
    </Container>
  );
};

export default Step2_ReviewItems;
