import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from '../styles/components/Button';
import { Container } from '../styles/GlobalStyles';
import apiService from '../services/apiService';

const InvoiceContainer = styled(Container)`
  padding-top: ${props => props.theme.spacing.lg};
  padding-bottom: ${props => props.theme.spacing.xl};
  min-height: 100vh;
  background: linear-gradient(135deg, ${props => props.theme.colors.background} 0%, #F0F9FF 100%);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin: 0;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 2.5rem;
  }
`;

const FormSection = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: 16px;
  padding: ${props => props.theme.spacing.xxl};
  box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.1);
  border: 1px solid ${props => props.theme.colors.border};
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.lg} 0;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${props => props.theme.spacing.lg};

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
`;

const Input = styled.input`
  padding: ${props => props.theme.spacing.md};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  font-size: 1rem;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:disabled {
    background: #F3F4F6;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  padding: ${props => props.theme.spacing.md};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  font-size: 1rem;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:disabled {
    background: #F3F4F6;
    cursor: not-allowed;
  }
`;

const SearchSection = styled.div`
  margin-top: ${props => props.theme.spacing.xl};
`;

const SearchBox = styled.div`
  position: relative;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const SearchResults = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  margin-top: ${props => props.theme.spacing.xs};
  max-height: 300px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const SearchResultItem = styled.div`
  padding: ${props => props.theme.spacing.md};
  cursor: pointer;
  border-bottom: 1px solid ${props => props.theme.colors.border};

  &:hover {
    background: rgba(59, 130, 246, 0.05);
  }

  &:last-child {
    border-bottom: none;
  }
`;

const ItemName = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const ItemDetails = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.textSecondary};
`;

const LineItemsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: ${props => props.theme.spacing.lg};
`;

const TableHeader = styled.thead`
  background: #F3F4F6;
`;

const TableRow = styled.tr`
  border-bottom: 1px solid ${props => props.theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

const TableHeaderCell = styled.th`
  padding: ${props => props.theme.spacing.md};
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
`;

const TableCell = styled.td`
  padding: ${props => props.theme.spacing.md};
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text};
`;

const SmallInput = styled(Input)`
  width: 80px;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
`;

const RemoveButton = styled(Button)`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  font-size: 0.875rem;
  background: ${props => props.theme.colors.error};

  &:hover {
    background: #DC2626;
  }
`;

const TotalsSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-top: ${props => props.theme.spacing.xl};
  padding-top: ${props => props.theme.spacing.lg};
  border-top: 2px solid ${props => props.theme.colors.border};
`;

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${props => props.theme.spacing.xxl};
  margin-bottom: ${props => props.theme.spacing.sm};
  font-size: 1rem;
  color: ${props => props.theme.colors.text};

  ${props => props.$isFinal && `
    font-size: 1.25rem;
    font-weight: 700;
    color: ${props.theme.colors.primary};
    margin-top: ${props.theme.spacing.md};
  `}
`;

const ErrorMessage = styled.div`
  background: #FEE2E2;
  border: 1px solid #FCA5A5;
  color: #DC2626;
  padding: ${props => props.theme.spacing.md};
  border-radius: 8px;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const SuccessMessage = styled.div`
  background: #D1FAE5;
  border: 1px solid #86EFAC;
  color: #059669;
  padding: ${props => props.theme.spacing.md};
  border-radius: 8px;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.xl};
`;

