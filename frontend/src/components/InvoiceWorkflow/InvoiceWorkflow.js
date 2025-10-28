/**
 * ============================================================================
 * INVOICE WORKFLOW - MAIN CONTAINER COMPONENT
 * ============================================================================
 *
 * Purpose:
 *   Orchestrates the complete invoice import workflow from upload through
 *   final confirmation. Manages state across all 5 steps and coordinates
 *   data flow between components.
 *
 * Workflow Steps:
 *   Step 1: Upload - User uploads PDF via drag-drop or file picker
 *   Step 2: Review - Display parsed items with supplier detection & checkboxes
 *   Step 3: Ignore - Confirm items to ignore and provide reasons
 *   Step 4: Match  - Fuzzy match items to master products (manual review)
 *   Step 5: Summary - Final confirmation before saving to database
 *
 * Architecture:
 *   - Stateless step components receive data via props
 *   - All state managed here (single source of truth)
 *   - Data flows down, callbacks flow up
 *   - No Redux/Context needed for this quick workflow
 *
 * Entry Point:
 *   Used via: /invoice-input route
 *   Props: venueId, userId (passed from parent)
 * ============================================================================
 */

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Step1_Upload from './Step1_Upload';
import Step2_ReviewItems from './Step2_ReviewItems';
import Step3_IgnoreItems from './Step3_IgnoreItems';
import Step4_MasterMatch from './Step4_MasterMatch';
import Step5_Summary from './Step5_Summary';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const WorkflowContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

const WorkflowContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const ProgressBar = styled.div`
  display: flex;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;

  /* Each step indicator */
  div {
    flex: 1;
    padding: 16px;
    text-align: center;
    border-right: 1px solid #e9ecef;
    transition: all 0.3s ease;

    &:last-child {
      border-right: none;
    }

    /* Active step styling */
    &.active {
      background: #007bff;
      color: white;
      font-weight: 600;
    }

    /* Completed step styling */
    &.completed {
      background: #28a745;
      color: white;
      font-weight: 600;
    }

    /* Pending/disabled step styling */
    &.pending {
      color: #999;
      cursor: not-allowed;
    }
  }
`;

const StepContent = styled.div`
  padding: 40px;
  min-height: 500px;
  animation: fadeIn 0.3s ease-in;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const ErrorMessage = styled.div`
  background: #fff3cd;
  border: 1px solid #ffc107;
  color: #856404;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 20px;
