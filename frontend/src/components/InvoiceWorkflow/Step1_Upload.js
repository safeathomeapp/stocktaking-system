/**
 * ============================================================================
 * STEP 1: UPLOAD & SUPPLIER DETECTION
 * ============================================================================
 *
 * Purpose:
 *   - Accept PDF upload via drag-and-drop or file picker
 *   - Send PDF to backend for parsing and supplier detection
 *   - Extract raw text from PDF
 *   - Auto-detect which supplier the invoice belongs to
 *   - Pass parsed data to Step 2 (Review Items)
 *
 * User Experience:
 *   - Large drag-drop zone with visual feedback
 *   - File picker button as fallback
 *   - Loading indicator while processing
 *   - Error handling with clear messages
 *   - Progress feedback (uploading, parsing, detecting supplier)
 *
 * Backend Integration:
 *   POST /api/invoices/parse
 *     Input: PDF file
 *     Output: {
 *       rawText,           // Raw text extracted from PDF
 *       supplier,          // { id, name, supplierId }
 *       parserType,        // 'booker', 'supplier2', etc.
 *       detectionScore     // Confidence 0-100
 *     }
 *
 * Architecture:
 *   - Stateless component (all state in parent)
 *   - Receives callback onUploadComplete
 *   - File validation happens locally before sending
 *   - Backend handles PDF parsing and supplier detection
 * ============================================================================
 */

import React, { useState, useRef } from 'react';
import styled from 'styled-components';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const Title = styled.h1`
  color: #333;
  font-size: 32px;
  margin: 0;
  text-align: center;
`;

const Subtitle = styled.p`
  color: #666;
  font-size: 16px;
  text-align: center;
  margin: 0;
  line-height: 1.5;
`;

// Drag-drop zone styling
const DropZone = styled.div`
  border: 3px dashed #007bff;
  border-radius: 8px;
  padding: 60px 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f8f9ff;

  /* Hover state */
  &:hover {
    background: #e7f0ff;
    border-color: #0056b3;
  }

  /* Drag-over state (when user drags file over) */
  &.dragover {
    background: #0056b3;
    border-color: #0056b3;
    color: white;

    h3 {
      color: white;
    }

    p {
      color: rgba(255, 255, 255, 0.9);
    }
  }

  /* Loading state */
  &.loading {
    pointer-events: none;
    opacity: 0.6;
  }
`;

const DropIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const DropTitle = styled.h3`
  color: #007bff;
  font-size: 20px;
  margin: 0 0 8px 0;
`;

const DropText = styled.p`
  color: #666;
  font-size: 14px;
  margin: 0;
`;

// File picker button
const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
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

const HiddenFileInput = styled.input`
  display: none;
`;

// Status message styling
const StatusContainer = styled.div`
  padding: 16px;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;

  &.loading {
    background: #e7f0ff;
    color: #0056b3;
  }

  &.success {
    background: #d4edda;
    color: #155724;
  }

  &.error {
    background: #f8d7da;
    color: #721c24;
  }
`;

const LoadingDots = styled.span`
  display: inline-block;
  animation: dots 1.4s infinite;

  @keyframes dots {
    0%, 20% {
      content: '.';
    }
    40% {
      content: '..';
    }
    60%, 100% {
      content: '...';
    }
  }
`;

