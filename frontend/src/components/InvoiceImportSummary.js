import React from 'react';
import './InvoiceImportSummary.css';

const InvoiceImportSummary = ({
  invoiceData,
  supplierMatchResults,
  masterProductMatchResults,
  onConfirm,
  onBack,
  onEdit
}) => {

  // Calculate statistics
  const totalLineItems = invoiceData?.lineItems?.length || 0;
  const supplierMatched = supplierMatchResults?.matched || 0;
  const supplierCreated = supplierMatchResults?.created || 0;
  const masterProductMatched = masterProductMatchResults?.results?.filter(r => r.action === 'matched').length || 0;
  const masterProductSkipped = masterProductMatchResults?.results?.filter(r => r.action === 'skipped').length || 0;

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'matched':
        return 'status-matched';
      case 'created':
        return 'status-created';
      case 'skipped':
        return 'status-skipped';
      default:
        return 'status-pending';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'matched':
        return '✓';
      case 'created':
        return '+';
      case 'skipped':
        return '⊗';
      default:
        return '?';
    }
  };

  return (
    <div className="invoice-import-summary">
      <div className="summary-header">
        <h2>Step 5: Import Summary</h2>
        <p>Review the results of your invoice import before confirming</p>
      </div>

      <div className="summary-content">
        {/* Invoice Details */}
        <div className="summary-section">
          <h3>Invoice Details</h3>
          <div className="invoice-details-card">
            <div className="detail-grid">
              <div className="detail-item">
                <strong>Supplier:</strong>
                <span>{invoiceData?.supplierName || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <strong>Invoice Number:</strong>
                <span>{invoiceData?.invoiceNumber || 'Auto-generated'}</span>
              </div>
              <div className="detail-item">
                <strong>Invoice Date:</strong>
                <span>{invoiceData?.invoiceDate || new Date().toLocaleDateString()}</span>
              </div>
              <div className="detail-item">
                <strong>Total Amount:</strong>
                <span>£{parseFloat(invoiceData?.totalAmount || 0).toFixed(2)}</span>
              </div>
              <div className="detail-item">
                <strong>Total Items:</strong>
                <span>{totalLineItems}</span>
              </div>
              <div className="detail-item">
                <strong>Venue:</strong>
                <span>{invoiceData?.venueName || 'Default Venue'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="summary-section">
          <h3>Import Statistics</h3>
          <div className="stats-grid">
            <div className="stat-card stat-total">
              <div className="stat-icon">📦</div>
              <div className="stat-content">
                <div className="stat-value">{totalLineItems}</div>
                <div className="stat-label">Total Items</div>
              </div>
            </div>

            <div className="stat-card stat-matched">
              <div className="stat-icon">✓</div>
              <div className="stat-content">
                <div className="stat-value">{supplierMatched}</div>
                <div className="stat-label">Supplier Matches</div>
              </div>
            </div>

            <div className="stat-card stat-created">
              <div className="stat-icon">+</div>
              <div className="stat-content">
                <div className="stat-value">{supplierCreated}</div>
                <div className="stat-label">New Supplier Items</div>
              </div>
            </div>

            <div className="stat-card stat-master-matched">
              <div className="stat-icon">🔗</div>
              <div className="stat-content">
                <div className="stat-value">{masterProductMatched}</div>
                <div className="stat-label">Master Products Linked</div>
              </div>
            </div>

            <div className="stat-card stat-skipped">
              <div className="stat-icon">⊗</div>
              <div className="stat-content">
                <div className="stat-value">{masterProductSkipped}</div>
                <div className="stat-label">Items Skipped</div>
              </div>
            </div>

            <div className="stat-card stat-completion">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-value">
                  {totalLineItems > 0 ? Math.round((masterProductMatched / totalLineItems) * 100) : 0}%
                </div>
                <div className="stat-label">Completion Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Master Product Matching Details */}
        {masterProductMatchResults?.results && masterProductMatchResults.results.length > 0 && (
          <div className="summary-section">
            <h3>Product Matching Details</h3>
            <div className="matching-details-list">
              {masterProductMatchResults.results.map((result, index) => (
                <div key={index} className="matching-detail-item">
                  <div className="item-header">
                    <span className="item-number">#{index + 1}</span>
                    <span className="item-name">{result.productName}</span>
                    <span className={`status-badge ${getStatusBadgeClass(result.action)}`}>
                      {getStatusIcon(result.action)} {result.action}
                    </span>
                  </div>
                  {result.action === 'matched' && result.matchedTo && (
                    <div className="item-match-info">
                      <span className="match-arrow">→</span>
                      <span className="matched-product">{result.matchedTo}</span>
                      {result.confidenceScore && (
                        <span className="confidence-score">
                          ({result.confidenceScore}% confidence)
                        </span>
                      )}
                    </div>
                  )}
                  {result.action === 'skipped' && (
                    <div className="item-skip-info">
                      <span className="skip-message">⚠ This item was skipped and will need manual matching later</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {masterProductSkipped > 0 && (
          <div className="summary-section">
            <div className="warning-card">
              <div className="warning-header">
                <span className="warning-icon">⚠</span>
                <h4>Attention Required</h4>
              </div>
              <p>
                {masterProductSkipped} item{masterProductSkipped !== 1 ? 's were' : ' was'} skipped during matching.
                These items will be stored in the invoice but won't have master product links.
                You can match them manually later from the invoice details page.
              </p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {masterProductSkipped === 0 && totalLineItems > 0 && (
          <div className="summary-section">
            <div className="success-card">
              <div className="success-header">
                <span className="success-icon">✓</span>
                <h4>Perfect Match!</h4>
              </div>
              <p>
                All {totalLineItems} items have been successfully matched to master products.
                This invoice is ready to be imported into your system.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="summary-actions">
        <button onClick={onBack} className="btn-secondary">
          ← Back
        </button>

        <div className="right-actions">
          {onEdit && (
            <button onClick={onEdit} className="btn-edit">
              Edit Items
            </button>
          )}
          <button onClick={onConfirm} className="btn-primary btn-large">
            Confirm & Complete Import
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceImportSummary;
