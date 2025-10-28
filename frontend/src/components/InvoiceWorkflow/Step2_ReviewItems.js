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
 *   - Category header includes: chevron, checkbox (select all), name, item count, subtotal
 *   - Custom checkbox styling (blue checked, white unchecked)
 *   - Item list with: checkbox, code, name, pack size, quantity editor, price
 *   - Dynamic subtotals updated in real-time as items selected/modified
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

import React, { useState, useMemo, useEffect } from 'react';
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
  align-items: center;
  gap: 12px;
  user-select: none;
  transition: background 0.2s;

  &:hover {
    background: #e9ecef;
  }

  &.expanded {
    background: #007bff;
    color: white;
  }
`;

const CategoryTitleText = styled.span`
  font-weight: 600;
  font-size: 15px;
  color: inherit;
`;

const CategoryStats = styled.span`
  color: #666;
  font-size: 13px;
  font-weight: 400;
  margin-left: auto;

  ${CategoryHeaderButton}.expanded & {
    color: white;
  }
`;

const ExpandIcon = styled.span`
  font-size: 18px;
  transition: transform 0.2s;
  color: #666;
  flex-shrink: 0;

  ${CategoryHeaderButton}.expanded & {
    transform: rotate(180deg);
    color: white;
  }
`;

const CategoryCheckboxWrapper = styled.div`
  position: relative;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  cursor: pointer;
`;

const CategoryHiddenCheckbox = styled.input`
  position: absolute;
  opacity: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
  margin: 0;

  &:checked ~ label {
    background: white;
    border-color: white;
  }
`;

const CategoryCheckboxLabel = styled.label`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #dee2e6;
  border: 2px solid #dee2e6;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  user-select: none;

  &::after {
    content: '✓';
    color: #007bff;
    font-size: 14px;
    font-weight: bold;
    display: ${props => props.$isChecked ? 'block' : 'none'};
  }

  ${CategoryHeaderButton}.expanded & {
    background: rgba(255, 255, 255, 0.2);
    border-color: white;
  }

  ${CategoryHeaderButton}.expanded &::after {
    color: white;
  }
`;

const ItemsList = styled.div`
  display: flex;
  flex-direction: column;

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
  border-bottom: 1px solid #dee2e6;

  &:last-child {
    border-bottom: none;
  }

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

