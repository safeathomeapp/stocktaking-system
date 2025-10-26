/**
 * ============================================================================
 * STEP 3: CONFIRM IGNORED ITEMS
 * ============================================================================
 *
 * Status: STUB - Waiting for implementation
 *
 * Purpose:
 *   - Show items that user unchecked in Step 2
 *   - Ask for confirmation to ignore these items
 *   - Collect optional reason for ignoring each item
 *   - Store ignored items for future use (pre-unchecked next time)
 *
 * Next Steps:
 *   1. Display unchecked items from Step 2
 *   2. Add reason input fields
 *   3. Confirm and save to venue_ignored_items table
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

const Step3_IgnoreItems = ({
  ignoredItems,
  ignoreReasons,
  onReasonChange,
  onComplete,
  onBack,
}) => {
  return (
    <Container>
      <Title>Step 3: Confirm Ignored Items</Title>
      <Message>
        This component is a stub and will be implemented after Step 2 is complete.
      </Message>
      <Message>
        <strong>Items to ignore:</strong> {ignoredItems?.length || 0}
      </Message>
    </Container>
  );
};

export default Step3_IgnoreItems;
