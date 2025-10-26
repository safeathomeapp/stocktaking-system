/**
 * ============================================================================
 * STEP 2: REVIEW ITEMS & SELECT
 * ============================================================================
 *
 * Purpose:
 *   - Display parsed invoice items organized by supplier categories
 *   - Allow user to select/deselect items before moving to Step 3
 *   - Adjust quantities if needed
 *   - Show category subtotals that update dynamically
 *   - Preview what will be saved to the system
 *
 * User Experience:
 *   - Invoice header with number, date, supplier name
 *   - Categories with collapse/expand capability
 *   - Custom checkbox styling (blue checked, white unchecked, diagonal for partial)
 *   - Item list with: checkbox, code, name, pack size, quantity editor, price
 *   - Dynamic subtotals per category (updated as items selected/modified)
 *   - Select All / Deselect All buttons per category
 *   - Next button to proceed to Step 3 (Confirm Ignored Items)
 *
 * Data Structure:
 *   - Receives parsedItems from Step 1 (with categoryHeader field)
 *   - Receives invoice metadata (number, date, supplier)
 *   - Manages selection state: { itemId: { selected, quantity } }
 *   - Tracks category expansion state
 *
 * Architecture:
 *   - Parent component manages workflow state
 *   - This component is responsible for item review/selection
 *   - Passes selected items to Step 3 callback
 * ============================================================================
 */

import React, { useState, useMemo } from 'react';
import styled from 'styled-components';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 0;
`;

const Title = styled.h1`
  color: #333;
  font-size: 32px;
  margin: 0;
  text-align: center;
`;

const InvoiceHeader = styled.div`
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  color: #333;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0.5px;
`;

const CategoriesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const CategorySection = styled.div`
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
  background: white;
`;

const CategoryHeaderButton = styled.button`
  background: #f8f9fa;
  padding: 14px 16px;
  width: 100%;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  user-select: none;
  transition: background 0.2s;

  &:hover {
    background: #e9ecef;
  }

  &.expanded {
    background: #007bff;
    color: white;

    .category-title {
      color: white;
    }

    .category-stats {
      color: rgba(255, 255, 255, 0.9);
    }

    .expand-icon {
      color: white;
    }
  }
`;

const CategoryTitle = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  font-weight: 600;
  font-size: 15px;
  color: #333;

  .category-name {
    color: inherit;
  }

  .category-stats {
    color: #666;
    font-size: 13px;
    font-weight: 400;
  }
`;

const ExpandIcon = styled.span`
  font-size: 18px;
  transition: transform 0.2s;
  color: #666;

  ${CategoryHeaderButton}.expanded & {
    transform: rotate(180deg);
    color: white;
  }
`;

const CategoryActions = styled.div`
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-top: 1px solid #dee2e6;
  justify-content: flex-end;
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid #007bff;
  background: white;
  color: #007bff;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f0f7ff;
  }

  &:active {
    transform: translateY(1px);
  }
`;

const ItemsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: #dee2e6;

  &.collapsed {
    display: none;
  }
`;

const ItemRow = styled.div`
  background: white;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: background 0.2s;

  &:hover {
    background: #f8f9fa;
  }

  &.unselected {
    opacity: 0.7;
  }
`;

const CheckboxWrapper = styled.div`
  position: relative;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
