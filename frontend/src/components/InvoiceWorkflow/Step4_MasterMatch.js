/**
 * ============================================================================
 * STEP 4: MASTER PRODUCT MATCHING (DATABASE-FIRST APPROACH)
 * ============================================================================
 * Match supplier items to master products in the central database.
 *
 * NEW APPROACH:
 * 1. Load pre-matched items from supplier_item_list (database-first)
 * 2. Fuzzy match only unmatched items
 * 3. Allow manual product creation
 * 4. Support changing matches for pre-matched items
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

  &.pre-matched {
    background: #e8f5e9;
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

  &.pre-matched {
    background: #c8e6c9;
    color: #2e7d32;
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

  &.pre-matched {
    border-left-color: #4caf50;
    background: #f1f8f4;
  }

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

const ActionButton = styled.button`
  margin-top: 10px;
  padding: 6px 12px;
  font-size: 12px;
  background-color: ${props => props.$variant === 'primary' ? '#007bff' : '#f0f0f0'};
  color: ${props => props.$variant === 'primary' ? 'white' : '#333'};
  border: 1px solid ${props => props.$variant === 'primary' ? '#007bff' : '#ddd'};
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 8px;

  &:hover {
    background-color: ${props => props.$variant === 'primary' ? '#0056b3' : '#e0e0e0'};
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

// Modal Overlay
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
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.h2`
  margin: 0 0 20px 0;
  color: #333;
  font-size: 24px;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
  color: #333;
  font-size: 14px;

  .required {
    color: #dc3545;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #007bff;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #007bff;
  }
`;

const ModalButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
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
  // State for matches (combines pre-matched and fuzzy-matched items)
  const [matches, setMatches] = useState({});

  // State for database pre-matches (from supplier_item_list)
  const [dbMatches, setDbMatches] = useState({});

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDbMatches, setIsLoadingDbMatches] = useState(true);

  // UI states
  const [expandedCategories, setExpandedCategories] = useState({});
  const [error, setError] = useState(null);

  // Change match mode - tracks which item is in "change match" mode
  const [changeMatchMode, setChangeMatchMode] = useState(null); // { itemIdx, candidates }

  // Manual product creation modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualModalData, setManualModalData] = useState(null); // { itemIdx, item }
  const [manualFormData, setManualFormData] = useState({
    productName: '',
    brand: '',
    category: '',
    subcategory: '',
    unitType: '',
    unitSize: '',
    caseSize: '',
    barcode: '',
    eanCode: '',
    upcCode: ''
  });

  // ============================================================================
  // STEP 1: Load pre-matched items from database
  // ============================================================================
  useEffect(() => {
    const loadDbMatches = async () => {
      if (!detectedSupplier.id) return;

      try {
        setIsLoadingDbMatches(true);
        const response = await fetch(
          `/api/supplier-items/get-supplier-items?supplierId=${detectedSupplier.id}`
        );

        if (!response.ok) {
          throw new Error('Failed to load supplier items');
        }

        const data = await response.json();

        // Create a map: supplierSku -> { master_product_id, confidence_score, etc }
        const matchMap = {};
        data.items.forEach(item => {
          if (item.master_product_id) {
            matchMap[item.supplier_sku] = {
              masterProductId: item.master_product_id,
              confidenceScore: item.confidence_score || 100,
              unitSize: item.unit_size,
              packSize: item.pack_size
            };
          }
        });

        setDbMatches(matchMap);
      } catch (err) {
        console.error('Error loading DB matches:', err);
        setError('Failed to load pre-matched items from database');
      } finally {
        setIsLoadingDbMatches(false);
      }
    };

    loadDbMatches();
  }, [detectedSupplier.id]);

  // ============================================================================
  // STEP 2 & 3: Separate matched from unmatched, fuzzy match only unmatched
  // ============================================================================
  useEffect(() => {
    const loadMatches = async () => {
      // Wait for dbMatches to load first
      if (isLoadingDbMatches) return;

      try {
        setIsLoading(true);
        const newMatches = {};

        for (let idx = 0; idx < unmatchedItems.length; idx++) {
          const item = unmatchedItems[idx];
          const dbMatch = dbMatches[item.supplierSku];

          // Check if this item has a pre-match in the database
          if (dbMatch && dbMatch.masterProductId) {
            // PRE-MATCHED: Get product details from fuzzy-match to have consistent data
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

            if (response.ok) {
              const data = await response.json();

              // If fuzzy-match returns existing mapping, use it
              if (data.autoMatched && data.autoMatched.matchType === 'existing_mapping') {
                newMatches[idx] = {
                  masterProductId: data.autoMatched.masterProductId,
                  masterProductName: data.autoMatched.masterProductName,
                  confidence: data.autoMatched.confidence,
                  isPreMatched: true,
                  candidates: data.candidates || [],
                };
              }
            }
          } else {
            // UNMATCHED: Perform fuzzy matching
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
              newMatches[idx] = {
                masterProductId: null,
                candidates: [],
                noMatches: true,
              };
              continue;
            }

            const data = await response.json();

            // Sort candidates by confidence (highest first)
            const sortedCandidates = (data.candidates || []).sort((a, b) => b.confidence - a.confidence);

            if (data.autoMatched && data.autoMatched.matchType === 'fuzzy') {
              newMatches[idx] = {
                masterProductId: data.autoMatched.masterProductId,
                masterProductName: data.autoMatched.masterProductName,
                confidence: data.autoMatched.confidence,
                isAutoMatched: true,
                candidates: sortedCandidates,
              };
            } else if (sortedCandidates.length > 0) {
              newMatches[idx] = {
                masterProductId: null,
                candidates: sortedCandidates,
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

    if (unmatchedItems.length > 0 && detectedSupplier.id && !isLoadingDbMatches) {
      loadMatches();
    }
  }, [unmatchedItems, detectedSupplier.id, dbMatches, isLoadingDbMatches]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSelectCandidate = (itemIdx, candidateId, candidateName) => {
    setMatches(prev => ({
      ...prev,
      [itemIdx]: {
        ...prev[itemIdx],
        masterProductId: candidateId,
        masterProductName: candidateName,
        isAutoMatched: false,
        isPreMatched: false, // Changed from pre-matched
      },
    }));

    // Exit change match mode if active
    setChangeMatchMode(null);
  };

  const handleToggleCategory = category => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Open "Change Match" mode for a pre-matched item
  const handleChangeMatch = async (itemIdx) => {
    const item = unmatchedItems[itemIdx];
    const match = matches[itemIdx];

    // If we already have candidates, use them
    if (match.candidates && match.candidates.length > 0) {
      setChangeMatchMode({ itemIdx, candidates: match.candidates });

      // Clear the current match to show candidates
      setMatches(prev => ({
        ...prev,
        [itemIdx]: {
          ...prev[itemIdx],
          masterProductId: null,
        },
      }));
    } else {
      // Fetch fuzzy match candidates for this item
      try {
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

        if (response.ok) {
          const data = await response.json();
          const sortedCandidates = (data.candidates || []).sort((a, b) => b.confidence - a.confidence);

          setChangeMatchMode({ itemIdx, candidates: sortedCandidates });

          // Update match with candidates and clear current selection
          setMatches(prev => ({
            ...prev,
            [itemIdx]: {
              ...prev[itemIdx],
              masterProductId: null,
              candidates: sortedCandidates,
            },
          }));
        }
      } catch (err) {
        console.error('Error loading candidates for change match:', err);
        setError('Failed to load alternative matches');
      }
    }
  };

  // Cancel change match mode
  const handleCancelChangeMatch = (itemIdx) => {
    const match = matches[itemIdx];

    // Restore the original match from dbMatches
    const item = unmatchedItems[itemIdx];
    const dbMatch = dbMatches[item.supplierSku];

    if (dbMatch && dbMatch.masterProductId) {
      // Restore pre-matched state (would need to fetch product name again)
      // For simplicity, we'll mark it as needs refresh
      setMatches(prev => ({
        ...prev,
        [itemIdx]: {
          ...match,
          masterProductId: dbMatch.masterProductId,
          isPreMatched: true,
        },
      }));
    }

    setChangeMatchMode(null);
  };

  // Open manual product creation modal
  const handleOpenManualModal = (itemIdx) => {
    const item = unmatchedItems[itemIdx];
    setManualModalData({ itemIdx, item });

    // Pre-fill form with item data
    setManualFormData({
      productName: item.supplierName || '',
      brand: '',
      category: item.categoryHeader || '',
      subcategory: '',
      unitType: '',
      unitSize: item.unitSize || '',
      caseSize: item.packSize || '',
      barcode: '',
      eanCode: '',
      upcCode: ''
    });

    setShowManualModal(true);
  };

  const handleCloseManualModal = () => {
    setShowManualModal(false);
    setManualModalData(null);
    setManualFormData({
      productName: '',
      brand: '',
      category: '',
      subcategory: '',
      unitType: '',
      unitSize: '',
      caseSize: '',
      barcode: '',
      eanCode: '',
      upcCode: ''
    });
  };

  const handleManualFormChange = (field, value) => {
    setManualFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitManualProduct = async () => {
    if (!manualFormData.productName.trim()) {
      setError('Product name is required');
      return;
    }

    if (!manualModalData) return;

    const { itemIdx, item } = manualModalData;

    try {
      const response = await fetch('/api/supplier-items/create-and-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: detectedSupplier.id,
          supplierSku: item.supplierSku,
          supplierName: item.supplierName,
          productName: manualFormData.productName,
          brand: manualFormData.brand || null,
          category: manualFormData.category || null,
          subcategory: manualFormData.subcategory || null,
          unitType: manualFormData.unitType || null,
          unitSize: manualFormData.unitSize || null,
          caseSize: manualFormData.caseSize || null,
          barcode: manualFormData.barcode || null,
          eaCode: manualFormData.eanCode || null,
          upcCode: manualFormData.upcCode || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create product');
      }

      const data = await response.json();

      // Update matches with the newly created product
      setMatches(prev => ({
        ...prev,
        [itemIdx]: {
          masterProductId: data.masterProductId,
          masterProductName: manualFormData.productName,
          confidence: 100,
          isAutoMatched: false,
          isPreMatched: false,
          isManuallyCreated: true,
          candidates: [],
        },
      }));

      // Close modal
      handleCloseManualModal();

      // Exit change match mode if active
      setChangeMatchMode(null);

      // Show success message
      setError(null);
    } catch (err) {
      console.error('Error creating manual product:', err);
      setError('Failed to create new product. Please try again.');
    }
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

  // ============================================================================
  // CALCULATED VALUES
  // ============================================================================

  // Calculate stats
  const preMatchedCount = Object.values(matches).filter(
    m => m.isPreMatched && m.masterProductId
  ).length;
  const autoMatchedCount = Object.values(matches).filter(
    m => m.isAutoMatched && m.masterProductId
  ).length;
  const manualMatchedCount = Object.values(matches).filter(
    m => m.masterProductId && !m.isAutoMatched && !m.isPreMatched
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

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoading || isLoadingDbMatches) {
    return (
      <Container>
        <Title>Searching for Matches...</Title>
        <Subtitle>
          Loading pre-matched items and comparing against our product database
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
        <strong>How this works:</strong>
        <br />
        Items already matched in our database are shown with a green background.
        New items are automatically matched if confidence is high (≥{FUZZY_MATCH_CONFIG.CONFIDENCE_THRESHOLD}%).
        You can change any match or create new products as needed.
        <strong> Every item must be matched</strong> to proceed.
      </InstructionBox>

      {error && <ErrorBox>{error}</ErrorBox>}

      <ProgressSection>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#333' }}>
          Progress: {preMatchedCount} pre-matched, {autoMatchedCount} auto-matched, {manualMatchedCount} manually matched, {unmatchedItems.length - preMatchedCount - autoMatchedCount - manualMatchedCount} pending
        </div>
        <ProgressBar>
          {(preMatchedCount + autoMatchedCount) > 0 && (
            <ProgressSegment className="auto">
              {preMatchedCount + autoMatchedCount}✓
            </ProgressSegment>
          )}
          {manualMatchedCount > 0 && (
            <ProgressSegment className="manual">
              {manualMatchedCount}✓
            </ProgressSegment>
          )}
          {unmatchedItems.length - preMatchedCount - autoMatchedCount - manualMatchedCount > 0 && (
            <ProgressSegment className="pending">
              {unmatchedItems.length - preMatchedCount - autoMatchedCount - manualMatchedCount}⚙️
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
                  const isInChangeMode = changeMatchMode?.itemIdx === idx;

                  return (
                    <ItemRow
                      key={idx}
                      className={
                        match?.isPreMatched
                          ? 'pre-matched'
                          : match?.isAutoMatched
                          ? 'auto-matched'
                          : match?.masterProductId
                          ? 'manual'
                          : 'manual'
                      }
                    >
                      <ItemHeader>
                        <SkuCode>{item.supplierSku}</SkuCode>
                        <ItemName>{item.supplierName}</ItemName>

                        {match?.isPreMatched && (
                          <Badge className="pre-matched">Pre-matched</Badge>
                        )}

                        {confidence !== undefined && !match?.isPreMatched && (
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
                        {match?.masterProductId && !isInChangeMode ? (
                          <>
                            <MatchLabel>✓ Matched Product</MatchLabel>
                            <MatchedProduct className={match.isPreMatched ? 'pre-matched' : ''}>
                              <div className="product-name">
                                {match.masterProductName}
                              </div>
                              <div className="match-type">
                                {match.isPreMatched
                                  ? 'Previously matched in database'
                                  : match.isAutoMatched
                                  ? 'Automatically matched'
                                  : match.isManuallyCreated
                                  ? 'Manually created product'
                                  : 'Manually selected'}
                              </div>
                              <div>
                                <ActionButton onClick={() => handleChangeMatch(idx)}>
                                  Change Match
                                </ActionButton>
                                <ActionButton
                                  $variant="primary"
                                  onClick={() => handleOpenManualModal(idx)}
                                >
                                  Create New Product
                                </ActionButton>
                              </div>
                            </MatchedProduct>
                          </>
                        ) : (
                          <>
                            <MatchLabel>
                              {match?.noMatches
                                ? 'No matches found - Create a new product:'
                                : 'Select best match or create new product:'}
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

                            <div style={{ marginTop: '12px' }}>
                              <ActionButton
                                $variant="primary"
                                onClick={() => handleOpenManualModal(idx)}
                              >
                                + Create New Product
                              </ActionButton>

                              {isInChangeMode && (
                                <ActionButton onClick={() => handleCancelChangeMatch(idx)}>
                                  Cancel
                                </ActionButton>
                              )}
                            </div>
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

      {/* Manual Product Creation Modal */}
      {showManualModal && (
        <ModalOverlay onClick={handleCloseManualModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>Create New Product</ModalHeader>

            <FormGroup>
              <Label>
                Product Name <span className="required">*</span>
              </Label>
              <Input
                type="text"
                value={manualFormData.productName}
                onChange={(e) => handleManualFormChange('productName', e.target.value)}
                placeholder="Enter product name"
              />
            </FormGroup>

            <FormGroup>
              <Label>Brand</Label>
              <Input
                type="text"
                value={manualFormData.brand}
                onChange={(e) => handleManualFormChange('brand', e.target.value)}
                placeholder="Enter brand name"
              />
            </FormGroup>

            <FormGroup>
              <Label>Category</Label>
              <Input
                type="text"
                value={manualFormData.category}
                onChange={(e) => handleManualFormChange('category', e.target.value)}
                placeholder="e.g., BEER, WINE, SPIRIT"
              />
            </FormGroup>

            <FormGroup>
              <Label>Subcategory</Label>
              <Input
                type="text"
                value={manualFormData.subcategory}
                onChange={(e) => handleManualFormChange('subcategory', e.target.value)}
                placeholder="e.g., Lager, Red Wine, Vodka"
              />
            </FormGroup>

            <FormGroup>
              <Label>Unit Type</Label>
              <Select
                value={manualFormData.unitType}
                onChange={(e) => handleManualFormChange('unitType', e.target.value)}
              >
                <option value="">Select unit type</option>
                <option value="bottle">Bottle</option>
                <option value="can">Can</option>
                <option value="keg">Keg</option>
                <option value="case">Case</option>
                <option value="pack">Pack</option>
                <option value="cask">Cask</option>
                <option value="bag-in-box">Bag-in-Box</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Unit Size</Label>
              <Input
                type="text"
                value={manualFormData.unitSize}
                onChange={(e) => handleManualFormChange('unitSize', e.target.value)}
                placeholder="e.g., 330ml, 750ml, 50L"
              />
            </FormGroup>

            <FormGroup>
              <Label>Case Size</Label>
              <Input
                type="text"
                value={manualFormData.caseSize}
                onChange={(e) => handleManualFormChange('caseSize', e.target.value)}
                placeholder="e.g., 24, 12, 6"
              />
            </FormGroup>

            <FormGroup>
              <Label>Barcode</Label>
              <Input
                type="text"
                value={manualFormData.barcode}
                onChange={(e) => handleManualFormChange('barcode', e.target.value)}
                placeholder="Enter barcode"
              />
            </FormGroup>

            <FormGroup>
              <Label>EAN Code</Label>
              <Input
                type="text"
                value={manualFormData.eanCode}
                onChange={(e) => handleManualFormChange('eanCode', e.target.value)}
                placeholder="Enter EAN code"
              />
            </FormGroup>

            <FormGroup>
              <Label>UPC Code</Label>
              <Input
                type="text"
                value={manualFormData.upcCode}
                onChange={(e) => handleManualFormChange('upcCode', e.target.value)}
                placeholder="Enter UPC code"
              />
            </FormGroup>

            <ModalButtonGroup>
              <Button className="secondary" onClick={handleCloseManualModal}>
                Cancel
              </Button>
              <Button className="primary" onClick={handleSubmitManualProduct}>
                Create Product
              </Button>
            </ModalButtonGroup>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default Step4_MasterMatch;
