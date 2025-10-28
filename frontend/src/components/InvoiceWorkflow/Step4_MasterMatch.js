/**
 * ============================================================================
 * STEP 4: MASTER PRODUCT MATCHING
 * ============================================================================
 * Match supplier items to master products in the central database.
 * Auto-matches high-confidence items. Manual review for low confidence.
 * Every item MUST be matched before proceeding.
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FUZZY_MATCH_CONFIG } from '../../config/matchingConfig';

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

const Subtitle = styled.p`
  color: #666;
  font-size: 15px;
  text-align: center;
  margin: 8px 0 0 0;
`;

const InstructionBox = styled.div`
  background: #e7f3ff;
  border: 1px solid #b3d9ff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  color: #004085;
  font-size: 14px;
  line-height: 1.6;

  strong {
    color: #003366;
  }
`;

const ProgressSection = styled.div`
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
`;

const ProgressBar = styled.div`
  display: flex;
  height: 30px;
  gap: 8px;
  margin-top: 12px;
`;

const ProgressSegment = styled.div`
  flex: 1;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: white;

  &.auto { background: #28a745; }
  &.manual { background: #ffc107; color: #333; }
  &.pending { background: #ccc; color: #666; }
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

const ItemsList = styled.div`
  display: flex;
  flex-direction: column;

  &.collapsed {
    display: none;
  }
`;

const ItemRow = styled.div`
  background: white;
  padding: 16px;
  border-bottom: 1px solid #dee2e6;
  transition: background 0.2s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #f8f9fa;
  }

  &.auto-matched {
    background: #f0f9ff;
  }

  &.manual {
    background: #fff8f0;
  }
`;

const ItemHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
`;

const SkuCode = styled.span`
  font-family: monospace;
  font-weight: 600;
  color: #007bff;
  font-size: 13px;
  flex-shrink: 0;
`;

const ItemName = styled.span`
  font-weight: 500;
  color: #333;
  font-size: 14px;
  flex: 1;
  min-width: 150px;
`;

const Badge = styled.span`
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
  white-space: nowrap;
  flex-shrink: 0;

  &.high {
    background: #d4edda;
    color: #155724;
  }

  &.low {
    background: #fff3cd;
    color: #856404;
  }

  &.none {
    background: #f8d7da;
    color: #721c24;
  }
`;

const MatchSection = styled.div`
  padding: 12px 0;
  border-top: 1px solid #dee2e6;
  margin-top: 12px;
`;

const MatchLabel = styled.div`
  font-size: 12px;
  color: #666;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 8px;
`;

const MatchedProduct = styled.div`
  background: #f8f9fa;
  padding: 10px 12px;
  border-radius: 6px;
  border-left: 4px solid #28a745;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;

  .product-name {
    font-weight: 500;
  }

  .match-type {
    font-size: 11px;
    color: #999;
    margin-top: 4px;
    font-style: italic;
  }
`;

const CandidatesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CandidateButton = styled.button`
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;

  &:hover {
    border-color: #007bff;
    background: #f8f9fa;
  }

  &.selected {
    background: #e7f3ff;
    border-color: #007bff;
    border-left: 4px solid #007bff;
  }

  .name {
    font-weight: 500;
    color: #333;
    display: block;
    margin-bottom: 4px;
  }

  .details {
    font-size: 12px;
    color: #666;
    display: block;
    margin-bottom: 6px;
  }

  .confidence {
    font-size: 12px;
    font-weight: 600;
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    background: #f0f0f0;
    color: #333;
  }

  .reasons {
    font-size: 11px;
    color: #999;
    margin-top: 4px;
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

const ErrorBox = styled.div`
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
`;

// ============================================================================
// COMPONENT
// ============================================================================

const Step4_MasterMatch = ({
  unmatchedItems = [],
  detectedSupplier = {},
  onComplete,
  onBack,
}) => {
  const [matches, setMatches] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [error, setError] = useState(null);

  // Load and fuzzy match all items
  useEffect(() => {
    const loadMatches = async () => {
      try {
        setIsLoading(true);
        const newMatches = {};

        for (let idx = 0; idx < unmatchedItems.length; idx++) {
          const item = unmatchedItems[idx];

          const response = await fetch('/api/supplier-items/fuzzy-match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              supplierSku: item.supplierSku,
              supplierName: item.supplierName,
              supplierId: detectedSupplier.id,
              unitSize: item.unitSize || item.packSize || '',
              packSize: item.packSize || '',
              category: item.categoryHeader || '',
            }),
          });

          if (!response.ok) {
            console.error(`Fuzzy match failed for item ${idx}`);
            continue;
          }

          const data = await response.json();

          if (data.autoMatched) {
            newMatches[idx] = {
              masterProductId: data.autoMatched.masterProductId,
              masterProductName: data.autoMatched.masterProductName,
              confidence: data.autoMatched.confidence,
              isAutoMatched: true,
              candidates: data.candidates || [],
            };
          } else if (data.candidates?.length > 0) {
            newMatches[idx] = {
              masterProductId: null,
              candidates: data.candidates,
              requiresReview: true,
            };
          } else {
            newMatches[idx] = {
              masterProductId: null,
              candidates: [],
              noMatches: true,
            };
          }
        }

        setMatches(newMatches);

        // Expand all categories by default
        const categories = [
          ...new Set(unmatchedItems.map(item => item.categoryHeader)),
        ];
        const expanded = {};
        categories.forEach(cat => {
          expanded[cat] = true;
        });
        setExpandedCategories(expanded);
      } catch (err) {
        console.error('Error loading matches:', err);
        setError('Failed to load product matches');
      } finally {
        setIsLoading(false);
      }
    };

    if (unmatchedItems.length > 0 && detectedSupplier.id) {
      loadMatches();
    }
  }, [unmatchedItems, detectedSupplier.id]);

  const handleSelectCandidate = (itemIdx, candidateId, candidateName) => {
    setMatches(prev => ({
      ...prev,
      [itemIdx]: {
        ...prev[itemIdx],
        masterProductId: candidateId,
        masterProductName: candidateName,
        isAutoMatched: false,
      },
    }));
  };

  const handleToggleCategory = category => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleProceed = () => {
    const unmatchedCount = unmatchedItems.filter(
      (_, idx) => !matches[idx]?.masterProductId
    ).length;

    if (unmatchedCount > 0) {
      setError(
        `${unmatchedCount} item(s) still need to be matched before proceeding.`
      );
      return;
    }

    const finalMatches = {};
    unmatchedItems.forEach((_, idx) => {
      finalMatches[idx] = {
        masterProductId: matches[idx].masterProductId,
        confidence: matches[idx].confidence || 0,
      };
    });

    onComplete(finalMatches);
  };

  // Calculate stats
  const autoMatchedCount = Object.values(matches).filter(
    m => m.isAutoMatched
  ).length;
  const manualMatchedCount = Object.values(matches).filter(
    m => m.masterProductId && !m.isAutoMatched
  ).length;
  const allMatched = Object.values(matches).every(m => m.masterProductId);

  // Categorize items
  const categorizedItems = {};
  unmatchedItems.forEach((item, idx) => {
    if (!categorizedItems[item.categoryHeader]) {
      categorizedItems[item.categoryHeader] = [];
    }
    categorizedItems[item.categoryHeader].push({ item, idx });
  });

  if (isLoading) {
    return (
      <Container>
        <Title>Searching for Matches...</Title>
        <Subtitle>
          Comparing your items against our product database
        </Subtitle>
      </Container>
    );
  }

  return (
    <Container>
      <Title>Match to Master Products</Title>
      <Subtitle>
        Link each supplier item to products in our central database
      </Subtitle>

      <InstructionBox>
        <strong>🎯 How this works:</strong>
        <br />
        The system found matches for your items. Items with{' '}
        <strong>high confidence (≥{FUZZY_MATCH_CONFIG.CONFIDENCE_THRESHOLD}%)</strong> are
        automatically matched. Items with lower confidence need your review.{' '}
        <strong>Every item must be matched</strong> to proceed.
      </InstructionBox>

      {error && <ErrorBox>⚠️ {error}</ErrorBox>}

      <ProgressSection>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#333' }}>
          Progress: {autoMatchedCount} auto-matched, {manualMatchedCount} manually matched, {unmatchedItems.length - autoMatchedCount - manualMatchedCount} pending
        </div>
        <ProgressBar>
          {autoMatchedCount > 0 && (
            <ProgressSegment className="auto">
              {autoMatchedCount}✓
            </ProgressSegment>
          )}
          {manualMatchedCount > 0 && (
            <ProgressSegment className="manual">
              {manualMatchedCount}✓
            </ProgressSegment>
          )}
          {unmatchedItems.length - autoMatchedCount - manualMatchedCount > 0 && (
            <ProgressSegment className="pending">
              {unmatchedItems.length - autoMatchedCount - manualMatchedCount}⚙️
            </ProgressSegment>
          )}
        </ProgressBar>
      </ProgressSection>

      <CategoriesContainer>
        {Object.entries(categorizedItems).map(([category, items]) => {
          const isExpanded = expandedCategories[category];

          return (
            <CategorySection key={category}>
              <CategoryHeaderButton
                onClick={() => handleToggleCategory(category)}
                className={isExpanded ? 'expanded' : ''}
              >
                <ExpandIcon>▼</ExpandIcon>
                <span style={{ fontWeight: 600, fontSize: '15px' }}>
                  {category}
                </span>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '13px',
                    color: isExpanded ? 'white' : '#666',
                  }}
                >
                  ({items.length} items)
                </span>
              </CategoryHeaderButton>

              <ItemsList className={!isExpanded ? 'collapsed' : ''}>
                {items.map(({ item, idx }) => {
                  const match = matches[idx];
                  const confidence = match?.confidence;

                  return (
                    <ItemRow
                      key={idx}
                      className={
                        match?.isAutoMatched
                          ? 'auto-matched'
                          : match?.masterProductId
                          ? 'manual'
                          : 'manual'
                      }
                    >
                      <ItemHeader>
                        <SkuCode>{item.supplierSku}</SkuCode>
                        <ItemName>{item.supplierName}</ItemName>
                        {confidence !== undefined && (
                          <Badge
                            className={
                              confidence >=
                              FUZZY_MATCH_CONFIG.CONFIDENCE_THRESHOLD
                                ? 'high'
                                : 'low'
                            }
                          >
                            {Math.round(confidence)}%
                          </Badge>
                        )}
                        {!match?.masterProductId && (
                          <Badge className="none">⚠️ Pending</Badge>
                        )}
                      </ItemHeader>

                      <MatchSection>
                        {match?.masterProductId ? (
                          <>
                            <MatchLabel>✓ Matched Product</MatchLabel>
                            <MatchedProduct>
                              <div className="product-name">
                                {match.masterProductName}
                              </div>
                              <div className="match-type">
                                {match.isAutoMatched
                                  ? 'Automatically matched'
                                  : 'Manually selected'}
                              </div>
                              {match.isAutoMatched && (
                                <button
                                  style={{
                                    marginTop: '10px',
                                    padding: '6px 12px',
                                    fontSize: '12px',
                                    backgroundColor: '#f0f0f0',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => {
                                    setMatches(prev => ({
                                      ...prev,
                                      [idx]: {
                                        ...prev[idx],
                                        masterProductId: null,
                                        masterProductName: null,
                                        candidates: match.candidates || []
                                      }
                                    }));
                                  }}
                                >
                                  Change Match
                                </button>
                              )}
                            </MatchedProduct>
                          </>
                        ) : (
                          <>
                            <MatchLabel>
                              {match?.noMatches
                                ? 'No matches found:'
                                : 'Select best match:'}
                            </MatchLabel>
                            {match?.candidates && match.candidates.length > 0 && (
                              <CandidatesList>
                                {match.candidates.map((candidate, candIdx) => (
                                  <CandidateButton
                                    key={candIdx}
                                    className={
                                      match.masterProductId === candidate.id
                                        ? 'selected'
                                        : ''
                                    }
                                    onClick={() =>
                                      handleSelectCandidate(
                                        idx,
                                        candidate.id,
                                        candidate.name
                                      )
                                    }
                                  >
                                    <span className="name">{candidate.name}</span>
                                    <span className="details">
                                      {candidate.brand && `${candidate.brand} • `}
                                      {candidate.category}
                                    </span>
                                    <span className="confidence">
                                      {Math.round(candidate.confidence)}% match
                                    </span>
                                    {candidate.matchReasons?.length > 0 && (
                                      <span className="reasons">
                                        {candidate.matchReasons.join(' • ')}
                                      </span>
                                    )}
                                  </CandidateButton>
                                ))}
                              </CandidatesList>
                            )}
                          </>
                        )}
                      </MatchSection>
                    </ItemRow>
                  );
                })}
              </ItemsList>
            </CategorySection>
          );
        })}
      </CategoriesContainer>

      <BottomSection>
        <div>
          {allMatched && (
            <span style={{ color: '#28a745', fontWeight: 600 }}>
              ✓ All items matched!
            </span>
          )}
        </div>
        <ButtonGroup>
          <Button className="secondary" onClick={onBack}>
            ← Back
          </Button>
          <Button
            className="primary"
            onClick={handleProceed}
            disabled={!allMatched}
          >
            Continue to Summary →
          </Button>
        </ButtonGroup>
      </BottomSection>
    </Container>
  );
};

export default Step4_MasterMatch;