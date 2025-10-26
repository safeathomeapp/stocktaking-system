/**
 * ============================================================================
 * STEP 4: MASTER PRODUCT MATCHING
 * ============================================================================
 *
 * Status: STUB - Waiting for implementation
 *
 * Purpose:
 *   - Fuzzy match items to master_products
 *   - Allow manual confirmation of matches
 *   - Show match confidence scores
 *   - Allow creating new master products if no match
 *
 * Flow:
 *   1. For each unmatched item, show fuzzy match suggestions
 *   2. User confirms or selects different match
 *   3. All matches stored in supplier_item_list
 *   4. Ready for Step 5 (final confirmation)
 *
 * Next Steps:
 *   1. Implement fuzzy matching UI
 *   2. Display match suggestions with confidence
 *   3. Add new product creation form
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

const Step4_MasterMatch = ({
  unmatchedItems,
  detectedSupplier,
  onComplete,
  onBack,
}) => {
  return (
    <Container>
      <Title>Step 4: Match to Master Products</Title>
      <Message>
        This component is a stub and will be implemented after Step 3 is complete.
      </Message>
      <Message>
        <strong>Items to match:</strong> {unmatchedItems?.length || 0}
      </Message>
    </Container>
  );
};

export default Step4_MasterMatch;
