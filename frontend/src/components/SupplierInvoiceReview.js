import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import apiService from '../services/apiService';
import MasterProductMatcher from './MasterProductMatcher';
import InvoiceImportSummary from './InvoiceImportSummary';
import IgnoreItemsConfirmation from './IgnoreItemsConfirmation';
import CategoryProductsDisplay from './CategoryProductsDisplay';
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

  // Category support (from PDF parser)
  // Categories enable hierarchical product display with parent/child checkbox logic
  const [categories, setCategories] = useState([]); // Array of {name, itemCount, subtotal, ignoredCount}
  const [hasCategories, setHasCategories] = useState(false); // Flag to show/hide category features
  const [ignoredItemsByCategory, setIgnoredItemsByCategory] = useState({}); // Map of categoryName -> count

  // Step 2: Invoice metadata
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);

  // Step 3: Created invoice data
  const [invoiceId, setInvoiceId] = useState(null);
  const [supplierId, setSupplierId] = useState(null);
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

  // Ignore items confirmation
  const [showIgnoreConfirmation, setShowIgnoreConfirmation] = useState(false);
  const [uncheckedItemsForIgnore, setUncheckedItemsForIgnore] = useState([]);
  const [pendingContinueCallback, setPendingContinueCallback] = useState(null);

  // Venue ignored items
  const [ignoredProductSkus, setIgnoredProductSkus] = useState([]);
  const [hiddenProductsCount, setHiddenProductsCount] = useState(0);

  // Track user-deselected items for summary display
  const [userIgnoredItemsCount, setUserIgnoredItemsCount] = useState(0);

  // Load venue name on mount
  useEffect(() => {
    if (!venueId) {
      setError('No venue selected. Please select a venue from the dashboard first.');
      return;
    }
    loadVenue();
  }, [venueId]);

  // Query and count ignored items by category when supplierId changes
  useEffect(() => {
    if (!supplierId || !venueId || categories.length === 0) {
      return; // Need all three to calculate ignored counts
    }

    const queryIgnoredItems = async () => {
      try {
        // Fetch ignored items for this venue
        const response = await apiService.get(`/venues/${venueId}/ignored-items`);

        if (response.success && response.data && Array.isArray(response.data)) {
          // Build a map of category -> count of ignored items
          const ignoredByCategory = {};

          // For each ignored item, find which category it belongs to
          for (const ignoredItem of response.data) {
            // Find the product in our products array that matches this ignored SKU
            const product = products.find(p => p.sku === ignoredItem.product_sku);

            if (product && product.category) {
              // Increment count for this category
              ignoredByCategory[product.category] = (ignoredByCategory[product.category] || 0) + 1;
            }
          }

          // Update categories array to include ignored count
          setIgnoredItemsByCategory(ignoredByCategory);

          // Add ignored count to categories
          const updatedCategories = categories.map(cat => ({
            ...cat,
            ignoredCount: ignoredByCategory[cat.name] || 0
          }));
          setCategories(updatedCategories);
        }
      } catch (err) {
        console.warn('Error querying ignored items:', err);
        // Continue without ignored counts - not critical
      }
    };

    queryIgnoredItems();
  }, [supplierId, venueId, categories.length]); // Re-run if these change

  // Look up or create supplier when supplier name is known
  useEffect(() => {
    if (!supplierName || supplierId) {
      // Skip if no supplierName or already have supplierId
      return;
    }

    const fetchOrCreateSupplier = async () => {
      try {
        const suppliersResponse = await apiService.getSuppliers();
        if (suppliersResponse.success && Array.isArray(suppliersResponse.data)) {
          // Try to find exact or partial match
          const matchedSupplier = suppliersResponse.data.find(s =>
            s.sup_name.toLowerCase().includes(supplierName.toLowerCase()) ||
            supplierName.toLowerCase().includes(s.sup_name.toLowerCase())
          );

          if (matchedSupplier) {
            setSupplierId(matchedSupplier.sup_id);
            return;
          }
        }
      } catch (err) {
        console.warn('Error fetching suppliers:', err);
      }

      // If not found, create new supplier
      try {
        const createResponse = await apiService.createSupplier({
          sup_name: supplierName,
          sup_active: true
        });

        if (createResponse.success) {
          const newSupplierId = createResponse.data.sup_id || createResponse.data.data?.sup_id;
          if (newSupplierId) {
            setSupplierId(newSupplierId);
          }
        }
      } catch (err) {
        console.warn('Error creating supplier:', err);
      }
    };

    fetchOrCreateSupplier();
  }, [supplierName]);

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

      // Pre-populate form fields from parsed data
      if (data.data.invoiceNumber) {
        setInvoiceNumber(data.data.invoiceNumber);
      }
      if (data.data.invoiceDate) {
        setInvoiceDate(data.data.invoiceDate);
      }

      // Filter out previously ignored items for this supplier/venue
      const supplierName = data.data.supplier;
      let filteredProducts = data.data.products;
      let hiddenCount = 0;


      try {
        // Determine supplier ID
        let supplierId = null;
        try {
          const suppliersResponse = await apiService.getSuppliers();
          if (suppliersResponse.success && Array.isArray(suppliersResponse.data)) {
            const matchedSupplier = suppliersResponse.data.find(s =>
              s.sup_name.toLowerCase().includes(supplierName.toLowerCase()) ||
              supplierName.toLowerCase().includes(s.sup_name.toLowerCase())
            );
            if (matchedSupplier) {
              supplierId = matchedSupplier.sup_id;
            }
          }
        } catch (err) {
          console.warn('Error fetching suppliers for ignored items check:', err);
        }

        // If we found a supplier, check for ignored items
        if (supplierId) {
          const ignoredResponse = await apiService.checkVenueIgnoredItems(venueId, supplierId);
          if (ignoredResponse.success) {
            // API wraps response under 'data' property
            const ignoredSkus = ignoredResponse.data?.ignoredSkus || [];
            if (ignoredSkus.length > 0) {
              filteredProducts = data.data.products.filter(
                p => !ignoredSkus.includes(p.sku)
              );
              hiddenCount = data.data.products.length - filteredProducts.length;
              setIgnoredProductSkus(ignoredSkus);
            }
          }
        }
      } catch (err) {
        console.warn('Error checking ignored items during PDF parsing:', err);
      }

      // Always set hiddenProductsCount (even if 0) to reset from previous imports
      setHiddenProductsCount(hiddenCount);
      setProducts(filteredProducts);

      // Extract and store categories from parsed data (if available)
      // Categories enable hierarchical product display with collapsible groups
      if (data.data.categories && Array.isArray(data.data.categories) && data.data.categories.length > 0) {
        setCategories(data.data.categories);
        setHasCategories(true);
        console.log(`Loaded ${data.data.categories.length} categories from PDF`);
      } else {
        setCategories([]);
        setHasCategories(false);
      }

      setSuccess(`Successfully parsed ${filteredProducts.length} products from ${file.name}${hiddenCount > 0 ? ` (${hiddenCount} previously ignored)` : ''}`);

    } catch (err) {
      console.error('Error parsing PDF:', err);
      setError(err.message || 'Failed to parse PDF');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggle individual product selection
   * If categories exist, this also updates category parent checkbox state
   */
  const toggleProduct = (index) => {
    setProducts(products.map((p, i) =>
      i === index ? { ...p, selected: !p.selected } : p
    ));
  };

  /**
   * Toggle all products in a specific category
   * When category checkbox is clicked, all products in that category are toggled
   *
   * LOGIC:
   * - Find all products with matching category name
   * - Set their selected state to the provided newState
   * - Maintains hierarchical structure
   */
  const toggleCategory = (categoryName, newState) => {
    setProducts(products.map(p =>
      p.category === categoryName ? { ...p, selected: newState } : p
    ));
  };

  /**
   * Toggle all products (Select All / Deselect All buttons)
   * Only available when categories are NOT being used
   * When categories are present, use toggleCategory instead for granular control
   */
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

        if (matchResponse.success) {
          // Extract match data - handle both wrapped and unwrapped responses
          const matchData = matchResponse.data.data ? matchResponse.data.data : matchResponse.data;
          setSupplierMatchResults(matchData);
          setUnmatchedLineItems(lineItems);

          // Update products array with masterProductId from matched suppliers
          // Create a map of productName to masterProductId (since frontend products don't have database lineItemIds)
          const masterProductMap = {};
          const results = matchData.results;

          if (results) {
            if (results.matched && Array.isArray(results.matched)) {
              results.matched.forEach(item => {
                if (item.productName && item.masterProductId) {
                  masterProductMap[item.productName] = item.masterProductId;
                }
              });
            }
            if (results.created && Array.isArray(results.created)) {
              results.created.forEach(item => {
                if (item.productName && item.masterProductId) {
                  masterProductMap[item.productName] = item.masterProductId;
                }
              });
            }
          }

          // Update products with masterProductId using product name as key
          if (Object.keys(masterProductMap).length > 0) {
            setProducts(prevProducts =>
              prevProducts.map(product => ({
                ...product,
                masterProductId: masterProductMap[product.productName] || product.masterProductId
              }))
            );
          }

          // Navigate to Step 4: Master Product Matching
          setCurrentStep(4);
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

    // Capture user ignored count BEFORE modifying products array
    const userIgnoredCount = products.filter(p => !p.selected).length;
    setUserIgnoredItemsCount(userIgnoredCount);

    setLoading(true);
    setLoadingMessage('Looking up supplier...');
    setError(null);

    try {
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
          }
        }
      } catch (err) {
        console.warn('Error fetching suppliers:', err);
      }

      // If supplier not found, create a new one
      if (!supplierId) {
        setLoadingMessage('Creating supplier...');

        const createResponse = await apiService.createSupplier({
          sup_name: supplierName,
          sup_active: true
        });

        if (createResponse.success) {
          supplierId = createResponse.data.sup_id || createResponse.data.data?.sup_id;
        } else {
          setError(`Failed to create supplier: ${createResponse.error}`);
          setLoading(false);
          return;
        }
      }

      // Note: Ignored items already filtered in PDF parsing (Step 1)
      // No need to filter again here - hiddenProductsCount is already set

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

      // Check for duplicate invoice before creating (if enabled)
      if (duplicateCheckEnabled) {
        setLoadingMessage('Checking for duplicate invoice...');
        const duplicateCheck = await apiService.checkDuplicateInvoice(supplierId, invoiceNumber);

        if (duplicateCheck.success && duplicateCheck.data.duplicate) {
          // Show warning dialog
          setDuplicateInvoiceInfo(duplicateCheck.data.existingInvoice);
          setPendingInvoiceData(invoiceData);
          setShowDuplicateWarning(true);
          setLoading(false);
          return;
        }
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

  // Step 6: Confirm and complete import
  const handleConfirmImport = async () => {
    // Show loading state while finalizing
    setLoading(true);
    setLoadingMessage('Finalizing invoice import...');

    try {
      // Verify invoice exists and all data is complete
      if (!invoiceId) {
        setError('Invoice ID not found. Please contact support.');
        setLoading(false);
        return;
      }

      // Optional: Add any final validation or cleanup here
      // For now, the invoice is already created and all matching is complete

      setSuccess(
        `✓ Invoice #${invoiceId} has been successfully imported!\n\n` +
        `Summary:\n` +
        `• Total items: ${products.length}\n` +
        `• Items imported: ${products.filter(p => p.selected).length}\n` +
        `• Items ignored: ${products.filter(p => !p.selected).length}\n` +
        `• Products matched: ${masterProductMatchResults?.results?.filter(r => r.action === 'matched').length || 0}\n` +
        `• New products created: ${masterProductMatchResults?.results?.filter(r => r.action === 'created').length || 0}`
      );

      // Log completion
      console.log('✓ Invoice import completed:', {
        invoiceId,
        totalProducts: products.length,
        selectedProducts: products.filter(p => p.selected).length,
        masterProductMatches: masterProductMatchResults
      });

      // Navigate to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      console.error('Error finalizing invoice:', err);
      setError('Failed to finalize invoice: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
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
    setUserIgnoredItemsCount(0);
    setHiddenProductsCount(0);
  };

  const selectedCount = products.filter(p => p.selected).length;

  // Ensure supplierId is determined before proceeding to Step 3
  const handleProceedToIgnoreConfirmation = async () => {
    // Check if there are any unchecked items
    const uncheckedItems = products.filter(p => !p.selected);

    // If no unchecked items, skip Step 3 and proceed directly to invoice creation
    if (uncheckedItems.length === 0) {
      console.log('No unchecked items, skipping Step 3 ignore confirmation');
      handleCreateInvoice();
      return;
    }

    // If supplierId is already set, proceed directly to Step 3
    if (supplierId) {
      setCurrentStep(3);
      return;
    }

    // Otherwise, determine supplierId
    setLoading(true);
    setLoadingMessage('Looking up supplier...');

    try {
      let foundSupplierId = null;

      // Try to find existing supplier
      try {
        const suppliersResponse = await apiService.getSuppliers();
        if (suppliersResponse.success && Array.isArray(suppliersResponse.data)) {
          const matchedSupplier = suppliersResponse.data.find(s =>
            s.sup_name.toLowerCase().includes(supplierName.toLowerCase()) ||
            supplierName.toLowerCase().includes(s.sup_name.toLowerCase())
          );

          if (matchedSupplier) {
            foundSupplierId = matchedSupplier.sup_id;
          }
        }
      } catch (err) {
        console.warn('Error fetching suppliers:', err);
      }

      // If not found, create new supplier
      if (!foundSupplierId) {
        try {
          const createResponse = await apiService.createSupplier({
            sup_name: supplierName,
            sup_active: true
          });

          if (createResponse.success) {
            foundSupplierId = createResponse.data.sup_id || createResponse.data.data?.sup_id;
          }
        } catch (err) {
          console.warn('Error creating supplier:', err);
        }
      }

      if (foundSupplierId) {
        setSupplierId(foundSupplierId);
        setLoading(false);
        setCurrentStep(3);
      } else {
        setError('Failed to determine supplier ID');
        setLoading(false);
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
      setLoading(false);
    }
  };

  // Handle continue button with ignore items confirmation
  const handleContinueWithIgnoreCheck = (nextStep) => {
    // Get unchecked items
    const unchecked = products.filter(p => !p.selected);

    if (unchecked.length > 0) {
      // Show ignore confirmation modal
      setUncheckedItemsForIgnore(unchecked);
      setPendingContinueCallback(() => () => setCurrentStep(nextStep));
      setShowIgnoreConfirmation(true);
    } else {
      // No unchecked items, proceed directly
      setCurrentStep(nextStep);
    }
  };

  const handleIgnoreConfirmationSkip = () => {
    // User chose not to ignore items, just proceed
    setShowIgnoreConfirmation(false);
    if (pendingContinueCallback) {
      pendingContinueCallback();
    }
  };

  const handleIgnoreConfirmationConfirm = (ignoredItems) => {
    // Items were added to ignore list, proceed
    setShowIgnoreConfirmation(false);
    if (pendingContinueCallback) {
      pendingContinueCallback();
    }
  };

  const handleIgnoreConfirmationCancel = () => {
    // User cancelled, stay on current page
    setShowIgnoreConfirmation(false);
  };

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
                  <div>
                    <ProductCount>{products.length} products found</ProductCount>
                    {hiddenProductsCount > 0 && (
                      <ProductCount style={{ color: '#ff9800', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        ℹ️ {hiddenProductsCount} items hidden (previously ignored for this venue)
                      </ProductCount>
                    )}
                  </div>
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
                    {/* Actions Bar - Hide Select All/Deselect All when categories are present */}
                    <ActionsBar>
                      {/* Only show Select All/Deselect All when NO categories are detected */}
                      {/* When categories exist, users control selection at category level instead */}
                      {!hasCategories && (
                        <>
                          <SecondaryButton onClick={() => toggleAll(true)}>
                            Select All
                          </SecondaryButton>
                          <SecondaryButton onClick={() => toggleAll(false)}>
                            Deselect All
                          </SecondaryButton>
                        </>
                      )}
                      <SecondaryButton onClick={handleReset}>
                        Upload New PDF
                      </SecondaryButton>
                      <PrimaryButton onClick={handleProceedToIgnoreConfirmation} disabled={selectedCount === 0}>
                        Review & Create Invoice ({selectedCount}) →
                      </PrimaryButton>
                    </ActionsBar>

                    {/* Product Display - Conditional Rendering */}
                    {/* Show categorized view when categories are detected, flat table otherwise */}
                    {hasCategories ? (
                      // Category-organized product display
                      // Features:
                      // - Category headers with collapse/expand triangles (▼/▶)
                      // - Parent checkbox toggles all children
                      // - Partial-state checkbox for mixed selection
                      // - Products indented under categories
                      <CategoryProductsDisplay
                        categories={categories}
                        products={products}
                        onProductToggle={toggleProduct}
                        onCategoryToggle={toggleCategory}
                      />
                    ) : (
                      // Flat table view (no categories)
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
                    )}
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
                              <PrimaryButton onClick={() => handleContinueWithIgnoreCheck(4)}>
                                Continue to Master Product Matching ({itemsNeedingMasterMatch} items) →
                              </PrimaryButton>
                            ) : (
                              <PrimaryButton onClick={() => handleContinueWithIgnoreCheck(5)}>
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

      case 3:
        // Step 3: Ignore Confirmation
        const uncheckedItems3 = products.filter(p => !p.selected);

        return (
          <IgnoreItemsConfirmation
            uncheckedItems={uncheckedItems3}
            venueName={venueName}
            supplierId={supplierId}
            venueId={venueId}
            onConfirm={() => {
              // After confirming ignore, create invoice
              handleCreateInvoice();
            }}
            onSkip={() => {
              // Skip ignore confirmation, just create invoice
              handleCreateInvoice();
            }}
            onCancel={() => setCurrentStep(2)}
          />
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
                lineItems: products,
                venueName: venueName
              }}
              supplierMatchResults={supplierMatchResults}
              masterProductMatchResults={masterProductMatchResults}
              ignoredItemsCount={userIgnoredItemsCount}
              systemIgnoredItemsCount={hiddenProductsCount}
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

      {/* Ignore Items Confirmation Modal */}
      {showIgnoreConfirmation && uncheckedItemsForIgnore.length > 0 && (
        <IgnoreItemsConfirmation
          uncheckedItems={uncheckedItemsForIgnore}
          venueName={venueName}
          supplierId={parsedData?.supplier_id || null}
          venueId={venueId}
          onConfirm={handleIgnoreConfirmationConfirm}
          onSkip={handleIgnoreConfirmationSkip}
          onCancel={handleIgnoreConfirmationCancel}
        />
      )}

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
