/**
 * ============================================================================
 * STEP 3: CONFIRM IGNORED ITEMS
 * ============================================================================
 *
 * Purpose:
 *   - Show items that user unchecked in Step 2 (candidates for ignoring)
 *   - User can check/uncheck each item
 *   - User can optionally record reason for ignoring
 *   - Checked items are saved to venue_ignored_items table (learning for next time)
 *   - Unchecked items are added back to import list
 *
 * Progressive Learning:
 *   - Items CHECKED in Step 3 → Saved to venue_ignored_items
 *   - Items UNCHECKED in Step 3 → Not saved (user reconsidered, will import)
 *   - On next invoice: Step 2 loads saved items and auto-unchecks them
 *
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const Container = styled.div`
  padding: 40px;
  background: #f8f9fa;
  border-radius: 12px;
`;

const Header = styled.div`
  margin-bottom: 30px;
`;

const Title = styled.h2`
  color: #333;
  margin-bottom: 8px;
  font-size: 24px;
  font-weight: 600;
`;

const Subtitle = styled.p`
  color: #666;
  font-size: 14px;
  margin-bottom: 0;
`;

const InvoiceInfo = styled.div`
  background: white;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  border: 1px solid #e0e0e0;
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const InfoLabel = styled.span`
  color: #999;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
`;

const InfoValue = styled.span`
  color: #333;
  font-size: 14px;
  font-weight: 500;
`;

const ItemsSection = styled.div`
  margin-bottom: 30px;
`;

const ItemsLabel = styled.p`
  color: #666;
  font-size: 14px;
  margin-bottom: 16px;
  font-weight: 500;
`;

const ItemCard = styled.div`
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  transition: all 0.2s ease;

  &:hover {
    border-color: #007bff;
    box-shadow: 0 2px 8px rgba(0, 123, 255, 0.1);
  }
`;

const ItemHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
`;

const Checkbox = styled.input`
  width: 20px;
  height: 20px;
  margin-top: 2px;
  cursor: pointer;
  accent-color: #007bff;
  flex-shrink: 0;

  &:checked {
    background-color: #007bff;
  }
`;

const ItemDetails = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ItemLine = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 13px;
  color: #555;
`;

const ItemLabel = styled.span`
  font-weight: 600;
  color: #333;
`;

const ItemValue = styled.span`
  color: #666;
`;

const Separator = styled.span`
  color: #ccc;
`;

const ReasonLabel = styled.label`
  display: block;
  font-size: 12px;
  color: #999;
  font-weight: 500;
  margin-bottom: 6px;
  margin-top: 12px;
  text-transform: uppercase;
`;

const ReasonInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
  transition: border-color 0.2s ease;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
  }

  &::placeholder {
    color: #bbb;
  }
`;

const SummarySection = styled.div`
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
`;

const SummaryTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 16px;
  color: #333;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
`;

const SummaryItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 14px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SummaryIcon = styled.span`
  font-size: 18px;
  width: 24px;
  text-align: center;
`;

const SummaryText = styled.span`
  color: #555;

  strong {
    color: #333;
    font-weight: 600;
  }
`;

const ButtonSection = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-start;
  flex-wrap: wrap;
`;

const Button = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const BackButton = styled(Button)`
  background: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;

  &:hover:not(:disabled) {
    background: #e8e8e8;
  }
`;

const SubmitButton = styled(Button)`
  background: #28a745;
  color: white;

  &:hover:not(:disabled) {
    background: #218838;
  }
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Spinner = styled.div`
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

// ============================================================================
// COMPONENT
// ============================================================================

const Step3_IgnoreItems = ({
  ignoredItems = [],
  ignoreReasons = {},
  detectedSupplier = {},
  invoiceMetadata = {},
  venueId,
  onReasonChange,
  onComplete,
  onBack,
}) => {
  // Initialize all state variables FIRST before useEffects
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [dbIgnoredSkus, setDbIgnoredSkus] = useState(new Set());
  const [filteredItems, setFilteredItems] = useState(ignoredItems);

  const [checkboxState, setCheckboxState] = useState(() => {
    const state = {};
    filteredItems.forEach((_, idx) => {
      state[idx] = true; // All items start as checked (will be ignored)
    });
    return state;
  });

  // Re-initialize checkbox state when filtered items change
  useEffect(() => {
    const state = {};
    filteredItems.forEach((_, idx) => {
      state[idx] = checkboxState[idx] !== undefined ? checkboxState[idx] : true;
    });
    setCheckboxState(state);
  }, [filteredItems]);

  // Load DB-ignored items and filter them out from display
  useEffect(() => {
    const loadAndFilterItems = async () => {
      try {
        // Load items from DB
        const response = await fetch(
          `/api/venue-ignore/list?venueId=${venueId}&supplierId=${detectedSupplier?.id}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.items) {
            // Create Set of DB-ignored SKUs
            const dbSkus = new Set(data.items.map(item => item.supplier_sku));
            setDbIgnoredSkus(dbSkus);

            // Filter out items that are already in DB
            const newItems = ignoredItems.filter(item => !dbSkus.has(item.supplierSku));
            setFilteredItems(newItems);
          }
        }
      } catch (err) {
        console.error('Error loading DB-ignored items:', err);
        // If error, just show all items
        setFilteredItems(ignoredItems);
      }
    };

    if (venueId && detectedSupplier?.id && ignoredItems.length > 0) {
      loadAndFilterItems();
    }
  }, [venueId, detectedSupplier?.id, ignoredItems]);

  // Count items
  const checkedCount = Object.values(checkboxState).filter(v => v).length;
  const uncheckedCount = filteredItems.length - checkedCount;

  // Handle checkbox toggle
  const handleCheckboxChange = (idx, checked) => {
    setCheckboxState(prev => ({
      ...prev,
      [idx]: checked
    }));
  };

  // Handle save & continue
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Get checked items (items to ignore) from filteredItems only
      const itemsToIgnore = filteredItems
        .filter((_, idx) => checkboxState[idx])
        .map((item, idx) => ({
          supplierSku: item.supplierSku,
          productName: item.supplierName,
          unitSize: item.unitSize || null,
          reason: ignoreReasons[idx] || null
        }));

      // If there are items to save, call API
      if (itemsToIgnore.length > 0) {
        const response = await fetch('/api/venue-ignore/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            venueId,
            supplierId: detectedSupplier.id,
            invoiceNumber: invoiceMetadata?.invoiceNumber,
            invoiceDate: invoiceMetadata?.invoiceDate,
            items: itemsToIgnore
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save ignored items');
        }

        const result = await response.json();
        console.log('Venue ignore items saved:', result);
      }

      // Update parent state with unchecked items (items to import)
      // Note: Only tracking NEW items (filtered items) - DB items are already managed
      const uncheckedIndices = filteredItems
        .map((_, idx) => idx)
        .filter(idx => !checkboxState[idx]);

      // Call parent callback to proceed to next step
      onComplete(uncheckedIndices);
    } catch (err) {
      console.error('Error saving ignored items:', err);
      setError(err.message || 'Failed to save ignored items. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <Container>
      <Header>
        <Title>✓ Confirm Ignored Items</Title>
        <Subtitle>
          Items your venue doesn't stock. Review and confirm, or uncheck to add back to invoice.
        </Subtitle>
      </Header>

      <InvoiceInfo>
        <InfoItem>
          <InfoLabel>Invoice #</InfoLabel>
          <InfoValue>{invoiceMetadata.invoiceNumber || 'N/A'}</InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>Supplier</InfoLabel>
          <InfoValue>{detectedSupplier.name || 'Unknown'}</InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>Date</InfoLabel>
          <InfoValue>
            {invoiceMetadata.invoiceDate
              ? new Date(invoiceMetadata.invoiceDate).toLocaleDateString('en-GB')
              : 'N/A'}
          </InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>Items to Review</InfoLabel>
          <InfoValue>{filteredItems.length} items</InfoValue>
        </InfoItem>
      </InvoiceInfo>

      {error && (
        <div
          style={{
            background: '#f8d7da',
            border: '1px solid #f5c6cb',
            color: '#721c24',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '24px',
            fontSize: '14px'
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <ItemsSection>
        <ItemsLabel>
          Review each item below. Keep it checked to ignore, or uncheck to import with invoice.
        </ItemsLabel>

        {filteredItems.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#999',
              background: 'white',
              borderRadius: '8px'
            }}
          >
            No items to review. All items from Step 2 have been selected for import.
          </div>
        ) : (
          filteredItems.map((item, idx) => (
            <ItemCard key={idx}>
              <ItemHeader>
                <Checkbox
                  type="checkbox"
                  checked={checkboxState[idx]}
                  onChange={(e) => handleCheckboxChange(idx, e.target.checked)}
                />
                <ItemDetails>
                  <ItemLine>
                    <ItemLabel>{item.supplierSku}</ItemLabel>
                    <Separator>|</Separator>
                    <ItemValue>{item.supplierName}</ItemValue>
                  </ItemLine>
                  <ItemLine>
                    <ItemValue>{item.categoryHeader}</ItemValue>
                    <Separator>|</Separator>
                    <ItemValue>£{parseFloat(item.unitPrice || 0).toFixed(2)}</ItemValue>
                    <Separator>x</Separator>
                    <ItemValue>{item.quantity || 1}</ItemValue>
                    <Separator>=</Separator>
                    <ItemValue>
                      £{(parseFloat(item.unitPrice || 0) * (item.quantity || 1)).toFixed(2)}
                    </ItemValue>
                  </ItemLine>
                </ItemDetails>
              </ItemHeader>

              {!checkboxState[idx] && (
                <div style={{ fontSize: '12px', color: '#999', marginLeft: '32px' }}>
                  (Unchecked - will be imported with invoice)
                </div>
              )}

              <ReasonLabel htmlFor={`reason-${idx}`}>Reason (optional):</ReasonLabel>
              <ReasonInput
                id={`reason-${idx}`}
                type="text"
                placeholder="Why are you ignoring this item?"
                maxLength={500}
                value={ignoreReasons[idx] || ''}
                onChange={(e) => onReasonChange(idx, e.target.value)}
              />
            </ItemCard>
          ))
        )}
      </ItemsSection>

      <SummarySection>
        <SummaryTitle>Summary</SummaryTitle>
        <SummaryItem>
          <SummaryIcon>✓</SummaryIcon>
          <SummaryText>
            Will be ignored (checked): <strong>{checkedCount} items</strong>
            <br />
            <span style={{ fontSize: '12px', color: '#999' }}>
              These will be saved to your ignore list
            </span>
          </SummaryText>
        </SummaryItem>
        <SummaryItem>
          <SummaryIcon>✗</SummaryIcon>
          <SummaryText>
            Being reconsidered (unchecked): <strong>{uncheckedCount} items</strong>
            <br />
            <span style={{ fontSize: '12px', color: '#999' }}>
              These will be imported with the invoice
            </span>
          </SummaryText>
        </SummaryItem>
      </SummarySection>

      <ButtonSection>
        <BackButton onClick={onBack} disabled={isSubmitting}>
          ← Back
        </BackButton>
        <SubmitButton onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save & Continue →'}
        </SubmitButton>
      </ButtonSection>

      {isSubmitting && (
        <LoadingOverlay>
          <Spinner />
        </LoadingOverlay>
      )}
    </Container>
  );
};

export default Step3_IgnoreItems;
