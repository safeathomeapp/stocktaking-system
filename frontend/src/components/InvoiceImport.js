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

const UploadSection = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: 16px;
  padding: ${props => props.theme.spacing.xxl};
  box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.1);
  border: 1px solid ${props => props.theme.colors.border};
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const UploadArea = styled.div`
  border: 3px dashed ${props => props.$isDragging ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: 12px;
  padding: ${props => props.theme.spacing.xxl};
  text-align: center;
  background: ${props => props.$isDragging ? 'rgba(59, 130, 246, 0.05)' : props.theme.colors.background};
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    background: rgba(59, 130, 246, 0.02);
  }
`;

const UploadIcon = styled.div`
  font-size: 4rem;
  margin-bottom: ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.primary};
`;

const UploadText = styled.p`
  font-size: 1.125rem;
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
  font-weight: 600;
`;

const UploadHint = styled.p`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.textSecondary};
  margin: 0;
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const FileInfo = styled.div`
  background: #DBEAFE;
  border: 1px solid #93C5FD;
  border-radius: 8px;
  padding: ${props => props.theme.spacing.lg};
  margin-top: ${props => props.theme.spacing.lg};
`;

const FileName = styled.div`
  font-weight: 600;
  color: #1D4ED8;
  margin-bottom: ${props => props.theme.spacing.xs};
  font-size: 1rem;
`;

const FileDetails = styled.div`
  font-size: 0.875rem;
  color: #2563EB;
`;

const ConfigSection = styled.div`
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

const SubsectionTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: ${props => props.theme.spacing.lg} 0 ${props => props.theme.spacing.md} 0;
  padding-top: ${props => props.theme.spacing.lg};
  border-top: 1px solid ${props => props.theme.colors.border};

  &:first-of-type {
    margin-top: 0;
    padding-top: 0;
    border-top: none;
  }
`;

const FormGroup = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin-bottom: ${props => props.theme.spacing.sm};
  font-size: 0.875rem;
`;

const Select = styled.select`
  width: 100%;
  padding: ${props => props.theme.spacing.md};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  font-size: 1rem;
  color: ${props => props.theme.colors.text};
  background: ${props => props.theme.colors.background};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const ColumnMappingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.md};
`;

const PreviewSection = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: 16px;
  padding: ${props => props.theme.spacing.xxl};
  box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.1);
  border: 1px solid ${props => props.theme.colors.border};
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const TableContainer = styled.div`
  overflow-x: auto;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
`;

const PreviewTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;

  th {
    background: ${props => props.theme.colors.primary};
    color: white;
    padding: ${props => props.theme.spacing.md};
    text-align: left;
    font-weight: 600;
    white-space: nowrap;
  }

  td {
    padding: ${props => props.theme.spacing.md};
    border-bottom: 1px solid ${props => props.theme.colors.border};
    color: ${props => props.theme.colors.text};
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr:hover td {
    background: rgba(59, 130, 246, 0.05);
  }
`;

const ErrorMessage = styled.div`
  background: #FEE2E2;
  color: #991B1B;
  padding: ${props => props.theme.spacing.md};
  border-radius: 8px;
  margin-bottom: ${props => props.theme.spacing.md};
  font-weight: 500;
`;

const SuccessMessage = styled.div`
  background: #DCFCE7;
  color: #16A34A;
  padding: ${props => props.theme.spacing.md};
  border-radius: 8px;
  margin-bottom: ${props => props.theme.spacing.md};
  font-weight: 500;
`;

const UploadButtonContainer = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.lg};
`;

const InvoiceImport = () => {
  const navigate = useNavigate();
  const { venueId } = useParams();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [error, setError] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [venues, setVenues] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [venueName, setVenueName] = useState('');

  // Header field mappings
  const [headerMapping, setHeaderMapping] = useState({
    invoice_number: -1,
    invoice_date: -1,
    delivery_number: -1,
    date_ordered: -1,
    date_delivered: -1,
    customer_ref: -1,
    subtotal: -1,
    vat_total: -1,
    total_amount: -1
  });

  // Line item field mappings
  const [lineMapping, setLineMapping] = useState({
    product_code: -1,
    product_name: 0,
    product_description: -1,
    quantity: -1,
    unit_price: -1,
    nett_price: -1,
    vat_code: -1,
    vat_rate: -1,
    vat_amount: -1,
    line_total: -1
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const fileInputRef = React.useRef(null);

  // Initialize venue from route params or localStorage
  useEffect(() => {
    const initVenue = venueId || localStorage.getItem('selectedVenue');
    if (initVenue) {
      setSelectedVenue(initVenue);
    }
  }, [venueId]);

  // Fetch user profile on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await apiService.getUserSummary();
        if (response.success) {
          setUserProfile(response.summary);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  // Fetch suppliers and venues on mount
  useEffect(() => {
    const fetchData = async () => {
      // Fetch suppliers
      const suppliersResult = await apiService.getSuppliers();
      if (suppliersResult.success) {
        setSuppliers(suppliersResult.data);
      } else {
        setError('Failed to load suppliers: ' + suppliersResult.error);
      }

      // Fetch venues
      const venuesResult = await apiService.getVenues();
      if (venuesResult.success) {
        setVenues(venuesResult.data);

        // Set venue name if venue is already selected
        if (selectedVenue) {
          const venue = venuesResult.data.find(v => v.id === selectedVenue);
          if (venue) {
            setVenueName(venue.name);
          }
        }
      }
    };
    fetchData();
  }, [selectedVenue]);

  // Load invoice preferences when supplier is selected
  useEffect(() => {
    const loadSupplierPreferences = async () => {
      if (!selectedSupplier) return;

      try {
        const prefsResult = await apiService.getSupplierInvoicePreferences(selectedSupplier);
        if (prefsResult.success && prefsResult.data && prefsResult.data.preferences) {
          const prefs = prefsResult.data.preferences;

          // Load header mappings
          setHeaderMapping({
            invoice_number: prefs.invoice_number_column ?? -1,
            invoice_date: prefs.invoice_date_column ?? -1,
            delivery_number: prefs.delivery_number_column ?? -1,
            date_ordered: prefs.date_ordered_column ?? -1,
            date_delivered: prefs.date_delivered_column ?? -1,
            customer_ref: prefs.customer_ref_column ?? -1,
            subtotal: prefs.subtotal_column ?? -1,
            vat_total: prefs.vat_total_column ?? -1,
            total_amount: prefs.total_amount_column ?? -1
          });

          // Load line mappings
          setLineMapping({
            product_code: prefs.product_code_column ?? -1,
            product_name: prefs.product_name_column ?? 0,
            product_description: prefs.product_description_column ?? -1,
            quantity: prefs.quantity_column ?? -1,
            unit_price: prefs.unit_price_column ?? -1,
            nett_price: prefs.nett_price_column ?? -1,
            vat_code: prefs.vat_code_column ?? -1,
            vat_rate: prefs.vat_rate_column ?? -1,
            vat_amount: prefs.vat_amount_column ?? -1,
            line_total: prefs.line_total_column ?? -1
          });
        }

        // Set supplier name
        const supplier = suppliers.find(s => s.sup_id === selectedSupplier);
        if (supplier) {
          setSupplierName(supplier.sup_name);
        }
      } catch (err) {
        console.error('Error loading supplier preferences:', err);
      }
    };

    loadSupplierPreferences();
  }, [selectedSupplier, suppliers]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file) => {
    setError(null);

    // Validate file type
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.pdf')) {
      setError('Please upload a CSV or PDF file');
      return;
    }

    setSelectedFile(file);

    // For CSV files, read and parse
    if (file.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()));

          // Filter out empty rows
          const filteredRows = rows.filter(row => row.some(cell => cell !== ''));

          if (filteredRows.length === 0) {
            setError('CSV file is empty');
            return;
          }

          // Identify empty columns
          const headers = filteredRows[0];
          const emptyColumns = [];

          for (let colIdx = 0; colIdx < headers.length; colIdx++) {
            const hasHeader = headers[colIdx] !== '';
            const hasData = filteredRows.slice(1).some(row => row[colIdx] && row[colIdx] !== '');

            if (!hasHeader && !hasData) {
              emptyColumns.push(colIdx);
            }
          }

          // Remove empty columns from all rows
          const cleanedRows = filteredRows.map(row =>
            row.filter((_, idx) => !emptyColumns.includes(idx))
          );

          setCsvData(cleanedRows);
        } catch (err) {
          setError('Error parsing CSV file: ' + err.message);
        }
      };
      reader.onerror = () => {
        setError('Error reading file');
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.pdf')) {
      // Process PDF with OCR
      setIsUploading(true);
      setError(null);

      try {
        const result = await apiService.uploadInvoicePDF(file, (progress) => {
          console.log(`Upload progress: ${progress}%`);
        });

        if (result.success && result.data?.data) {
          const { header, items, text } = result.data.data;

          // Convert OCR results to CSV-like format
          const headers = ['Product Code', 'Description', 'Quantity', 'Unit Price', 'Total Price'];
          const rows = items.map(item => [
            item.productCode || '',
            item.description || '',
            item.quantity || '',
            item.unitPrice || '',
            item.totalPrice || ''
          ]);

          setCsvData([headers, ...rows]);
          setUploadSuccess({
            total: items.length,
            message: `✅ Extracted ${items.length} items from PDF`
          });

          // Display extracted header info
          if (header && Object.keys(header).length > 0) {
            console.log('Invoice Header:', header);
          }
        } else {
          setError(result.error || 'Failed to process PDF');
        }
      } catch (err) {
        setError('Error processing PDF: ' + err.message);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleUploadToDatabase = async () => {
    if (!selectedVenue) {
      setError('Please select a venue');
      return;
    }

    if (!selectedSupplier) {
      setError('Please select a supplier');
      return;
    }

    if (csvData.length < 2) {
      setError('No data to upload');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadSuccess(null);

    try {
      // TODO: Parse invoice data and create invoice + line items
      // This will be implemented in the API endpoint task

      setUploadSuccess({
        total: csvData.length - 1,
        message: 'Invoice import functionality coming soon'
      });
    } catch (err) {
      setError('Upload error: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <InvoiceContainer>
      <Header>
        <Title>📄 Invoice Import</Title>
        <Button
          onClick={() => navigate('/')}
          variant="outline"
        >
          Back to Dashboard
        </Button>
      </Header>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {uploadSuccess && (
        <SuccessMessage>
          ✅ {uploadSuccess.message} ({uploadSuccess.total} rows)
        </SuccessMessage>
      )}

      <UploadSection>
        <SectionTitle>Upload Invoice</SectionTitle>

        <UploadArea
          $isDragging={isDragging}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleUploadClick}
        >
          <UploadIcon>📄</UploadIcon>
          <UploadText>Drop your invoice file here or click to browse</UploadText>
          <UploadHint>Supports CSV files (PDF OCR coming soon)</UploadHint>
        </UploadArea>

        <HiddenFileInput
          ref={fileInputRef}
          type="file"
          accept=".csv,.pdf"
          onChange={handleFileSelect}
        />

        {selectedFile && (
          <FileInfo>
            <FileName>📄 {selectedFile.name}</FileName>
            <FileDetails>
              Size: {(selectedFile.size / 1024).toFixed(2)} KB
              {csvData.length > 0 && ` • Rows: ${csvData.length}`}
            </FileDetails>
          </FileInfo>
        )}
      </UploadSection>

      {csvData.length > 0 && (
        <>
          <ConfigSection>
            <SectionTitle>Import Configuration</SectionTitle>

            {venueName && (
              <FormGroup>
                <Label>Venue</Label>
                <div style={{ padding: '12px', background: '#F3F4F6', borderRadius: '8px', fontWeight: '600' }}>
                  {venueName}
                </div>
              </FormGroup>
            )}

            {!selectedVenue && (
              <FormGroup>
                <Label>Select Venue *</Label>
                <Select
                  value={selectedVenue}
                  onChange={(e) => setSelectedVenue(e.target.value)}
                  required
                >
                  <option value="">-- Choose a venue --</option>
                  {venues.map(venue => (
                    <option key={venue.id} value={venue.id}>
                      {venue.name}
                    </option>
                  ))}
                </Select>
              </FormGroup>
            )}

            <FormGroup>
              <Label>Select Supplier *</Label>
              <Select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                required
              >
                <option value="">-- Choose a supplier --</option>
                {suppliers.map(supplier => (
                  <option key={supplier.sup_id} value={supplier.sup_id}>
                    {supplier.sup_name}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <SubsectionTitle>Invoice Header Fields</SubsectionTitle>
            <UploadHint style={{ marginBottom: '1rem' }}>
              Map your CSV columns to invoice header fields. Select "N/A" if a field is not available.
            </UploadHint>
            <ColumnMappingGrid>
              <div>
                <Label>Invoice Number</Label>
                <Select
                  value={headerMapping.invoice_number}
                  onChange={(e) => setHeaderMapping({...headerMapping, invoice_number: parseInt(e.target.value)})}
                >
                  <option value={-1}>N/A</option>
                  {csvData[0]?.map((header, idx) => (
                    <option key={idx} value={idx}>{header || `Column ${idx + 1}`}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Invoice Date</Label>
                <Select
                  value={headerMapping.invoice_date}
                  onChange={(e) => setHeaderMapping({...headerMapping, invoice_date: parseInt(e.target.value)})}
                >
                  <option value={-1}>N/A</option>
                  {csvData[0]?.map((header, idx) => (
                    <option key={idx} value={idx}>{header || `Column ${idx + 1}`}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Delivery Number</Label>
                <Select
                  value={headerMapping.delivery_number}
                  onChange={(e) => setHeaderMapping({...headerMapping, delivery_number: parseInt(e.target.value)})}
                >
                  <option value={-1}>N/A</option>
                  {csvData[0]?.map((header, idx) => (
                    <option key={idx} value={idx}>{header || `Column ${idx + 1}`}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Subtotal</Label>
                <Select
                  value={headerMapping.subtotal}
                  onChange={(e) => setHeaderMapping({...headerMapping, subtotal: parseInt(e.target.value)})}
                >
                  <option value={-1}>N/A</option>
                  {csvData[0]?.map((header, idx) => (
                    <option key={idx} value={idx}>{header || `Column ${idx + 1}`}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>VAT Total</Label>
                <Select
                  value={headerMapping.vat_total}
                  onChange={(e) => setHeaderMapping({...headerMapping, vat_total: parseInt(e.target.value)})}
                >
                  <option value={-1}>N/A</option>
                  {csvData[0]?.map((header, idx) => (
                    <option key={idx} value={idx}>{header || `Column ${idx + 1}`}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Total Amount</Label>
                <Select
                  value={headerMapping.total_amount}
                  onChange={(e) => setHeaderMapping({...headerMapping, total_amount: parseInt(e.target.value)})}
                >
                  <option value={-1}>N/A</option>
                  {csvData[0]?.map((header, idx) => (
                    <option key={idx} value={idx}>{header || `Column ${idx + 1}`}</option>
                  ))}
                </Select>
              </div>
            </ColumnMappingGrid>

            <SubsectionTitle>Line Item Fields</SubsectionTitle>
            <UploadHint style={{ marginBottom: '1rem' }}>
              Map your CSV columns to line item fields for each product on the invoice.
            </UploadHint>
            <ColumnMappingGrid>
              <div>
                <Label>Product Code</Label>
                <Select
                  value={lineMapping.product_code}
                  onChange={(e) => setLineMapping({...lineMapping, product_code: parseInt(e.target.value)})}
                >
                  <option value={-1}>N/A</option>
                  {csvData[0]?.map((header, idx) => (
                    <option key={idx} value={idx}>{header || `Column ${idx + 1}`}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Product Name *</Label>
                <Select
                  value={lineMapping.product_name}
                  onChange={(e) => setLineMapping({...lineMapping, product_name: parseInt(e.target.value)})}
                >
                  {csvData[0]?.map((header, idx) => (
                    <option key={idx} value={idx}>{header || `Column ${idx + 1}`}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Quantity</Label>
                <Select
                  value={lineMapping.quantity}
                  onChange={(e) => setLineMapping({...lineMapping, quantity: parseInt(e.target.value)})}
                >
                  <option value={-1}>N/A</option>
                  {csvData[0]?.map((header, idx) => (
                    <option key={idx} value={idx}>{header || `Column ${idx + 1}`}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Unit Price</Label>
                <Select
                  value={lineMapping.unit_price}
                  onChange={(e) => setLineMapping({...lineMapping, unit_price: parseInt(e.target.value)})}
                >
                  <option value={-1}>N/A</option>
                  {csvData[0]?.map((header, idx) => (
                    <option key={idx} value={idx}>{header || `Column ${idx + 1}`}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>VAT Rate</Label>
                <Select
                  value={lineMapping.vat_rate}
                  onChange={(e) => setLineMapping({...lineMapping, vat_rate: parseInt(e.target.value)})}
                >
                  <option value={-1}>N/A</option>
                  {csvData[0]?.map((header, idx) => (
                    <option key={idx} value={idx}>{header || `Column ${idx + 1}`}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Line Total</Label>
                <Select
                  value={lineMapping.line_total}
                  onChange={(e) => setLineMapping({...lineMapping, line_total: parseInt(e.target.value)})}
                >
                  <option value={-1}>N/A</option>
                  {csvData[0]?.map((header, idx) => (
                    <option key={idx} value={idx}>{header || `Column ${idx + 1}`}</option>
                  ))}
                </Select>
              </div>
            </ColumnMappingGrid>

            <UploadButtonContainer>
              <Button
                onClick={handleUploadToDatabase}
                disabled={!selectedVenue || !selectedSupplier || isUploading}
              >
                {isUploading ? '⏳ Processing...' : '📤 Upload Invoice'}
              </Button>
            </UploadButtonContainer>
          </ConfigSection>

          <PreviewSection>
            <SectionTitle>Data Preview</SectionTitle>
            <TableContainer>
              <PreviewTable>
                <thead>
                  <tr>
                    {csvData[0]?.map((header, index) => (
                      <th key={index}>{header || `Column ${index + 1}`}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvData.slice(1, 11).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </PreviewTable>
            </TableContainer>
            {csvData.length > 11 && (
              <UploadHint style={{ marginTop: '1rem', textAlign: 'center' }}>
                Showing first 10 rows of {csvData.length - 1} data rows
              </UploadHint>
            )}
          </PreviewSection>
        </>
      )}
    </InvoiceContainer>
  );
};

export default InvoiceImport;
