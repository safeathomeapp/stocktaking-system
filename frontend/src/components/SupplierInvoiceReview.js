import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import apiService from '../services/apiService';
import MasterProductMatcher from './MasterProductMatcher';
import InvoiceImportSummary from './InvoiceImportSummary';
import API_BASE_URL from '../config/api';

const Container = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  color: ${props => props.theme.colors.text};
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.textSecondary};
`;

const UploadSection = styled.div`
  background: ${props => props.theme.colors.surface};
  border: 2px dashed ${props => props.theme.colors.border};
  border-radius: 8px;
  padding: 3rem;
  text-align: center;
  margin-bottom: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    background: ${props => props.theme.colors.background};
  }

  &.dragging {
    border-color: ${props => props.theme.colors.primary};
    background: ${props => props.theme.colors.primaryLight};
  }
`;

const UploadIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  color: ${props => props.theme.colors.textSecondary};
`;

const UploadText = styled.p`
  color: ${props => props.theme.colors.text};
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
`;

const UploadSubtext = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.9rem;
`;

const FileInput = styled.input`
  display: none;
`;

const SupplierInfo = styled.div`
  background: ${props => props.theme.colors.surface};
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SupplierName = styled.h2`
  color: ${props => props.theme.colors.text};
  margin: 0;
`;

const ProductCount = styled.span`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.95rem;
`;

const ActionsBar = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PrimaryButton = styled(Button)`
  background: ${props => props.theme.colors.primary};
  color: white;

  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.primaryDark};
  }
`;

const SecondaryButton = styled(Button)`
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  border: 1px solid ${props => props.theme.colors.border};

  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.background};
  }
`;

const TableContainer = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: 8px;
  overflow-x: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHead = styled.thead`
  background: ${props => props.theme.colors.background};
`;

const TableRow = styled.tr`
  border-bottom: 1px solid ${props => props.theme.colors.border};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${props => props.theme.colors.background};
  }
`;

const TableHeader = styled.th`
  padding: 1rem;
  text-align: left;
  color: ${props => props.theme.colors.text};
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TableCell = styled.td`
  padding: 1rem;
  color: ${props => props.theme.colors.text};
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 4px;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  font-size: 0.9rem;
  width: 100%;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
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

const LoadingCard = styled.div`
  background: ${props => props.theme.colors.surface};
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
`;

const Spinner = styled.div`
  border: 4px solid ${props => props.theme.colors.border};
  border-top: 4px solid ${props => props.theme.colors.primary};
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const Message = styled.div`
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  background: ${props => props.$type === 'error' ? '#fee' : '#efe'};
  color: ${props => props.$type === 'error' ? '#c33' : '#363'};
  border: 1px solid ${props => props.$type === 'error' ? '#fcc' : '#cfc'};