// File info display
const FileInfo = styled.div`
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .file-details {
    flex: 1;

    .filename {
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;
    }

    .filesize {
      font-size: 12px;
      color: #999;
    }
  }

  .file-status {
    font-size: 12px;
    padding: 6px 12px;
    border-radius: 4px;
    font-weight: 600;

    &.processing {
      background: #fff3cd;
      color: #856404;
    }

    &.detected {
      background: #d4edda;
      color: #155724;
    }
  }
`;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const Step1_Upload = ({ venueId, userId, onUploadComplete }) => {
  // ========== STATE ==========

  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Processing state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Result state
  const [detectionResult, setDetectionResult] = useState(null);
  const [error, setError] = useState(null);

  // File input reference for hidden input element
  const fileInputRef = useRef(null);

  // ========== FILE VALIDATION ==========

  /**
   * Validate selected file
   * - Must be PDF
   * - Must not be empty
   * - Size limits (optional)
   *
   * @param {File} file - The file to validate
   * @returns {Object} { valid: boolean, message: string }
   */
  const validateFile = (file) => {
    if (!file) {
      return { valid: false, message: 'No file selected' };
    }

    // Check file type
    if (file.type !== 'application/pdf') {
      return {
        valid: false,
        message: 'Please upload a PDF file. Received: ' + file.type,
      };
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        valid: false,
        message: `File is too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum: 5MB`,
      };
    }

    // Check file size is not empty
    if (file.size === 0) {
      return {
        valid: false,
        message: 'File is empty',
      };
    }

    return { valid: true };
  };

  // ========== FILE UPLOAD HANDLERS ==========

  /**
   * Handle file selection from file picker or drag-drop
   * Validates file and triggers upload process
   *
   * @param {File} file - The uploaded file
   */
  const handleFileSelected = async (file) => {
    setError(null);

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    // Store selected file
    setSelectedFile(file);

    // Start upload and parsing process
    await uploadAndParse(file);
  };

  /**
   * Upload PDF to backend and trigger parsing + supplier detection
   * This is where the real work happens on the server
   *
   * @param {File} file - The PDF file to upload
   */
  const uploadAndParse = async (file) => {
    setIsLoading(true);
    setError(null);
    setLoadingMessage('Uploading PDF...');

    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('venueId', venueId);

      // Send to backend
      setLoadingMessage('Parsing PDF and detecting supplier...');

      const response = await fetch('/api/invoices/parse', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - browser will set it correctly with boundary
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Check if parsing was successful
      if (!result.success) {
        throw new Error(result.message || 'Failed to parse PDF');
      }

      setLoadingMessage('Supplier detected!');
      setDetectionResult(result);

      // Brief pause to show success message
      setTimeout(() => {
        // Call parent callback with all parsed data
        onUploadComplete(
          file,
          result.rawText,
          result.supplier,
          result.parsedItems || [],
          result.metadata || {}
        );
      }, 1000);
    } catch (err) {
      setError(`Failed to process PDF: ${err.message}`);
      setIsLoading(false);
      setLoadingMessage('');
      setDetectionResult(null);
    }
  };

  // ========== DRAG-AND-DROP HANDLERS ==========

  /**
   * Handle drag over event - show visual feedback
   */
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  /**
   * Handle drag leave event
   */
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  /**
   * Handle drop event - user dropped file on zone
   */
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    // Extract file from drop event
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelected(files[0]);
    }
  };

  /**
   * Handle file picker button click
   */
  const handlePickerClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  /**
   * Handle file input change (from file picker)
   */
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  };

  // ========== RENDER ==========

  return (
    <Container>
      <Title>Upload Supplier Invoice</Title>
      <Subtitle>
        Upload a supplier invoice PDF. We'll automatically detect which supplier it's from
        and parse the items.
      </Subtitle>

      {/* Drop Zone */}
      <DropZone
        className={`${isDragOver ? 'dragover' : ''} ${isLoading ? 'loading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <DropIcon>📄</DropIcon>
        <DropTitle>
          {isLoading ? 'Processing...' : 'Drag and drop your PDF here'}
        </DropTitle>
        <DropText>
          {isLoading ? (
            <>
              {loadingMessage}
              <LoadingDots />
            </>
          ) : (
            'or click the button below to select a file'
          )}
        </DropText>
      </DropZone>

      {/* Buttons */}
      <ButtonGroup>
        <Button className="primary" onClick={handlePickerClick} disabled={isLoading}>
          {isLoading ? 'Processing...' : '📁 Select PDF File'}
        </Button>
      </ButtonGroup>

      {/* Hidden file input */}
      <HiddenFileInput
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileInputChange}
        disabled={isLoading}
      />

      {/* File Info Display */}
      {selectedFile && (
        <FileInfo>
          <div className="file-details">
            <div className="filename">📄 {selectedFile.name}</div>
            <div className="filesize">
              Size: {(selectedFile.size / 1024).toFixed(1)} KB
            </div>
          </div>
          <div className="file-status processing">
            {isLoading ? 'Processing...' : 'Ready'}
          </div>
        </FileInfo>
      )}

      {/* Detection Result Display */}
      {detectionResult && (
        <FileInfo>
          <div className="file-details">
            <div className="filename">
              ✓ Supplier Detected: <strong>{detectionResult.supplier?.name}</strong>
            </div>
            <div className="filesize">
              Confidence: {detectionResult.supplier?.confidence || 'N/A'}%
            </div>
          </div>
          <div className="file-status detected">
            Ready for Review
          </div>
        </FileInfo>
      )}

      {/* Status Messages */}
      {isLoading && (
        <StatusContainer className="loading">
          {loadingMessage}
          <LoadingDots />
        </StatusContainer>
      )}

      {/* Error Display */}
      {error && (
        <StatusContainer className="error">
          ❌ {error}
        </StatusContainer>
      )}
    </Container>
  );
};

export default Step1_Upload;