const ManualInvoiceEntry = () => {
  const navigate = useNavigate();
  const { venueId } = useParams();

  // State
  const [venueName, setVenueName] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Invoice form data
  const [invoiceData, setInvoiceData] = useState({
    venue_id: venueId || '',
    supplier_id: '',
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    date_ordered: '',
    date_delivered: '',
    delivery_number: '',
    customer_ref: '',
    notes: ''
  });

  // Line items
  const [lineItems, setLineItems] = useState([]);

  // Load venue and suppliers
  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Verify venue ID is provided
      if (!venueId) {
        setError('No venue selected. Please select a venue from the dashboard.');
        setLoading(false);
        return;
      }

      // Load venue details
      const venueResult = await apiService.getVenueById(venueId);
      if (venueResult.success && venueResult.data.venue) {
        setVenueName(venueResult.data.venue.name);
      } else {
        setError('Failed to load venue details');
      }

      // Load suppliers
      const suppliersResult = await apiService.getSuppliers();
      if (suppliersResult.success) {
        setSuppliers(suppliersResult.data);
      }

      setLoading(false);
    } catch (err) {
      setError('Failed to load initial data: ' + err.message);
      setLoading(false);
    }
  };

  // Search for products when search term changes
  useEffect(() => {
    if (!searchTerm || !invoiceData.supplier_id) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const delaySearch = setTimeout(async () => {
      try {
        const result = await apiService.getSupplierItems(invoiceData.supplier_id, searchTerm);
        if (result.success && result.data.items) {
          setSearchResults(result.data.items);
          setShowSearchResults(true);
        }
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchTerm, invoiceData.supplier_id]);

  const handleInputChange = (field, value) => {
    setInvoiceData(prev => ({ ...prev, [field]: value }));
  };

  const addLineItem = (item) => {
    const newItem = {
      supplier_item_list_id: item.id,
      master_product_id: item.master_product_id,
      product_code: item.supplier_sku || '',
      product_name: item.supplier_name || '',
      product_description: item.supplier_description || '',
      quantity: 1,
      unit_price: parseFloat(item.unit_cost) || 0,
      nett_price: parseFloat(item.unit_cost) || 0,
      vat_rate: 20,
      vat_code: 'S'
    };

    // Calculate line totals
    const lineTotal = newItem.quantity * newItem.nett_price;
    const vatAmount = lineTotal * (newItem.vat_rate / 100);

    newItem.line_total = lineTotal;
    newItem.vat_amount = vatAmount;

    setLineItems(prev => [...prev, newItem]);
    setSearchTerm('');
    setShowSearchResults(false);
  };

  const updateLineItem = (index, field, value) => {
    setLineItems(prev => {
      const updated = [...prev];
      updated[index][field] = field === 'quantity' || field === 'unit_price' || field === 'nett_price' || field === 'vat_rate'
        ? parseFloat(value) || 0
        : value;

      // Recalculate totals
      const item = updated[index];
      item.line_total = item.quantity * item.nett_price;
      item.vat_amount = item.line_total * (item.vat_rate / 100);

      return updated;
    });
  };

  const removeLineItem = (index) => {
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.line_total, 0);
    const vatTotal = lineItems.reduce((sum, item) => sum + item.vat_amount, 0);
    const total = subtotal + vatTotal;

    return { subtotal, vatTotal, total };
  };

  const handleSaveInvoice = async () => {
    try {
      setError(null);
      setSuccess(null);
      setLoading(true);

      // Validate
      if (!invoiceData.supplier_id || !invoiceData.invoice_date) {
        setError('Please fill in all required fields (Supplier, Invoice Date)');
        setLoading(false);
        return;
      }

      if (lineItems.length === 0) {
        setError('Please add at least one line item');
        setLoading(false);
        return;
      }

      const { subtotal, vatTotal, total } = calculateTotals();

      const payload = {
        ...invoiceData,
        subtotal,
        vat_total: vatTotal,
        total_amount: total,
        currency: 'GBP',
        payment_status: 'pending',
        line_items: lineItems
      };

      const result = await apiService.createManualInvoice(payload);

      if (result.success) {
        setSuccess('Invoice created successfully! Redirecting to dashboard...');
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        setError(result.error || 'Failed to create invoice');
      }

      setLoading(false);
    } catch (err) {
      setError('Error saving invoice: ' + err.message);
      setLoading(false);
    }
  };

  const { subtotal, vatTotal, total } = calculateTotals();

  return (
    <InvoiceContainer>
      <Header>
        <Title>Manual Invoice Entry</Title>
        <Button onClick={() => navigate(-1)} $variant="secondary">
          Back
        </Button>
      </Header>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      {/* Invoice Header */}
      <FormSection>
        <SectionTitle>Invoice Details</SectionTitle>
        <FormGrid>
          <FormGroup>
            <Label>Venue</Label>
            <Input
              type="text"
              value={venueName}
              disabled
              placeholder="Loading venue..."
            />
          </FormGroup>

          <FormGroup>
            <Label>Supplier *</Label>
            <Select
              value={invoiceData.supplier_id}
              onChange={(e) => handleInputChange('supplier_id', e.target.value)}
            >
              <option value="">Select supplier...</option>
              {suppliers.map(supplier => (
                <option key={supplier.sup_id} value={supplier.sup_id}>
                  {supplier.sup_name}
                </option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Invoice Number</Label>
            <Input
              type="text"
              value={invoiceData.invoice_number}
              onChange={(e) => handleInputChange('invoice_number', e.target.value)}
              placeholder="INV-001"
            />
          </FormGroup>

          <FormGroup>
            <Label>Invoice Date *</Label>
            <Input
              type="date"
              value={invoiceData.invoice_date}
              onChange={(e) => handleInputChange('invoice_date', e.target.value)}
            />
          </FormGroup>

          <FormGroup>
            <Label>Date Ordered</Label>
            <Input
              type="date"
              value={invoiceData.date_ordered}
              onChange={(e) => handleInputChange('date_ordered', e.target.value)}
            />
          </FormGroup>

          <FormGroup>
            <Label>Date Delivered</Label>
            <Input
              type="date"
              value={invoiceData.date_delivered}
              onChange={(e) => handleInputChange('date_delivered', e.target.value)}
            />
          </FormGroup>

          <FormGroup>
            <Label>Delivery Number</Label>
            <Input
              type="text"
              value={invoiceData.delivery_number}
              onChange={(e) => handleInputChange('delivery_number', e.target.value)}
              placeholder="DEL-001"
            />
          </FormGroup>

          <FormGroup>
            <Label>Customer Reference</Label>
            <Input
              type="text"
              value={invoiceData.customer_ref}
              onChange={(e) => handleInputChange('customer_ref', e.target.value)}
            />
          </FormGroup>
        </FormGrid>

        <FormGroup style={{ marginTop: '1.5rem' }}>
          <Label>Notes</Label>
          <Input
            type="text"
            value={invoiceData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Additional notes..."
          />
        </FormGroup>
      </FormSection>

      {/* Line Items */}
      <FormSection>
        <SectionTitle>Line Items</SectionTitle>

        {invoiceData.supplier_id && (
          <SearchSection>
            <SearchBox>
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by product name or SKU..."
                onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
              />

              {showSearchResults && searchResults.length > 0 && (
                <SearchResults>
                  {searchResults.map(item => (
                    <SearchResultItem
                      key={item.id}
                      onClick={() => addLineItem(item)}
                    >
                      <ItemName>{item.supplier_name}</ItemName>
                      <ItemDetails>
                        SKU: {item.supplier_sku || 'N/A'} |
                        Price: £{parseFloat(item.unit_cost || 0).toFixed(2)} |
                        {item.supplier_size && ` Size: ${item.supplier_size}`}
                      </ItemDetails>
                    </SearchResultItem>
                  ))}
                </SearchResults>
              )}
            </SearchBox>
          </SearchSection>
        )}

        {!invoiceData.supplier_id && (
          <ErrorMessage>Please select a supplier first to search for products</ErrorMessage>
        )}

        {lineItems.length > 0 && (
          <>
            <LineItemsTable>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Product</TableHeaderCell>
                  <TableHeaderCell>SKU</TableHeaderCell>
                  <TableHeaderCell>Qty</TableHeaderCell>
                  <TableHeaderCell>Unit Price</TableHeaderCell>
                  <TableHeaderCell>VAT %</TableHeaderCell>
                  <TableHeaderCell>Line Total</TableHeaderCell>
                  <TableHeaderCell>Action</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <tbody>
                {lineItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell>{item.product_code}</TableCell>
                    <TableCell>
                      <SmallInput
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <SmallInput
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.nett_price}
                        onChange={(e) => updateLineItem(index, 'nett_price', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <SmallInput
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.vat_rate}
                        onChange={(e) => updateLineItem(index, 'vat_rate', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>£{item.line_total.toFixed(2)}</TableCell>
                    <TableCell>
                      <RemoveButton onClick={() => removeLineItem(index)}>
                        Remove
                      </RemoveButton>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </LineItemsTable>

            <TotalsSection>
              <TotalRow>
                <span>Subtotal:</span>
                <span>£{subtotal.toFixed(2)}</span>
              </TotalRow>
              <TotalRow>
                <span>VAT:</span>
                <span>£{vatTotal.toFixed(2)}</span>
              </TotalRow>
              <TotalRow $isFinal>
                <span>Total:</span>
                <span>£{total.toFixed(2)}</span>
              </TotalRow>
            </TotalsSection>
          </>
        )}

        <ButtonGroup>
          <Button
            onClick={handleSaveInvoice}
            disabled={loading || lineItems.length === 0}
          >
            {loading ? 'Saving...' : 'Create Invoice'}
          </Button>
          <Button
            $variant="secondary"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
        </ButtonGroup>
      </FormSection>
    </InvoiceContainer>
  );
};

export default ManualInvoiceEntry;