`;

function SupplierInvoiceReview() {
  const navigate = useNavigate();
  const location = useLocation();

  // Get venue from navigation state (passed from Dashboard)
  const venueId = location.state?.venueId;
  const [venueName, setVenueName] = useState('');

  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Multi-step workflow state
  const [currentStep, setCurrentStep] = useState(1); // 1-5
  const [parsedData, setParsedData] = useState(null);
  const [products, setProducts] = useState([]);
  const [supplierName, setSupplierName] = useState('');

  // Step 2: Invoice metadata
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);

  // Step 3: Created invoice data
  const [invoiceId, setInvoiceId] = useState(null);
  const [supplierMatchResults, setSupplierMatchResults] = useState(null);

  // Step 4: Line items needing master product matching
  const [unmatchedLineItems, setUnmatchedLineItems] = useState([]);
  const [masterProductMatchResults, setMasterProductMatchResults] = useState(null);

  // Load venue name on mount
  useEffect(() => {
    if (!venueId) {
      setError('No venue selected. Please select a venue from the dashboard first.');
      return;
    }
    loadVenue();
  }, [venueId]);

  const loadVenue = async () => {
    try {
      const response = await apiService.getVenues();
      if (response.success) {
        const venue = response.data.find(v => v.id === venueId);
        if (venue) {
          setVenueName(venue.name);
        }
      }
    } catch (err) {
      console.error('Error loading venue:', err);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file');
      return;
    }

    setLoading(true);
    setLoadingMessage('Parsing PDF invoice...');
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      // PDF parsing runs on localhost backend (has pdf-parse library and PostgreSQL database)
      const response = await fetch('http://localhost:3005/api/invoices/parse-supplier-pdf', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse PDF');
      }

      setParsedData(data.data);
      setSupplierName(data.data.supplier);
      setProducts(data.data.products);

      // Pre-populate form fields from parsed data
      if (data.data.invoiceNumber) {
        setInvoiceNumber(data.data.invoiceNumber);
      }
      if (data.data.invoiceDate) {
        setInvoiceDate(data.data.invoiceDate);
      }

      setSuccess(`Successfully parsed ${data.data.totalProducts} products from ${file.name}`);

    } catch (err) {
      console.error('Error parsing PDF:', err);
      setError(err.message || 'Failed to parse PDF');
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (index) => {
    setProducts(products.map((p, i) =>
      i === index ? { ...p, selected: !p.selected } : p
    ));
  };

  const toggleAll = (selected) => {
    setProducts(products.map(p => ({ ...p, selected })));
  };

  const updateProduct = (index, field, value) => {
    setProducts(products.map((p, i) =>
      i === index ? { ...p, [field]: value } : p
    ));
  };

  // Step 2: Create invoice and line items
  const handleCreateInvoice = async () => {
    const selectedProducts = products.filter(p => p.selected);

    if (selectedProducts.length === 0) {
      setError('Please select at least one product');
      return;
    }

    if (!venueId) {
      setError('No venue selected. Please go back to dashboard and select a venue.');
      return;
    }

    setLoading(true);
    setLoadingMessage('Creating invoice...');
    setError(null);

    try {
      console.log('Creating invoice with venue ID:', venueId);

      // Calculate total
      const totalAmount = selectedProducts.reduce((sum, p) => sum + (p.unitCost * p.caseSize), 0);

      const invoiceData = {
        supplierName: supplierName,
        invoiceNumber: invoiceNumber,
        invoiceDate: invoiceDate,
        venueId: venueId,
        totalAmount: totalAmount,
        customerNumber: parsedData.customerNumber || null,
        deliveryNumber: parsedData.deliveryNumber || null,
        lineItems: selectedProducts.map(p => ({
          sku: p.sku,
          name: p.name,
          description: p.name,
          caseSize: p.caseSize || 1,
          unitCost: p.unitCost || 0,
          packSize: p.packSize,
          unitSize: p.unitSize
        }))
      };

      console.log('Invoice data:', invoiceData);

      const response = await apiService.createInvoice(invoiceData);
      console.log('Create invoice response:', response);

      if (response.success) {
        setInvoiceId(response.data.invoice.id);
        setSuccess(`Invoice #${response.data.invoice.id} created successfully!`);

        // Move to Step 3: Auto-match supplier items
        setLoadingMessage('Matching supplier items...');

        const matchResponse = await apiService.matchSupplierItems(response.data.invoice.id);
        console.log('Match supplier items response:', matchResponse);

        if (matchResponse.success) {
          setSupplierMatchResults(matchResponse.data);

          // Get line items that need master product matching (those without master_product_id)
          // For now, we'll load all line items and filter client-side
          // TODO: Add backend endpoint to get unmatched line items
          setUnmatchedLineItems(response.data.lineItems);
          // Stay on current step to show matching results
        } else {
          setError('Invoice created but matching failed: ' + (matchResponse.error || 'Unknown error'));
        }
      } else {
        setError('Failed to create invoice: ' + (response.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error creating invoice:', err);
      setError(err.message || err.toString() || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Complete master product matching
  const handleMasterProductMatchComplete = (results) => {
    setMasterProductMatchResults(results);
    setCurrentStep(5); // Move to summary
  };

  // Step 5: Confirm and complete
  const handleConfirmImport = () => {
    setSuccess('Invoice imported successfully!');

    // Navigate to dashboard after 2 seconds
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  const handleReset = () => {
    setCurrentStep(1);
    setParsedData(null);
    setProducts([]);
    setSupplierName('');
    setInvoiceNumber('');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setInvoiceId(null);
    setSupplierMatchResults(null);
    setUnmatchedLineItems([]);
    setMasterProductMatchResults(null);
    setError(null);
    setSuccess(null);
  };

  const selectedCount = products.filter(p => p.selected).length;

  // Render based on current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
      case 2:
        // Steps 1 & 2: Upload PDF and Review Items
        return (
          <>
            {error && <Message $type="error">{error}</Message>}
            {success && <Message $type="success">{success}</Message>}

            {!parsedData ? (
              // Step 1: Upload
              <UploadSection
                className={dragging ? 'dragging' : ''}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input').click()}
              >
                <UploadIcon>📄</UploadIcon>
                <UploadText>Drag and drop PDF invoice here</UploadText>
                <UploadSubtext>or click to browse files</UploadSubtext>
                <FileInput
                  id="file-input"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                />
              </UploadSection>
            ) : (
              // Step 2: Review and add metadata
              <>
                <SupplierInfo>
                  <div>
                    <SupplierName>{supplierName}</SupplierName>
                    <ProductCount>{parsedData.filename}</ProductCount>
                  </div>
                  <ProductCount>{products.length} products found</ProductCount>
                </SupplierInfo>

                {/* Invoice Metadata Form */}
                <div style={{ background: '#f5f5f5', padding: '1.5rem', borderRadius: '8px', marginBottom: '1rem' }}>
                  <h3 style={{ marginTop: 0, color: '#333' }}>Invoice Details</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                        Invoice Number
                      </label>
                      <Input
                        type="text"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        placeholder="Auto-generated if empty"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                        Invoice Date
                      </label>
                      <Input
                        type="date"
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                        Venue
                      </label>
                      <Input
                        type="text"
                        value={venueName}
                        readOnly
                        style={{ background: '#e9ecef', cursor: 'not-allowed' }}
                      />
                    </div>
                  </div>
                </div>

                {!supplierMatchResults ? (
                  // Show product selection and create invoice button
                  <>
                    <ActionsBar>
                      <SecondaryButton onClick={() => toggleAll(true)}>
                        Select All
                      </SecondaryButton>
                      <SecondaryButton onClick={() => toggleAll(false)}>
                        Deselect All
                      </SecondaryButton>
                      <SecondaryButton onClick={handleReset}>
                        Upload New PDF
                      </SecondaryButton>
                      <PrimaryButton onClick={handleCreateInvoice} disabled={selectedCount === 0}>
                        Create Invoice with Selected ({selectedCount}) →
                      </PrimaryButton>
                    </ActionsBar>

                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableHeader style={{ width: '50px' }}>Include</TableHeader>
                            <TableHeader>SKU</TableHeader>
                            <TableHeader>Product Name</TableHeader>
                            <TableHeader style={{ width: '120px' }}>Pack Size</TableHeader>
                            <TableHeader style={{ width: '120px' }}>Unit Size</TableHeader>
                            <TableHeader style={{ width: '100px' }}>Unit Cost</TableHeader>
                            <TableHeader style={{ width: '100px' }}>Case Size</TableHeader>
                          </TableRow>
                        </TableHead>
                        <tbody>
                          {products.map((product, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Checkbox
                                  type="checkbox"
                                  checked={product.selected}
                                  onChange={() => toggleProduct(index)}
                                />
                              </TableCell>
                              <TableCell>{product.sku}</TableCell>
                              <TableCell>{product.name}</TableCell>
                              <TableCell>
                                <Input
                                  type="text"
                                  value={product.packSize}
                                  onChange={(e) => updateProduct(index, 'packSize', e.target.value)}
                                  placeholder="Pack size"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="text"
                                  value={product.unitSize}
                                  onChange={(e) => updateProduct(index, 'unitSize', e.target.value)}
                                  placeholder="Unit size"
                                />
                              </TableCell>
                              <TableCell>£{product.unitCost.toFixed(2)}</TableCell>
                              <TableCell>{product.caseSize}</TableCell>
                            </TableRow>
                          ))}
                        </tbody>
                      </Table>
                    </TableContainer>
                  </>
                ) : (
                  // Show matching results after invoice creation
                  <>
                    <Message $type="success">
                      ✓ Invoice created successfully! Invoice ID: {invoiceId}
                    </Message>

                    {(() => {
                      const matchedItems = supplierMatchResults.results?.matched || [];
                      const createdItems = supplierMatchResults.results?.created || [];
                      const failedItems = supplierMatchResults.results?.failed || [];
                      const itemsWithMasterProduct = matchedItems.filter(item => item.masterProductId).length;
                      const itemsNeedingMasterMatch = matchedItems.filter(item => !item.masterProductId).length + createdItems.length;

                      return (
                        <div style={{ background: '#fff', padding: '2rem', borderRadius: '8px', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                          <h2 style={{ marginTop: 0, color: '#333', marginBottom: '1.5rem' }}>Matching Results</h2>

                          {/* Summary Stats */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '6px', textAlign: 'center' }}>
                              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>{supplierMatchResults.totalItems}</div>
                              <div style={{ fontSize: '0.9rem', color: '#666' }}>Total Items</div>
                            </div>
                            <div style={{ background: '#d4edda', padding: '1rem', borderRadius: '6px', textAlign: 'center' }}>
                              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>{itemsWithMasterProduct}</div>
                              <div style={{ fontSize: '0.9rem', color: '#666' }}>Fully Matched</div>
                            </div>
                            <div style={{ background: '#fff3cd', padding: '1rem', borderRadius: '6px', textAlign: 'center' }}>
                              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffc107' }}>{itemsNeedingMasterMatch}</div>
                              <div style={{ fontSize: '0.9rem', color: '#666' }}>Need Master Match</div>
                            </div>
                            <div style={{ background: '#f8d7da', padding: '1rem', borderRadius: '6px', textAlign: 'center' }}>
                              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc3545' }}>{supplierMatchResults.failed || 0}</div>
                              <div style={{ fontSize: '0.9rem', color: '#666' }}>Failed</div>
                            </div>
                          </div>

                          {/* Matched Items */}
                          {matchedItems.length > 0 && (
                            <div style={{ marginBottom: '2rem' }}>
                              <h3 style={{ color: '#28a745', marginBottom: '1rem' }}>
                                ✓ Matched to Existing Supplier Items ({matchedItems.length})
                              </h3>
                              <TableContainer>
                                <Table>
                                  <TableHead>
                                    <TableRow>
                                      <TableHeader>Product Name</TableHeader>
                                      <TableHeader>Supplier Item ID</TableHeader>
                                      <TableHeader>Master Product Status</TableHeader>
                                    </TableRow>
                                  </TableHead>
                                  <tbody>
                                    {matchedItems.map((item, index) => (
                                      <TableRow key={index}>
                                        <TableCell>{item.productName}</TableCell>
                                        <TableCell>#{item.supplierItemId}</TableCell>
                                        <TableCell>
                                          {item.masterProductId ? (
                                            <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                                              ✓ Linked to Master #{item.masterProductId}
                                            </span>
                                          ) : (
                                            <span style={{ color: '#ffc107' }}>⚠ Not linked to master product</span>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </tbody>
                                </Table>
                              </TableContainer>
                            </div>
                          )}

                          {/* Created Items */}
                          {createdItems.length > 0 && (
                            <div style={{ marginBottom: '2rem' }}>
                              <h3 style={{ color: '#ffc107', marginBottom: '1rem' }}>
                                + New Supplier Items Created ({createdItems.length})
                              </h3>
                              <TableContainer>
                                <Table>
                                  <TableHead>
                                    <TableRow>
                                      <TableHeader>Product Name</TableHeader>
                                      <TableHeader>Supplier Item ID</TableHeader>
                                      <TableHeader>Status</TableHeader>
                                    </TableRow>
                                  </TableHead>
                                  <tbody>
                                    {createdItems.map((item, index) => (
                                      <TableRow key={index}>
                                        <TableCell>{item.productName}</TableCell>
                                        <TableCell>#{item.supplierItemId}</TableCell>
                                        <TableCell>
                                          <span style={{ color: '#ffc107' }}>Needs master product matching</span>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </tbody>
                                </Table>
                              </TableContainer>
                            </div>
                          )}

                          {/* Failed Items */}
                          {failedItems.length > 0 && (
                            <div style={{ marginBottom: '2rem' }}>
                              <h3 style={{ color: '#dc3545', marginBottom: '1rem' }}>
                                ✗ Failed Items ({failedItems.length})
                              </h3>
                              <TableContainer>
                                <Table>
                                  <TableHead>
                                    <TableRow>
                                      <TableHeader>Product Name</TableHeader>
                                      <TableHeader>Error</TableHeader>
                                    </TableRow>
                                  </TableHead>
                                  <tbody>
                                    {failedItems.map((item, index) => (
                                      <TableRow key={index}>
                                        <TableCell>{item.productName}</TableCell>
                                        <TableCell style={{ color: '#dc3545' }}>{item.error}</TableCell>
                                      </TableRow>
                                    ))}
                                  </tbody>
                                </Table>
                              </TableContainer>
                            </div>
                          )}

                          <ActionsBar>
                            <SecondaryButton onClick={handleReset}>
                              ← Start New Import
                            </SecondaryButton>
                            {itemsNeedingMasterMatch > 0 ? (
                              <PrimaryButton onClick={() => setCurrentStep(4)}>
                                Continue to Master Product Matching ({itemsNeedingMasterMatch} items) →
                              </PrimaryButton>
                            ) : (
                              <PrimaryButton onClick={() => setCurrentStep(5)}>
                                Continue to Summary →
                              </PrimaryButton>
                            )}
                          </ActionsBar>
                        </div>
                      );
                    })()}
                  </>
                )}
              </>
            )}
          </>
        );

      case 4:
        // Step 4: Master Product Matching
        return (
          <MasterProductMatcher
            invoiceId={invoiceId}
            lineItems={unmatchedLineItems}
            onComplete={handleMasterProductMatchComplete}
            onBack={() => setCurrentStep(2)}
          />
        );

      case 5:
        // Step 5: Summary
        return (
          <>
            {error && <Message $type="error">{error}</Message>}
            {success && <Message $type="success">{success}</Message>}

            <InvoiceImportSummary
              invoiceData={{
                supplierName: supplierName,
                invoiceNumber: invoiceNumber,
                invoiceDate: invoiceDate,
                totalAmount: products.filter(p => p.selected).reduce((sum, p) => sum + (p.unitCost * p.caseSize), 0),
                lineItems: products.filter(p => p.selected),
                venueName: venueName
              }}
              supplierMatchResults={supplierMatchResults}
              masterProductMatchResults={masterProductMatchResults}
              onConfirm={handleConfirmImport}
              onBack={() => setCurrentStep(4)}
              onEdit={() => setCurrentStep(2)}
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Container>
      <Header>
        <Title>Supplier Invoice Import</Title>
        <Subtitle>
          {currentStep === 1 && 'Step 1: Upload invoice PDF'}
          {currentStep === 2 && !supplierMatchResults && 'Step 2: Review items and create invoice'}
          {currentStep === 2 && supplierMatchResults && 'Step 2: Invoice created - Review matching results'}
          {currentStep === 4 && 'Step 3: Match products to master catalog'}
          {currentStep === 5 && 'Step 4: Review and confirm import'}
        </Subtitle>
      </Header>

      {renderStep()}

      {loading && (
        <LoadingOverlay>
          <LoadingCard>
            <Spinner />
            <p>{loadingMessage}</p>
          </LoadingCard>
        </LoadingOverlay>
      )}
    </Container>
  );
}

export default SupplierInvoiceReview;