`;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const InvoiceWorkflow = ({ venueId: propVenueId, userId: propUserId }) => {
  // ========== ROUTE & NAVIGATION ==========

  // Extract venueId and userId from location state (passed from Dashboard)
  const location = useLocation();
  const navigate = useNavigate();
  const venueId = location.state?.venueId || propVenueId;
  const userId = location.state?.userId || propUserId;

  // ========== STATE MANAGEMENT ==========

  // Current workflow step (1-5)
  const [currentStep, setCurrentStep] = useState(1);

  // Error state for displaying error messages
  const [error, setError] = useState(null);

  // Step 1: Upload & Supplier Detection
  const [uploadedFile, setUploadedFile] = useState(null);
  const [detectedSupplier, setDetectedSupplier] = useState(null);
  const [rawPdfText, setRawPdfText] = useState('');

  // Step 2: Parsed items from PDF
  const [parsedItems, setParsedItems] = useState([]);
  const [itemCheckboxes, setItemCheckboxes] = useState({});
  const [invoiceMetadata, setInvoiceMetadata] = useState({
    invoiceNumber: '',
    invoiceDate: '',
    totalAmount: 0,
    subtotal: 0,
    vatTotal: 0,
  });

  // Step 3: Items marked for ignoring
  const [ignoredItems, setIgnoredItems] = useState([]);
  const [ignoreReasons, setIgnoreReasons] = useState({});

  // Step 4: Master product matching
  const [matchedItems, setMatchedItems] = useState({});
  const [unmatchedItems, setUnmatchedItems] = useState([]);

  // Step 5: Final confirmation data
  const [finalConfirm, setFinalConfirm] = useState(false);

  // ========== CALLBACK HANDLERS ==========

  /**
   * Step 1 -> Step 2 Transition
   * Called when user successfully uploads and parses a PDF
   *
   * @param {File} file - The uploaded PDF file
   * @param {string} pdfText - Raw text extracted from PDF
   * @param {Object} supplier - Detected supplier info { id, name, supplierId }
   * @param {Array} items - Parsed line items from PDF
   * @param {Object} metadata - Invoice metadata (invoice#, date, totals)
   */
  const handleUploadComplete = (file, pdfText, supplier, items, metadata) => {
    try {
      setUploadedFile(file);
      setRawPdfText(pdfText);

      // Normalize supplier object - handle both 'id' and 'sup_id' field names
      const normalizedSupplier = {
        ...supplier,
        id: supplier.id || supplier.sup_id,  // Use 'id' or fall back to 'sup_id'
        name: supplier.name || supplier.sup_name
      };

      console.log('Detected supplier:', normalizedSupplier);
      setDetectedSupplier(normalizedSupplier);
      setParsedItems(items);
      setInvoiceMetadata(metadata);

      // Initialize checkboxes - all items start as CHECKED (will be imported)
      // Items that were previously ignored will be auto-unchecked in Step 2
      const checkboxState = {};
      items.forEach((item, idx) => {
        checkboxState[idx] = true; // true = will be imported
      });
      setItemCheckboxes(checkboxState);

      setError(null);
      setCurrentStep(2);
    } catch (err) {
      setError(`Failed to process upload: ${err.message}`);
    }
  };

  /**
   * Step 2 -> Step 3 Transition
   * Called when user reviews items and decides which to ignore
   *
   * @param {Object} checkboxState - { itemIndex: boolean }
   */
  const handleReviewComplete = (checkboxState) => {
    try {
      setItemCheckboxes(checkboxState);

      // Extract unchecked items (items to ignore)
      const uncheckedIndices = Object.entries(checkboxState)
        .filter(([_, isChecked]) => !isChecked)
        .map(([idx, _]) => parseInt(idx));

      const itemsToIgnore = uncheckedIndices.map(idx => ({
        ...parsedItems[idx],
        originalIndex: idx,
      }));

      setIgnoredItems(itemsToIgnore);

      // Initialize ignore reasons (empty initially)
      const reasons = {};
      itemsToIgnore.forEach((item, idx) => {
        reasons[idx] = '';
      });
      setIgnoreReasons(reasons);

      setError(null);
      setCurrentStep(3);
    } catch (err) {
      setError(`Failed to process review: ${err.message}`);
    }
  };

  /**
   * Step 3 -> Step 4 Transition
   * Called when user confirms which items to ignore and provides reasons
   *
   * @param {Object} reasons - { itemIndex: reasonText }
   */
  const handleIgnoreConfirmed = (reasons) => {
    try {
      setIgnoreReasons(reasons);

      // Filter parsed items: keep only checked items
      const checkedIndices = Object.entries(itemCheckboxes)
        .filter(([_, isChecked]) => isChecked)
        .map(([idx, _]) => parseInt(idx));

      const itemsToMatch = checkedIndices.map(idx => parsedItems[idx]);
      setUnmatchedItems(itemsToMatch);

      // Initialize matched items as empty (Step 4 will fill these)
      setMatchedItems({});

      setError(null);
      setCurrentStep(4);
    } catch (err) {
      setError(`Failed to confirm ignoring: ${err.message}`);
    }
  };

  /**
   * Step 4 -> Step 5 Transition
   * Called when all items have been matched to master products
   *
   * @param {Object} matches - { itemIndex: { masterProductId, confidence } }
   */
  const handleMatchingComplete = (matches) => {
    try {
      setMatchedItems(matches);
      setError(null);
      setCurrentStep(5);
    } catch (err) {
      setError(`Failed to complete matching: ${err.message}`);
    }
  };

  /**
   * Final Submission
   * Called when user confirms the entire invoice on Step 5
   * This would typically call an API to save everything
   */
  const handleFinalSubmit = async () => {
    try {
      setFinalConfirm(true);

      // TODO: Call API endpoint to save:
      // - invoices table (header)
      // - invoice_line_items (checked items only)
      // - venue_ignored_items (unchecked items with reasons)
      // - supplier_item_list (matches)

      setError(null);

      // Navigate back to dashboard on success
      // Use a slight delay to allow user to see the loading state
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err) {
      setError(`Failed to submit invoice: ${err.message}`);
      setFinalConfirm(false);
    }
  };

  /**
   * Navigation - Go back to previous step
   */
  const handleBackClick = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  // ========== RENDER ==========

  return (
    <WorkflowContainer>
      <WorkflowContent>
        {/* Step Progress Indicator */}
        <ProgressBar>
          {['Upload', 'Review', 'Ignore', 'Match', 'Confirm'].map((label, idx) => {
            const step = idx + 1;
            let status = 'pending';

            if (step < currentStep) status = 'completed';
            else if (step === currentStep) status = 'active';

            return (
              <div key={step} className={status}>
                Step {step}: {label}
              </div>
            );
          })}
        </ProgressBar>

        {/* Error Display */}
        {error && <ErrorMessage>{error}</ErrorMessage>}

        {/* Step Content */}
        <StepContent>
          {currentStep === 1 && (
            <Step1_Upload
              venueId={venueId}
              userId={userId}
              onUploadComplete={handleUploadComplete}
            />
          )}

          {currentStep === 2 && (
            <Step2_ReviewItems
              parsedItems={parsedItems}
              itemCheckboxes={itemCheckboxes}
              detectedSupplier={detectedSupplier}
              invoiceMetadata={invoiceMetadata}
              venueId={venueId}
              onItemCheckboxChange={(idx, checked) => {
                setItemCheckboxes(prevCheckboxes => ({
                  ...prevCheckboxes,
                  [idx]: checked,
                }));
              }}
              onComplete={handleReviewComplete}
              onBack={handleBackClick}
            />
          )}

          {currentStep === 3 && (
            <Step3_IgnoreItems
              ignoredItems={ignoredItems}
              ignoreReasons={ignoreReasons}
              invoiceMetadata={invoiceMetadata}
              venueId={venueId}
              detectedSupplier={detectedSupplier}
              onReasonChange={(idx, reason) => {
                setIgnoreReasons({
                  ...ignoreReasons,
                  [idx]: reason,
                });
              }}
              onComplete={handleIgnoreConfirmed}
              onBack={handleBackClick}
            />
          )}

          {currentStep === 4 && (
            <Step4_MasterMatch
              unmatchedItems={unmatchedItems}
              detectedSupplier={detectedSupplier}
              onComplete={handleMatchingComplete}
              onBack={handleBackClick}
            />
          )}

          {currentStep === 5 && (
            <Step5_Summary
              invoiceMetadata={invoiceMetadata}
              parsedItems={parsedItems}
              itemCheckboxes={itemCheckboxes}
              matchedItems={matchedItems}
              ignoredItems={ignoredItems}
              ignoreReasons={ignoreReasons}
              detectedSupplier={detectedSupplier}
              onSubmit={handleFinalSubmit}
              onBack={handleBackClick}
              isSubmitting={finalConfirm}
            />
          )}
        </StepContent>
      </WorkflowContent>
    </WorkflowContainer>
  );
};

export default InvoiceWorkflow;