`;

const HiddenCheckbox = styled.input`
  position: absolute;
  opacity: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
  margin: 0;

  &:checked ~ label {
    background: #007bff;
    border-color: #007bff;
  }

  &:indeterminate ~ label {
    background: linear-gradient(135deg, #007bff 50%, white 50%);
    border-color: #007bff;
  }
`;

const CheckboxLabel = styled.label`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: white;
  border: 2px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  user-select: none;

  &::after {
    content: '✓';
    color: white;
    font-size: 14px;
    font-weight: bold;
    display: ${props => props.$isChecked ? 'block' : 'none'};
  }
`;

const ItemDetails = styled.div`
  flex: 1;
  display: flex;
  gap: 12px;
  align-items: center;
  min-width: 0;
`;

const ItemCode = styled.span`
  font-family: monospace;
  font-weight: 600;
  color: #007bff;
  font-size: 13px;
  flex-shrink: 0;
`;

const ItemInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ItemName = styled.div`
  font-weight: 500;
  color: #333;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ItemPackSize = styled.div`
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ItemPriceSection = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  flex-shrink: 0;
`;

const QuantityEditor = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 4px 6px;
`;

const QuantityButton = styled.button`
  background: none;
  border: none;
  color: #007bff;
  font-size: 16px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;

  &:hover {
    color: #0056b3;
  }

  &:disabled {
    color: #ccc;
    cursor: not-allowed;
  }
`;

const QuantityInput = styled.input`
  width: 40px;
  text-align: center;
  border: none;
  background: white;
  font-size: 13px;
  font-weight: 600;
  color: #333;
  padding: 2px 0;

  &:focus {
    outline: none;
  }
`;

const ItemPrice = styled.div`
  font-weight: 600;
  color: #333;
  font-size: 14px;
  white-space: nowrap;
  min-width: 60px;
  text-align: right;
`;

const CategorySubtotal = styled.div`
  background: #f8f9fa;
  padding: 12px 16px;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #333;

  .subtotal-label {
    font-weight: 500;
  }

  .subtotal-amount {
    font-weight: 600;
    color: #007bff;
  }
`;

const BottomSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 2px solid #dee2e6;
`;

const InvoiceTotals = styled.div`
  display: flex;
  gap: 24px;
  font-size: 15px;
  color: #333;

  .total-item {
    display: flex;
    gap: 8px;

    .label {
      font-weight: 500;
      color: #666;
    }

    .value {
      font-weight: 600;
      color: #333;
    }
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
`;

const Button = styled.button`
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;

  &.primary {
    background: #007bff;
    color: white;

    &:hover:not(:disabled) {
      background: #0056b3;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
    }

    &:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
  }

  &.secondary {
    background: white;
    color: #007bff;
    border: 2px solid #007bff;

    &:hover:not(:disabled) {
      background: #f8f9ff;
    }

    &:disabled {
      border-color: #ccc;
      color: #ccc;
      cursor: not-allowed;
    }
  }
`;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const Step2_ReviewItems = ({
  invoiceNumber,
  invoiceDate,
  supplierName,
  parsedItems,
  onProceedToStep3,
}) => {
  // ========== STATE ==========

  // Track selected items: { "CATEGORY-SKU": true/false }
  const [selectedItems, setSelectedItems] = useState(() => {
    const initial = {};
    parsedItems.forEach(item => {
      initial[`${item.categoryHeader}-${item.supplierSku}`] = true;
    });
    return initial;
  });

  // Track quantities: { "CATEGORY-SKU": quantity }
  const [quantities, setQuantities] = useState({});

  // Track expanded categories: { "CATEGORY": true/false }
  const [expandedCategories, setExpandedCategories] = useState(() => {
    const initial = {};
    const categories = [...new Set(parsedItems.map(item => item.categoryHeader))];
    categories.forEach(cat => {
      initial[cat] = true; // All expanded by default
    });
    return initial;
  });

  // ========== COMPUTED VALUES ==========

  // Group items by category
  const categorizedItems = useMemo(() => {
    const grouped = {};
    parsedItems.forEach(item => {
      if (!grouped[item.categoryHeader]) {
        grouped[item.categoryHeader] = [];
      }
      grouped[item.categoryHeader].push(item);
    });
    return grouped;
  }, [parsedItems]);

  // Calculate totals
  const { totalSelected, grandTotal } = useMemo(() => {
    let selected = 0;
    let grand = 0;

    parsedItems.forEach(item => {
      const key = `${item.categoryHeader}-${item.supplierSku}`;
      if (selectedItems[key]) {
        const qty = quantities[key] !== undefined ? quantities[key] : item.quantity;
        selected++;
        grand += item.unitPrice * qty;
      }
    });

    return { totalSelected: selected, grandTotal: grand };
  }, [parsedItems, selectedItems, quantities]);

  // ========== HANDLERS ==========

  const handleToggleItem = (key) => {
    setSelectedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleToggleAll = (category, selectAll) => {
    setSelectedItems(prev => {
      const updated = { ...prev };
      categorizedItems[category].forEach(item => {
        updated[`${category}-${item.supplierSku}`] = selectAll;
      });
      return updated;
    });
  };

  const handleQuantityChange = (key, newQuantity) => {
    setQuantities(prev => ({
      ...prev,
      [key]: newQuantity
    }));
  };

  const handleToggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleProceed = () => {
    // Build list of selected items with their updated quantities
    const selectedItemsData = parsedItems
      .filter(item => selectedItems[`${item.categoryHeader}-${item.supplierSku}`])
      .map(item => ({
        ...item,
        quantity: quantities[`${item.categoryHeader}-${item.supplierSku}`] !== undefined
          ? quantities[`${item.categoryHeader}-${item.supplierSku}`]
          : item.quantity
      }));

    onProceedToStep3(selectedItemsData);
  };

  // ========== RENDER ==========

  return (
    <Container>
      <Title>Review Invoice Items</Title>

      <InvoiceHeader>
        Invoice #{invoiceNumber} | Date: {invoiceDate} | Supplier: {supplierName}
      </InvoiceHeader>

      <CategoriesContainer>
        {Object.entries(categorizedItems).map(([category, items]) => {
          const selectedCount = items.filter(item => selectedItems[`${category}-${item.supplierSku}`]).length;
          const categorySubtotal = items.reduce((sum, item) => {
            const key = `${category}-${item.supplierSku}`;
            if (selectedItems[key]) {
              const qty = quantities[key] || item.quantity;
              return sum + (item.unitPrice * qty);
            }
            return sum;
          }, 0);

          const isExpanded = expandedCategories[category];
          const isAllSelected = items.length > 0 && items.every(item => selectedItems[`${category}-${item.supplierSku}`]);

          return (
            <CategorySection key={category}>
              <CategoryHeaderButton
                onClick={() => handleToggleCategory(category)}
                className={isExpanded ? 'expanded' : ''}
              >
                <CategoryTitle>
                  <ExpandIcon className="expand-icon">▼</ExpandIcon>
                  <span className="category-name">{category}</span>
                  <span className="category-stats">
                    ({selectedCount}/{items.length} items, £{categorySubtotal.toFixed(2)})
                  </span>
                </CategoryTitle>
              </CategoryHeaderButton>

              <ItemsList className={!isExpanded ? 'collapsed' : ''}>
                {items.map((item) => {
                  const key = `${category}-${item.supplierSku}`;
                  const isSelected = selectedItems[key];
                  const qty = quantities[key] !== undefined ? quantities[key] : item.quantity;
                  const itemTotal = item.unitPrice * qty;

                  return (
                    <ItemRow key={key} className={!isSelected ? 'unselected' : ''}>
                      <CheckboxWrapper>
                        <HiddenCheckbox
                          type="checkbox"
                          id={key}
                          checked={isSelected}
                          onChange={() => handleToggleItem(key)}
                        />
                        <CheckboxLabel htmlFor={key} $isChecked={isSelected} />
                      </CheckboxWrapper>

                      <ItemDetails>
                        <ItemCode>{item.supplierSku}</ItemCode>
                        <ItemInfo>
                          <ItemName>{item.supplierName}</ItemName>
                          <ItemPackSize>{item.packSize} ({item.unitSize})</ItemPackSize>
                        </ItemInfo>
                      </ItemDetails>

                      <ItemPriceSection>
                        <QuantityEditor>
                          <QuantityButton
                            onClick={() => handleQuantityChange(key, Math.max(1, qty - 1))}
                            disabled={!isSelected || qty <= 1}
                          >
                            −
                          </QuantityButton>
                          <QuantityInput
                            type="number"
                            min="1"
                            value={qty}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1;
                              handleQuantityChange(key, Math.max(1, val));
                            }}
                            disabled={!isSelected}
                          />
                          <QuantityButton
                            onClick={() => handleQuantityChange(key, qty + 1)}
                            disabled={!isSelected}
                          >
                            +
                          </QuantityButton>
                        </QuantityEditor>
                        <ItemPrice>£{itemTotal.toFixed(2)}</ItemPrice>
                      </ItemPriceSection>
                    </ItemRow>
                  );
                })}
              </ItemsList>

              {isExpanded && (
                <>
                  <CategoryActions>
                    <ActionButton onClick={() => handleToggleAll(category, !isAllSelected)}>
                      {isAllSelected ? 'Deselect All' : 'Select All'}
                    </ActionButton>
                  </CategoryActions>

                  <CategorySubtotal>
                    <span className="subtotal-label">Category Subtotal:</span>
                    <span className="subtotal-amount">£{categorySubtotal.toFixed(2)}</span>
                  </CategorySubtotal>
                </>
              )}
            </CategorySection>
          );
        })}
      </CategoriesContainer>

      <BottomSection>
        <InvoiceTotals>
          <div className="total-item">
            <span className="label">Items Selected:</span>
            <span className="value">{totalSelected} of {parsedItems.length}</span>
          </div>
          <div className="total-item">
            <span className="label">Subtotal:</span>
            <span className="value">£{grandTotal.toFixed(2)}</span>
          </div>
        </InvoiceTotals>

        <ButtonGroup>
          <Button className="secondary" onClick={() => window.history.back()}>
            ← Back
          </Button>
          <Button
            className="primary"
            onClick={handleProceed}
            disabled={totalSelected === 0}
          >
            Next: Confirm Items →
          </Button>
        </ButtonGroup>
      </BottomSection>
    </Container>
  );
};

export default Step2_ReviewItems;
