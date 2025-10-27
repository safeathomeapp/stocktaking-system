/**
 * ============================================================================
 * INVOICE WORKFLOW - STEP 5: FINAL SUMMARY & CONFIRMATION
 * ============================================================================
 *
 * Purpose:
 *   Display final summary/scorecard of invoice processing before submission.
 *   Shows all achievements: items imported, items ignored, matches made.
 *   User confirms everything is correct before saving to database.
 */

import React, { useState } from 'react';
import styled from 'styled-components';

const SummaryContainer = styled.div`
  width: 100%;
  animation: fadeIn 0.3s ease-in;
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const SummaryHeader = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
`;

const HeaderTitle = styled.h1`
  margin: 0 0 20px 0;
  font-size: 28px;
  font-weight: 600;
`;

const HeaderGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const HeaderItem = styled.div`
  display: flex;
  flex-direction: column;
  .label {
    font-size: 12px;
    text-transform: uppercase;
    opacity: 0.8;
    margin-bottom: 5px;
  }
  .value {
    font-size: 18px;
    font-weight: 600;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  transition: all 0.3s ease;
  &:hover {
    border-color: #667eea;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
  }
  .stat-number {
    font-size: 32px;
    font-weight: 700;
    color: #667eea;
    margin-bottom: 8px;
  }
  .stat-label {
    font-size: 13px;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  &.total .stat-number {
    color: #333;
  }
  &.imported .stat-number {
    color: #28a745;
  }
  &.ignored .stat-number {
    color: #ffc107;
  }
  &.auto-matched .stat-number {
    color: #17a2b8;
  }
  &.manual-matched .stat-number {
    color: #007bff;
  }
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 30px 0 20px 0;
  padding-bottom: 10px;
  border-bottom: 2px solid #667eea;
`;

const CategorySection = styled.div`
  margin-bottom: 25px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
`;

const CategoryHeader = styled.div`
  background: #f8f9fa;
  padding: 15px 20px;
  font-weight: 600;
  color: #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  &:hover {
    background: #e9ecef;
  }
`;

const CategoryItems = styled.div`
  padding: 0;
`;

const ItemRow = styled.div`
  padding: 15px 20px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  &:last-child {
    border-bottom: none;
  }
  .item-name {
    flex: 1;
    font-weight: 500;
    color: #333;
  }
  .item-status {
    display: flex;
    align-items: center;
    gap: 15px;
  }
  .status-badge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
  }
  .status-badge.auto-match {
    background: #d1ecf1;
    color: #0c5460;
  }
  .status-badge.manual-match {
    background: #d6d8db;
    color: #1c1e22;
  }
  .status-value {
    min-width: 120px;
    font-size: 13px;
    color: #666;
    text-align: right;
  }
`;

const IgnoredItemsSection = styled.div`
  background: #fffbea;
  border: 1px solid #ffc107;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
`;

const IgnoredItemList = styled.div`
  margin-top: 15px;
`;

const IgnoredItem = styled.div`
  background: white;
  padding: 15px;
  border-left: 4px solid #ffc107;
  margin-bottom: 10px;
  border-radius: 4px;
  .item-name {
    font-weight: 600;
    color: #333;
    margin-bottom: 5px;
  }
  .reason {
    font-size: 13px;
    color: #666;
    margin-top: 8px;
    font-style: italic;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 30px;
  justify-content: center;
`;

const Button = styled.button`
  padding: 12px 32px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const BackButton = styled(Button)`
  background: #6c757d;
  color: white;
  &:hover:not(:disabled) {
    background: #5a6268;
  }
