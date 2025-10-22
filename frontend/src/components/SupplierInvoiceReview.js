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

const DialogBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const DialogContent = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
`;

const DialogTitle = styled.h2`
  color: ${props => props.theme.colors.text};
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const WarningIcon = styled.span`
  font-size: 1.5rem;
  color: #ff9800;
`;

const DialogMessage = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: 1.5rem;
  line-height: 1.6;
`;

const InvoiceInfo = styled.div`
  background: ${props => props.theme.colors.background};
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  border-left: 4px solid #ff9800;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  font-size: 0.9rem;

  &:last-child {
    border-top: 1px solid ${props => props.theme.colors.border};
    padding-top: 0.75rem;
    margin-top: 0.75rem;
    font-weight: 500;
  }
`;

const DialogButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`;

const DialogButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &.secondary {
    background: ${props => props.theme.colors.border};
    color: ${props => props.theme.colors.text};

    &:hover {
      background: ${props => props.theme.colors.surface};
      border: 1px solid ${props => props.theme.colors.primary};
    }
  }

  &.primary {
    background: #ff9800;
    color: white;

    &:hover {
      background: #f57c00;
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const TestingTools = styled.div`
  background: ${props => props.theme.colors.surface};
  border: 1px solid #ff9800;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const TestingLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
  color: ${props => props.theme.colors.text};
  font-size: 0.9rem;

  input {
    cursor: pointer;
    width: 18px;
    height: 18px;
  }

  &:hover {
    color: ${props => props.theme.colors.primary};
  }
`;

const TestingNote = styled.span`
  color: #ff9800;
  font-size: 0.85rem;
  margin-left: auto;
  font-weight: 500;
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

  // Duplicate invoice detection
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateInvoiceInfo, setDuplicateInvoiceInfo] = useState(null);
  const [pendingInvoiceData, setPendingInvoiceData] = useState(null);

  // Feature flag for testing - can be toggled to disable duplicate check
  const [duplicateCheckEnabled, setDuplicateCheckEnabled] = useState(true);

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

  // Proceed with invoice creation after duplicate check
  const proceedWithInvoiceCreation = async (invoiceData) => {
    try {
      const response = await apiService.createInvoice(invoiceData);
      console.log('Create invoice response:', response);

      if (response.success) {
        // Extract invoice data - handle both wrapped and unwrapped responses
        const responseData = response.data.data ? response.data.data : response.data;
        const invId = responseData.invoice?.id;
        const lineItems = responseData.line_items || responseData.lineItems || [];

        if (!invId) {
          setError('Invoice created but ID not found in response');
          return;
        }

        setInvoiceId(invId);
        setSuccess(`Invoice #${invId} created successfully!`);

        // Move to Step 3: Auto-match supplier items
        setLoadingMessage('Matching supplier items...');

        const matchResponse = await apiService.matchSupplierItems(invId);
        console.log('Match supplier items response:', matchResponse);

        if (matchResponse.success) {
          // Extract match data - handle both wrapped and unwrapped responses
          const matchData = matchResponse.data.data ? matchResponse.data.data : matchResponse.data;
          setSupplierMatchResults(matchData);
          setUnmatchedLineItems(lineItems);
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
    setLoadingMessage('Looking up supplier...');
    setError(null);

    try {
      console.log('Creating invoice with venue ID:', venueId);

      // Step 1: Get supplier ID - either find existing or create new
      let supplierId = null;

      try {
        const suppliersResponse = await apiService.getSuppliers();
        if (suppliersResponse.success && Array.isArray(suppliersResponse.data)) {
          // Try to find exact or partial match
          const matchedSupplier = suppliersResponse.data.find(s =>
            s.sup_name.toLowerCase().includes(supplierName.toLowerCase()) ||
            supplierName.toLowerCase().includes(s.sup_name.toLowerCase())
          );

          if (matchedSupplier) {
            supplierId = matchedSupplier.sup_id;
            console.log('Found existing supplier:', supplierId);
          }
        }
      } catch (err) {
        console.warn('Error fetching suppliers:', err);
      }

      // If supplier not found, create a new one
      if (!supplierId) {
        console.log('Creating new supplier:', supplierName);
        setLoadingMessage('Creating supplier...');

        const createResponse = await apiService.createSupplier({
          sup_name: supplierName,
          sup_active: true
        });

        if (createResponse.success) {
          supplierId = createResponse.data.sup_id || createResponse.data.data?.sup_id;
          console.log('Created new supplier:', supplierId);
        } else {
          setError(`Failed to create supplier: ${createResponse.error}`);
          setLoading(false);
          return;
        }
      }

      setLoadingMessage('Creating invoice...');

      // Calculate totals
      const totalAmount = selectedProducts.reduce((sum, p) => {
        const unitPrice = parseFloat(p.unitCost) || 0;
        const quantity = parseFloat(p.caseSize) || 1;
        return sum + (unitPrice * quantity);
      }, 0);

      // Format line items for backend - use snake_case
      const lineItems = selectedProducts.map((p, index) => {
        const unitPrice = parseFloat(p.unitCost) || 0;
        const quantity = parseFloat(p.caseSize) || 1;
        const lineTotal = unitPrice * quantity;
        const vatAmount = lineTotal * 0.20; // 20% VAT
        const nettPrice = lineTotal;

        return {
          product_code: p.sku || '',
          product_name: p.name || '',
          product_description: p.name || '',
          quantity: quantity,
          unit_price: unitPrice,
          nett_price: nettPrice,
          vat_code: 'S',
          vat_rate: 20,
          vat_amount: vatAmount,
          line_total: lineTotal,
          pack_size: p.packSize || p.caseSize || '',
          unit_size: p.unitSize || ''
        };
      });

      // Format invoice data with snake_case for backend
      const invoiceData = {
        invoice_number: invoiceNumber,
        venue_id: venueId,
        supplier_id: supplierId,
        invoice_date: invoiceDate,
        customer_ref: parsedData?.customerNumber || null,
        delivery_number: parsedData?.deliveryNumber || null,
        total_amount: totalAmount,
        subtotal: totalAmount / 1.20, // Remove VAT to get subtotal
        vat_total: totalAmount - (totalAmount / 1.20),
        currency: 'GBP',
        payment_status: 'pending',
        import_method: 'pdf',
        line_items: lineItems,
        // When duplicate check is disabled (testing mode), allow force creating duplicates
        force_create: !duplicateCheckEnabled
      };

      console.log('Invoice data:', invoiceData);

      // Check for duplicate invoice before creating (if enabled)
      if (duplicateCheckEnabled) {
        setLoadingMessage('Checking for duplicate invoice...');
        const duplicateCheck = await apiService.checkDuplicateInvoice(supplierId, invoiceNumber);
        console.log('Duplicate check result:', duplicateCheck);

        if (duplicateCheck.success && duplicateCheck.data.duplicate) {
          // Show warning dialog
          setDuplicateInvoiceInfo(duplicateCheck.data.existingInvoice);
          setPendingInvoiceData(invoiceData);
          setShowDuplicateWarning(true);
          setLoading(false);
          return;
        }
      } else {
        console.log('Duplicate check disabled for testing');
      }

      // No duplicate (or check disabled), proceed with creation
      await proceedWithInvoiceCreation(invoiceData);
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
      navigate('/');
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
                      const totalItems = matchedItems.length + createdItems.length + failedItems.length;
                      const itemsWithMasterProduct = matchedItems.filter(item => item.masterProductId).length;
                      const itemsNeedingMasterMatch = matchedItems.filter(item => !item.masterProductId).length + createdItems.length;

                      return (
                        <div style={{ background: '#fff', padding: '2rem', borderRadius: '8px', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                          <h2 style={{ marginTop: 0, color: '#333', marginBottom: '1.5rem' }}>Matching Results</h2>

                          {/* Summary Stats */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '6px', textAlign: 'center' }}>
                              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>{totalItems}</div>
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
                              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc3545' }}>{failedItems.length}</div>
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
        // Filter to only show items that failed to match (need manual review)
        const itemsNeedingManualMatch = unmatchedLineItems.filter(item => {
          // Check if this item is in the "failed" category from supplier matching
          if (!supplierMatchResults || !supplierMatchResults.results) return true;

          const failedItems = supplierMatchResults.results.failed || [];
          return failedItems.some(failed => failed.lineItemId === item.id);
        });

        if (itemsNeedingManualMatch.length === 0) {
          // All items matched successfully, skip to summary
          return (
            <>
              <Message $type="success">
                ✓ All products have been successfully matched! Moving to summary...
              </Message>
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <PrimaryButton onClick={() => setCurrentStep(5)}>
                  Continue to Summary →
                </PrimaryButton>
              </div>
            </>
          );
        }

        return (
          <MasterProductMatcher
            invoiceId={invoiceId}
            lineItems={itemsNeedingManualMatch}
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

      {/* Testing Tools - Toggle duplicate check */}
      <TestingTools>
        <TestingLabel>
          <input
            type="checkbox"
            checked={duplicateCheckEnabled}
            onChange={(e) => setDuplicateCheckEnabled(e.target.checked)}
          />
          Enable Duplicate Invoice Check
        </TestingLabel>
        <TestingNote>Testing Mode</TestingNote>
      </TestingTools>

      {renderStep()}

      {/* Duplicate Invoice Warning Dialog */}
      {showDuplicateWarning && duplicateInvoiceInfo && (
        <DialogBackdrop onClick={() => setShowDuplicateWarning(false)}>
          <DialogContent onClick={e => e.stopPropagation()}>
            <DialogTitle>
              <WarningIcon>⚠️</WarningIcon>
              Duplicate Invoice Detected
            </DialogTitle>

            <DialogMessage>
              An invoice with this number from this supplier has already been imported.
              Do you want to import it again?
            </DialogMessage>

            <InvoiceInfo>
              <InfoRow>
                <span>Invoice Number:</span>
                <strong>{duplicateInvoiceInfo.invoiceNumber}</strong>
              </InfoRow>
              <InfoRow>
                <span>Invoice Date:</span>
                <strong>{new Date(duplicateInvoiceInfo.invoiceDate).toLocaleDateString()}</strong>
              </InfoRow>
              <InfoRow>
                <span>Amount:</span>
                <strong>£{parseFloat(duplicateInvoiceInfo.totalAmount).toFixed(2)}</strong>
              </InfoRow>
              <InfoRow>
                <span>Previously Imported:</span>
                <strong>{new Date(duplicateInvoiceInfo.createdAt).toLocaleDateString()}</strong>
              </InfoRow>
            </InvoiceInfo>

            <DialogButtons>
              <DialogButton
                className="secondary"
                onClick={() => {
                  setShowDuplicateWarning(false);
                  setDuplicateInvoiceInfo(null);
                  setPendingInvoiceData(null);
                }}
              >
                Cancel
              </DialogButton>
              <DialogButton
                className="primary"
                onClick={async () => {
                  setShowDuplicateWarning(false);
                  setLoading(true);
                  setLoadingMessage('Creating invoice...');
                  await proceedWithInvoiceCreation(pendingInvoiceData);
                }}
              >
                Import Anyway
              </DialogButton>
            </DialogButtons>
          </DialogContent>
        </DialogBackdrop>
      )}

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