const AutoUncheckBadge = styled.span`
  font-size: 11px;
  background: #fff3cd;
  border: 1px solid #ffc107;
  color: #856404;
  padding: 2px 8px;
  border-radius: 12px;
  white-space: nowrap;
  margin-left: 8px;
  font-weight: 500;
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
  parsedItems,
  itemCheckboxes,
  detectedSupplier,
  invoiceMetadata,
  venueId,
  onItemCheckboxChange,
  onComplete,
  onBack,
}) => {
  // ========== STATE ==========

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

  // Track which items were auto-unchecked due to progressive learning
  const [autoUncheckedItems, setAutoUncheckedItems] = useState(new Set());

  // Track items that are in the DB ignore list (for filtering later)
  const [dbIgnoredSkus, setDbIgnoredSkus] = useState(new Set());

  // Track dialog state for handling re-checked items
  const [recheckDialog, setRecheckDialog] = useState(null);

  // ========== PROGRESSIVE LEARNING: Load and auto-uncheck ignored items ==========

  useEffect(() => {
    // Only run if we have venue, supplier, and parsed items
    if (!venueId || !detectedSupplier?.id || parsedItems.length === 0) {
      return;
    }

    const loadIgnoredItems = async () => {
      try {
        const response = await fetch(
          `/api/venue-ignore/list?venueId=${venueId}&supplierId=${detectedSupplier.id}`
        );

        if (!response.ok) {
          console.error('Failed to load ignored items:', response.statusText);
          return;
        }

        const data = await response.json();

        if (data.success && data.items && data.items.length > 0) {
          // Create a Set of supplier SKUs that should be auto-unchecked
          const ignoredSkus = new Set(data.items.map(item => item.supplier_sku));

          // Find items in parsedItems that match ignored SKUs and uncheck them
          const itemsToUncheck = [];
          const uncheckedSet = new Set();

          parsedItems.forEach((item, idx) => {
            if (ignoredSkus.has(item.supplierSku)) {
              itemsToUncheck.push(idx);
              uncheckedSet.add(`${item.categoryHeader}-${item.supplierSku}`);
            }
          });

          // Apply the unchecking via callback
          itemsToUncheck.forEach(idx => {
            onItemCheckboxChange(idx, false);
          });

          // Track which items were auto-unchecked for visual indication
          setAutoUncheckedItems(uncheckedSet);

          // Also track the SKUs that are in DB (for filtering Step 3 later)
          setDbIgnoredSkus(ignoredSkus);

          console.log(
            `Progressive learning: Auto-unchecked ${itemsToUncheck.length} items from saved ignore list`
          );
        }
      } catch (err) {
        console.error('Error loading ignored items for progressive learning:', err);
      }
    };

    loadIgnoredItems();
  }, [venueId, detectedSupplier?.id, parsedItems]);

  // Convert itemCheckboxes from index-based to category-SKU based for internal use
  // Using useMemo to recalculate whenever itemCheckboxes changes
  const selectedItems = useMemo(() => {
    const selected = {};
    parsedItems.forEach((item, idx) => {
      const key = `${item.categoryHeader}-${item.supplierSku}`;
      selected[key] = itemCheckboxes[idx] !== false; // Default to true if not set
    });
    return selected;
  }, [parsedItems, itemCheckboxes]);

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
    const itemIndex = parsedItems.findIndex(item => `${item.categoryHeader}-${item.supplierSku}` === key);
    if (itemIndex !== -1) {
      onItemCheckboxChange(itemIndex, !itemCheckboxes[itemIndex]);
    }
  };

  const handleToggleAll = (category, selectAll) => {
    // Get items for this category from the already-computed categorizedItems
    const itemsInCategory = categorizedItems[category];

    if (itemsInCategory && itemsInCategory.length > 0) {
      // Find the indices of all items in this category from parsedItems
      itemsInCategory.forEach(item => {
        const itemIndex = parsedItems.findIndex(
          pItem => pItem.categoryHeader === item.categoryHeader && pItem.supplierSku === item.supplierSku
        );
        if (itemIndex !== -1) {
          onItemCheckboxChange(itemIndex, selectAll);
        }
      });
    }
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

  const handleProceed = async () => {
    // Find items that are in DB-ignored list but are now CHECKED (re-checked items)
    const recheckedItems = [];

    parsedItems.forEach((item, idx) => {
      // If item is in DB ignore list AND is now checked
      if (dbIgnoredSkus.has(item.supplierSku) && itemCheckboxes[idx] === true) {
        recheckedItems.push({
          index: idx,
          supplierSku: item.supplierSku,
          name: item.supplierName,
          category: item.categoryHeader
        });
      }
    });

    // If there are re-checked items, show dialog to ask user
    if (recheckedItems.length > 0) {
      setRecheckDialog({
        items: recheckedItems,
        decisions: {} // Will track user decisions
      });
      return; // Don't proceed yet, wait for dialog response
    }

    // No re-checked items, proceed normally
    onComplete(itemCheckboxes);
  };

  const handleRecheckDecision = async (decision) => {
    // decision: { supplierSku: 'remove' | 'include' }
    try {
      // Process deletions for items user chose "Remove permanently"
      const deletionPromises = [];

      Object.entries(decision).forEach(([supplierSku, action]) => {
        if (action === 'remove') {
          // Call delete API
          deletionPromises.push(
            fetch('/api/venue-ignore/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                venueId,
                supplierId: detectedSupplier.id,
                supplierSku
              })
            })
          );
        }
      });

      // Wait for all deletions to complete
      await Promise.all(deletionPromises);

      // Close dialog and proceed
      setRecheckDialog(null);
      onComplete(itemCheckboxes);
    } catch (error) {
      console.error('Error processing recheck decisions:', error);
      alert('Error processing your selections. Please try again.');
    }
  };

  // ========== RENDER ==========

  return (
    <Container>
      <Title>Review Invoice Items</Title>

      <InvoiceHeader>
        Invoice #{invoiceMetadata.invoiceNumber || 'N/A'} | Date: {invoiceMetadata.invoiceDate ? new Date(invoiceMetadata.invoiceDate).toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'N/A'} | Supplier: {detectedSupplier?.name || 'Unknown'}
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
                <ExpandIcon className="expand-icon">▼</ExpandIcon>

                <CategoryCheckboxWrapper onClick={(e) => e.stopPropagation()}>
                  <CategoryHiddenCheckbox
                    type="checkbox"
                    id={`cat-${category}`}
                    checked={isAllSelected}
                    onChange={() => handleToggleAll(category, !isAllSelected)}
                  />
                  <CategoryCheckboxLabel htmlFor={`cat-${category}`} $isChecked={isAllSelected} />
                </CategoryCheckboxWrapper>

                <CategoryTitleText>{category}</CategoryTitleText>
                <CategoryStats>
                  ({selectedCount}/{items.length} items, £{categorySubtotal.toFixed(2)})
                </CategoryStats>
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ItemName>{item.supplierName}</ItemName>
                            {autoUncheckedItems.has(key) && (
                              <AutoUncheckBadge title="This item was automatically unchecked from your saved ignore list">
                                Auto-ignored
                              </AutoUncheckBadge>
                            )}
                          </div>
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
          <Button className="secondary" onClick={onBack}>
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

      {/* Dialog for handling re-checked items */}
      {recheckDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>
              Previously Ignored Items
            </h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              The following items were previously marked as ignored. What would you like to do with them?
            </p>

            {recheckDialog.items.map((item) => (
              <div key={item.supplierSku} style={{
                background: '#f9f9f9',
                padding: '15px',
                marginBottom: '15px',
                borderRadius: '6px',
                borderLeft: '4px solid #ffc107'
              }}>
                <div style={{ fontWeight: 600, marginBottom: '8px' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
                  {item.category} • SKU: {item.supplierSku}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => {
                      const newDecisions = { ...recheckDialog.decisions, [item.supplierSku]: 'remove' };
                      setRecheckDialog({ ...recheckDialog, decisions: newDecisions });
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      fontSize: '13px',
                      border: '1px solid #e74c3c',
                      background: '#f8f8f8',
                      color: '#e74c3c',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 500
                    }}
                  >
                    Remove Permanently
                  </button>
                  <button
                    onClick={() => {
                      const newDecisions = { ...recheckDialog.decisions, [item.supplierSku]: 'include' };
                      setRecheckDialog({ ...recheckDialog, decisions: newDecisions });
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      fontSize: '13px',
                      border: '1px solid #27ae60',
                      background: '#f8f8f8',
                      color: '#27ae60',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 500
                    }}
                  >
                    Include This Invoice
                  </button>
                </div>
              </div>
            ))}

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setRecheckDialog(null)}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  border: '1px solid #ddd',
                  background: '#f8f8f8',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleRecheckDecision(recheckDialog.decisions)}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  border: 'none',
                  background: '#667eea',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Confirm Choices
              </button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export default Step2_ReviewItems;
