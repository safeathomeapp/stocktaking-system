import React, { useState } from 'react';
import styled from 'styled-components';
import apiService from '../services/apiService';

const ModalOverlay = styled.div`
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
  padding: 2rem;
`;

const ModalContent = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: 12px;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const Title = styled.h2`
  color: ${props => props.theme.colors.text};
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  margin: 0 0 1.5rem 0;
  font-size: 0.95rem;
`;

const VenueInfo = styled.div`
  background: ${props => props.theme.colors.background};
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  border-left: 4px solid ${props => props.theme.colors.primary};
`;

const VenueLabel = styled.span`
  font-weight: 600;
  color: ${props => props.theme.colors.text};
`;

const ItemsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const ItemRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: ${props => props.theme.colors.background};
  border-radius: 6px;
  border: 1px solid ${props => props.theme.colors.border};
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.primaryLight};
    border-color: ${props => props.theme.colors.primary};
  }
`;

const Checkbox = styled.input`
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: ${props => props.theme.colors.primary};
`;

const ItemName = styled.span`
  flex: 1;
  color: ${props => props.theme.colors.text};
  font-weight: 500;
`;

const ItemSku = styled.span`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.85rem;
  background: ${props => props.theme.colors.border};
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
`;

const SelectAllRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: ${props => props.theme.colors.primary}20;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid ${props => props.theme.colors.primary};
`;

const SelectAllCheckbox = styled(Checkbox)``;

const SelectAllLabel = styled.span`
  color: ${props => props.theme.colors.text};
  font-weight: 600;
`;

const ReasonInput = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 6px;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary}30;
  }

  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
  }
`;

const ActionRow = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid ${props => props.theme.colors.border};
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Button)`
  background: ${props => props.theme.colors.border};
  color: ${props => props.theme.colors.text};

  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.textSecondary};
  }
`;

const ConfirmButton = styled(Button)`
  background: ${props => props.theme.colors.primary};
  color: white;

  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.primaryDark || '#0056b3'};
    box-shadow: 0 4px 12px ${props => props.theme.colors.primary}40;
  }
`;

const SkipButton = styled(Button)`
  background: transparent;
  color: ${props => props.theme.colors.textSecondary};
  border: 1px solid ${props => props.theme.colors.border};

  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.background};
  }
`;

const Message = styled.div`
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  background: ${props => {
    if (props.$type === 'info') return `${props.theme.colors.primary}20`;
    if (props.$type === 'success') return `#d4edda`;
    if (props.$type === 'error') return `#f8d7da`;
    return `${props.theme.colors.background}`;
  }};
  color: ${props => {
    if (props.$type === 'info') return props.theme.colors.primary;
    if (props.$type === 'success') return '#155724';
    if (props.$type === 'error') return '#721c24';
    return props.theme.colors.text;
  }};
  border-left: 4px solid ${props => {
    if (props.$type === 'info') return props.theme.colors.primary;
    if (props.$type === 'success') return '#28a745';
    if (props.$type === 'error') return '#dc3545';
    return props.theme.colors.border;
  }};
`;

const IgnoreItemsConfirmation = ({
  uncheckedItems,
  venueName,
  supplierId,
  venueId,
  onConfirm,
  onCancel,
  onSkip,
  isLoading = false
}) => {
  const [selectedItems, setSelectedItems] = useState(
    uncheckedItems.reduce((acc, item, idx) => {
      acc[idx] = true;
      return acc;
    }, {})
  );
  const [selectAll, setSelectAll] = useState(true);
  const [itemReasons, setItemReasons] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    const newSelected = {};
    uncheckedItems.forEach((_, idx) => {
      newSelected[idx] = checked;
    });
    setSelectedItems(newSelected);
  };

  const handleItemToggle = (index) => {
    setSelectedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleReasonChange = (index, reason) => {
    setItemReasons(prev => ({
      ...prev,
      [index]: reason
    }));
  };

  const handleConfirm = async () => {
    const itemsToIgnore = uncheckedItems
      .map((item, idx) => ({
        ...item,
        index: idx
      }))
      .filter(item => selectedItems[item.index]);

    if (itemsToIgnore.length === 0) {
      onSkip();
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const itemsPayload = itemsToIgnore.map(item => ({
        supplierSku: item.sku,
        productName: item.name,
        ignoreReason: itemReasons[item.index] || null
      }));

      const response = await apiService.addVenueIgnoredItems(
        venueId,
        {
          supplierId,
          items: itemsPayload,
          ignoredBy: 'Invoice Review'
        }
      );

      if (response.success) {
        setMessage({
          type: 'success',
          text: `✓ ${itemsToIgnore.length} item(s) added to ignore list for "${venueName}"`
        });

        // Call onConfirm after a short delay to show success message
        setTimeout(() => {
          onConfirm(itemsToIgnore);
        }, 500);
      }
    } catch (error) {
      console.error('Error saving ignored items:', error);
      setMessage({
        type: 'error',
        text: `Error saving ignored items: ${error.message}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCount = Object.values(selectedItems).filter(Boolean).length;

  return (
    <ModalOverlay onClick={onCancel}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <Title>Ignore Items for Future Invoices?</Title>
        <Subtitle>
          These items were not selected. Should they be ignored for this venue in all future invoice imports?
        </Subtitle>

        <VenueInfo>
          <VenueLabel>Venue:</VenueLabel> {venueName}
        </VenueInfo>

        {message && (
          <Message $type={message.type}>
            {message.text}
          </Message>
        )}

        <SelectAllRow>
          <SelectAllCheckbox
            type="checkbox"
            checked={selectAll}
            onChange={(e) => handleSelectAll(e.target.checked)}
            disabled={isSaving}
          />
          <SelectAllLabel>
            Select All ({uncheckedItems.length} items)
          </SelectAllLabel>
        </SelectAllRow>

        <ItemsList>
          {uncheckedItems.map((item, index) => (
            <div key={index}>
              <ItemRow>
                <Checkbox
                  type="checkbox"
                  checked={selectedItems[index] || false}
                  onChange={() => handleItemToggle(index)}
                  disabled={isSaving}
                />
                <ItemName>{item.name}</ItemName>
                <ItemSku>{item.sku}</ItemSku>
              </ItemRow>
              {selectedItems[index] && (
                <ReasonInput
                  type="text"
                  placeholder="Optional reason (e.g., 'Not stocked', 'Cleaning supplies')"
                  value={itemReasons[index] || ''}
                  onChange={(e) => handleReasonChange(index, e.target.value)}
                  disabled={isSaving}
                />
              )}
            </div>
          ))}
        </ItemsList>

        <ActionRow>
          <SkipButton onClick={onSkip} disabled={isSaving}>
            Skip (Don't Ignore)
          </SkipButton>
          <CancelButton onClick={onCancel} disabled={isSaving}>
            Cancel
          </CancelButton>
          <ConfirmButton
            onClick={handleConfirm}
            disabled={isSaving || selectedCount === 0}
          >
            {isSaving ? 'Saving...' : `Ignore ${selectedCount} Item(s)`}
          </ConfirmButton>
        </ActionRow>
      </ModalContent>
    </ModalOverlay>
  );
};

export default IgnoreItemsConfirmation;
