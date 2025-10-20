import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import './MasterProductMatcher.css';

const MasterProductMatcher = ({ invoiceId, lineItems, onComplete, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matchingResults, setMatchingResults] = useState([]);
  const [showCreateNew, setShowCreateNew] = useState(false);

  const currentItem = lineItems[currentIndex];
  const progress = ((currentIndex) / lineItems.length) * 100;

  // Load fuzzy matches for current item
  useEffect(() => {
    if (currentItem) {
      loadMatches();
    }
  }, [currentIndex]);

  const loadMatches = async () => {
    setLoading(true);
    setSelectedMatch(null);
    setMatches([]);

    try {
      const response = await apiService.fuzzyMatchMasterProduct({
        productName: currentItem.product_name,
        productDescription: currentItem.product_description,
        limit: 5
      });

      if (response.success) {
        setMatches(response.data.matches);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
      alert('Failed to load product matches');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMatch = (match) => {
    setSelectedMatch(match);
    setShowCreateNew(false);
  };

  const handleConfirmMatch = async () => {
    if (!selectedMatch) {
      alert('Please select a match');
      return;
    }

    setLoading(true);

    try {
      const response = await apiService.linkMasterProduct(currentItem.id, {
        masterProductId: selectedMatch.id,
        confidenceScore: selectedMatch.confidenceScore,
        verified: true
      });

      if (response.success) {
        // Record the result
        setMatchingResults([
          ...matchingResults,
          {
            lineItemId: currentItem.id,
            productName: currentItem.product_name,
            matchedTo: selectedMatch.productName,
            confidenceScore: selectedMatch.confidenceScore,
            action: 'matched'
          }
        ]);

        // Move to next item or complete
        if (currentIndex < lineItems.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          onComplete({
            invoiceId,
            results: [
              ...matchingResults,
              {
                lineItemId: currentItem.id,
                productName: currentItem.product_name,
                matchedTo: selectedMatch.productName,
                confidenceScore: selectedMatch.confidenceScore,
                action: 'matched'
              }
            ]
          });
        }
      }
    } catch (error) {
      console.error('Error confirming match:', error);
      alert('Failed to confirm match');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Record as skipped
    setMatchingResults([
      ...matchingResults,
      {
        lineItemId: currentItem.id,
        productName: currentItem.product_name,
        action: 'skipped'
      }
    ]);

    // Move to next or complete
    if (currentIndex < lineItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete({
        invoiceId,
        results: [
          ...matchingResults,
          {
            lineItemId: currentItem.id,
            productName: currentItem.product_name,
            action: 'skipped'
          }
        ]
      });
    }
  };

  const handleCreateNew = () => {
    setShowCreateNew(true);
    setSelectedMatch(null);
  };

  const getConfidenceBadgeClass = (score) => {
    if (score >= 80) return 'confidence-high';
    if (score >= 50) return 'confidence-medium';
    return 'confidence-low';
  };

  if (!currentItem) {
    return (
      <div className="master-product-matcher">
        <div className="empty-state">
          <p>No items to match</p>
          <button onClick={onBack} className="btn-secondary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="master-product-matcher">
      <div className="matcher-header">
        <h2>Step 4: Match Products to Master Catalog</h2>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="progress-text">
          Item {currentIndex + 1} of {lineItems.length}
        </p>
      </div>

      <div className="matcher-content">
        {/* Current item info */}
        <div className="current-item-card">
          <h3>Invoice Item to Match:</h3>
          <div className="item-details">
            <div className="detail-row">
              <strong>Product Name:</strong>
              <span>{currentItem.product_name}</span>
            </div>
            {currentItem.product_code && (
              <div className="detail-row">
                <strong>SKU:</strong>
                <span>{currentItem.product_code}</span>
              </div>
            )}
            {currentItem.product_description && (
              <div className="detail-row">
                <strong>Description:</strong>
                <span>{currentItem.product_description}</span>
              </div>
            )}
            <div className="detail-row">
              <strong>Quantity:</strong>
              <span>{currentItem.quantity}</span>
            </div>
            <div className="detail-row">
              <strong>Unit Price:</strong>
              <span>£{parseFloat(currentItem.unit_price || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Suggested matches */}
        <div className="matches-section">
          <h3>Suggested Matches from Master Catalog:</h3>

          {loading ? (
            <div className="loading">Searching for matches...</div>
          ) : matches.length > 0 ? (
            <div className="matches-list">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className={`match-card ${selectedMatch?.id === match.id ? 'selected' : ''}`}
                  onClick={() => handleSelectMatch(match)}
                >
                  <div className="match-header">
                    <h4>{match.productName}</h4>
                    <span className={`confidence-badge ${getConfidenceBadgeClass(match.confidenceScore)}`}>
                      {match.confidenceScore}% match
                    </span>
                  </div>
                  <div className="match-details">
                    {match.brand && (
                      <div className="match-detail">
                        <strong>Brand:</strong> {match.brand}
                      </div>
                    )}
                    {match.category && (
                      <div className="match-detail">
                        <strong>Category:</strong> {match.category}
                      </div>
                    )}
                    {match.unitSize && match.unitType && (
                      <div className="match-detail">
                        <strong>Size:</strong> {match.unitSize} {match.unitType}
                      </div>
                    )}
                    {match.caseSize && (
                      <div className="match-detail">
                        <strong>Case Size:</strong> {match.caseSize}
                      </div>
                    )}
                    {match.barcode && (
                      <div className="match-detail">
                        <strong>Barcode:</strong> {match.barcode}
                      </div>
                    )}
                  </div>
                  {selectedMatch?.id === match.id && (
                    <div className="selected-indicator">
                      ✓ Selected
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-matches">
              <p>No similar products found in master catalog</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="matcher-actions">
          <button
            onClick={onBack}
            className="btn-secondary"
            disabled={loading}
          >
            ← Back
          </button>

          <div className="right-actions">
            <button
              onClick={handleSkip}
              className="btn-skip"
              disabled={loading}
            >
              Skip for Now
            </button>

            <button
              onClick={handleCreateNew}
              className="btn-create"
              disabled={loading}
            >
              Create New Product
            </button>

            <button
              onClick={handleConfirmMatch}
              className="btn-primary"
              disabled={loading || !selectedMatch}
            >
              Confirm Match →
            </button>
          </div>
        </div>
      </div>

      {/* Create new product modal (placeholder for future) */}
      {showCreateNew && (
        <div className="modal-overlay" onClick={() => setShowCreateNew(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Master Product</h3>
            <p>This feature will be implemented next.</p>
            <p>Product: {currentItem.product_name}</p>
            <button onClick={() => setShowCreateNew(false)} className="btn-primary">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterProductMatcher;
