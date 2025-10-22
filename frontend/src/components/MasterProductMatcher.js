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
            {currentItem.pack_size && (
              <div className="detail-row">
                <strong>Pack:</strong>
                <span>{currentItem.pack_size}</span>
              </div>
            )}
            {currentItem.unit_size && (
              <div className="detail-row">
                <strong>Size:</strong>
                <span>{currentItem.unit_size}</span>
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

      {/* Create new product modal */}
      {showCreateNew && (
        <CreateNewProductModal
          productName={currentItem.product_name}
          productDescription={currentItem.product_description}
          productCode={currentItem.product_code}
          quantity={currentItem.quantity}
          unitPrice={currentItem.unit_price}
          packSize={currentItem.pack_size}
          unitSize={currentItem.unit_size}
          onCancel={() => setShowCreateNew(false)}
          onConfirm={async (newProduct) => {
            try {
              setLoading(true);
              const response = await apiService.linkMasterProduct(currentItem.id, {
                masterProductId: newProduct.id,
                confidenceScore: 100, // User-created match is 100% confident
                verified: true
              });

              if (response.success) {
                // Record as newly created
                setMatchingResults([
                  ...matchingResults,
                  {
                    lineItemId: currentItem.id,
                    productName: currentItem.product_name,
                    matchedTo: newProduct.name,
                    confidenceScore: 100,
                    action: 'created'
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
                        matchedTo: newProduct.name,
                        confidenceScore: 100,
                        action: 'created'
                      }
                    ]
                  });
                }
              } else {
                alert('Failed to create product: ' + response.error);
              }
            } catch (error) {
              console.error('Error creating product:', error);
              alert('Failed to create product');
            } finally {
              setLoading(false);
              setShowCreateNew(false);
            }
          }}
        />
      )}
    </div>
  );
};

// Create New Product Modal Component
const CreateNewProductModal = ({
  productName,
  productDescription,
  productCode,
  quantity,
  unitPrice,
  packSize,
  unitSize,
  onCancel,
  onConfirm
}) => {
  const [categories, setCategories] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  // Use direct invoice data or fall back to parsing if not provided
  const parseInvoiceData = () => {
    const parsed = {
      unit_type: 'bottle',
      unit_size: unitSize || '',
      case_size: packSize || ''
    };

    // If we have direct unit_size and pack_size from invoice, use those
    if (unitSize && packSize) {
      return parsed;
    }

    // Fallback: parse from description if invoice data not provided
    if (productDescription) {
      const desc = productDescription.toLowerCase();

      // Try to detect unit_type
      if (desc.includes('can')) parsed.unit_type = 'can';
      else if (desc.includes('keg')) parsed.unit_type = 'keg';
      else if (desc.includes('case')) parsed.unit_type = 'case';
      else if (desc.includes('pack')) parsed.unit_type = 'pack';
      else if (desc.includes('bag')) parsed.unit_type = 'pack';
      else if (desc.includes('cask')) parsed.unit_type = 'cask';

      // Extract unit_size (ml or g) if not provided directly
      if (!parsed.unit_size) {
        const mlMatch = productDescription.match(/(\d+)\s*ml/i);
        const gMatch = productDescription.match(/(\d+)\s*g\b/i);
        const literMatch = productDescription.match(/(\d+(?:\.\d+)?)\s*[Ll]/);

        if (mlMatch) {
          parsed.unit_size = mlMatch[1];
        } else if (literMatch) {
          // Convert liters to ml
          parsed.unit_size = Math.round(parseFloat(literMatch[1]) * 1000);
        } else if (gMatch) {
          parsed.unit_size = gMatch[1];
        }
      }

      // Extract case_size if not provided directly
      if (!parsed.case_size) {
        const caseMatch = productDescription.match(/(?:^|\s)(\d+)\s*x\s*\d+/i) ||
                         productDescription.match(/x\s*(\d+)$/i) ||
                         productDescription.match(/(?:case|pack)\s+(?:of\s+)?(\d+)/i);
        if (caseMatch) {
          parsed.case_size = caseMatch[1];
        }
      }
    }

    return parsed;
  };

  const parsedInvoiceData = parseInvoiceData();

  const [formData, setFormData] = React.useState({
    name: productName,
    brand: '',
    category: '',
    unit_type: parsedInvoiceData.unit_type,
    unit_size: parsedInvoiceData.unit_size,
    case_size: parsedInvoiceData.case_size,
    barcode: ''
  });

  // Load categories on mount
  React.useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await apiService.getMasterProductCategories();
        if (response.success && response.data) {
          // Extract unique categories
          const uniqueCategories = Array.from(
            new Set(response.data.map(item => item.category))
          ).filter(Boolean).sort();
          setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    loadCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.unit_type) {
      alert('Product name and unit type are required');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.createMasterProduct({
        name: formData.name,
        brand: formData.brand || null,
        category: formData.category || null,
        unit_type: formData.unit_type,
        unit_size: formData.unit_size ? parseInt(formData.unit_size) : null,
        case_size: formData.case_size ? parseInt(formData.case_size) : null,
        barcode: formData.barcode || null
      });

      if (response.success) {
        onConfirm(response.data.data || response.data);
      } else {
        alert('Failed to create product: ' + response.error);
      }
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Failed to create product: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Create New Master Product</h3>
        <form onSubmit={handleSubmit} className="create-product-form">
          <div className="form-group">
            <label htmlFor="name">Product Name *</label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Coke Zero"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="brand">Brand</label>
            <input
              id="brand"
              type="text"
              name="brand"
              value={formData.brand}
              onChange={handleInputChange}
              placeholder="e.g., Coca-Cola"
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
            >
              <option value="">-- Select Category --</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="unit_type">Unit Type *</label>
              <select
                id="unit_type"
                name="unit_type"
                value={formData.unit_type}
                onChange={handleInputChange}
                required
              >
                <option value="bottle">Bottle</option>
                <option value="can">Can</option>
                <option value="keg">Keg</option>
                <option value="case">Case</option>
                <option value="pack">Pack</option>
                <option value="cask">Cask</option>
                <option value="bag-in-box">Bag in Box</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="unit_size">Unit Size (ml or g)</label>
              <input
                id="unit_size"
                type="number"
                name="unit_size"
                value={formData.unit_size}
                onChange={handleInputChange}
                placeholder="e.g., 330"
              />
            </div>

            <div className="form-group">
              <label htmlFor="case_size">Case Size</label>
              <input
                id="case_size"
                type="number"
                name="case_size"
                value={formData.case_size}
                onChange={handleInputChange}
                placeholder="e.g., 24"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="barcode">Barcode</label>
            <input
              id="barcode"
              type="text"
              name="barcode"
              value={formData.barcode}
              onChange={handleInputChange}
              placeholder="e.g., 5000112545654"
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MasterProductMatcher;