`;

const SubmitButton = styled(Button)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #5568d3 0%, #653a8b 100%);
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

const LoadingSpinner = styled.div`
  background: white;
  padding: 30px;
  border-radius: 8px;
  text-align: center;
  .spinner {
    border: 4px solid #f3f3f3;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin: 0 auto 15px;
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const Step5_Summary = ({
  invoiceMetadata = {},
  parsedItems = [],
  itemCheckboxes = {},
  matchedItems = {},
  ignoredItems = [],
  ignoreReasons = {},
  detectedSupplier = {},
  onSubmit = () => {},
  onBack = () => {},
  isSubmitting = false,
}) => {
  const [expandedCategories, setExpandedCategories] = useState({});

  const importedItems = Object.entries(itemCheckboxes)
    .filter(([_, isChecked]) => isChecked)
    .map(([idx, _]) => parseInt(idx));

  const totalImported = importedItems.length;
  const totalIgnored = ignoredItems.length;

  const autoMatchedCount = importedItems.filter(idx => {
    const match = matchedItems[idx];
    return match && match.isAutoMatched;
  }).length;

  const manualMatchedCount = totalImported - autoMatchedCount;

  const groupedByCategory = {};
  parsedItems.forEach((item, idx) => {
    const category = item.categoryHeader || 'Other';
    if (!groupedByCategory[category]) {
      groupedByCategory[category] = [];
    }
    groupedByCategory[category].push({ ...item, index: idx });
  });

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  return (
    <SummaryContainer>
      {isSubmitting && (
        <LoadingOverlay>
          <LoadingSpinner>
            <div className="spinner" />
            <div>Submitting invoice...</div>
          </LoadingSpinner>
        </LoadingOverlay>
      )}

      <SummaryHeader>
        <HeaderTitle>Invoice Summary</HeaderTitle>
        <HeaderGrid>
          <HeaderItem>
            <div className="label">Supplier</div>
            <div className="value">{detectedSupplier?.name || 'Unknown'}</div>
          </HeaderItem>
          <HeaderItem>
            <div className="label">Invoice Number</div>
            <div className="value">{invoiceMetadata?.invoiceNumber || 'N/A'}</div>
          </HeaderItem>
          <HeaderItem>
            <div className="label">Invoice Date</div>
            <div className="value">
              {invoiceMetadata?.invoiceDate
                ? new Date(invoiceMetadata.invoiceDate).toLocaleDateString()
                : 'N/A'}
            </div>
          </HeaderItem>
          <HeaderItem>
            <div className="label">Total Amount</div>
            <div className="value">
              ${(invoiceMetadata?.totalAmount || 0).toFixed(2)}
            </div>
          </HeaderItem>
        </HeaderGrid>
      </SummaryHeader>

      <StatsGrid>
        <StatCard className="total">
          <div className="stat-number">{parsedItems.length}</div>
          <div className="stat-label">Total Items</div>
        </StatCard>
        <StatCard className="imported">
          <div className="stat-number">{totalImported}</div>
          <div className="stat-label">Imported</div>
        </StatCard>
        <StatCard className="ignored">
          <div className="stat-number">{totalIgnored}</div>
          <div className="stat-label">Ignored</div>
        </StatCard>
        <StatCard className="auto-matched">
          <div className="stat-number">{autoMatchedCount}</div>
          <div className="stat-label">Auto-Matched</div>
        </StatCard>
        <StatCard className="manual-matched">
          <div className="stat-number">{manualMatchedCount}</div>
          <div className="stat-label">Manually Matched</div>
        </StatCard>
      </StatsGrid>

      {totalIgnored > 0 && (
        <IgnoredItemsSection>
          <SectionTitle>Items Ignored ({totalIgnored})</SectionTitle>
          <IgnoredItemList>
            {ignoredItems.map((item, idx) => (
              <IgnoredItem key={idx}>
                <div className="item-name">{item.supplierName || item.description}</div>
                <div className="reason">
                  <strong>Reason:</strong> {ignoreReasons[idx] || 'No reason provided'}
                </div>
              </IgnoredItem>
            ))}
          </IgnoredItemList>
        </IgnoredItemsSection>
      )}

      <SectionTitle>Items by Category ({totalImported})</SectionTitle>
      {Object.entries(groupedByCategory).map(([category, items]) => {
        const importedCategoryItems = items.filter(item =>
          itemCheckboxes[item.index] === true
        );

        if (importedCategoryItems.length === 0) return null;

        const isExpanded = expandedCategories[category] !== false;

        return (
          <CategorySection key={category}>
            <CategoryHeader onClick={() => toggleCategory(category)}>
              <div>{category} ({importedCategoryItems.length})</div>
              <div style={{ fontSize: '12px', color: '#999' }}>
                {isExpanded ? '▼' : '▶'}
              </div>
            </CategoryHeader>

            {isExpanded && (
              <CategoryItems>
                {importedCategoryItems.map((item, displayIdx) => {
                  const matchInfo = matchedItems[item.index];
                  const isAutoMatched = matchInfo?.isAutoMatched;

                  return (
                    <ItemRow key={displayIdx}>
                      <div className="item-name">
                        {item.supplierName || item.description}
                      </div>
                      <div className="item-status">
                        <span className={`status-badge ${isAutoMatched ? 'auto-match' : 'manual-match'}`}>
                          {isAutoMatched ? 'Auto-Matched' : 'Manually Matched'}
                        </span>
                        <span className="status-value">
                          {matchInfo?.confidence || 0}% confidence
                        </span>
                      </div>
                    </ItemRow>
                  );
                })}
              </CategoryItems>
            )}
          </CategorySection>
        );
      })}

      <ActionButtons>
        <BackButton onClick={onBack} disabled={isSubmitting}>
          Back to Matching
        </BackButton>
        <SubmitButton onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Confirm & Save Invoice'}
        </SubmitButton>
      </ActionButtons>
    </SummaryContainer>
  );
};

export default Step5_Summary;
