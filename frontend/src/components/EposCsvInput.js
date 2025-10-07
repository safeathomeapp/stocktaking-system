import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from '../styles/components/Button';
import { Container } from '../styles/GlobalStyles';
import apiService from '../services/apiService';

const EposContainer = styled(Container)`
  padding-top: ${props => props.theme.spacing.lg};
  padding-bottom: ${props => props.theme.spacing.xl};
  min-height: 100vh;
  background: linear-gradient(135deg, ${props => props.theme.colors.background} 0%, #F0FDF4 100%);
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
  border: 3px dashed ${props => props.isDragging ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: 12px;
  padding: ${props => props.theme.spacing.xxl};
  text-align: center;
  background: ${props => props.isDragging ? 'rgba(59, 130, 246, 0.05)' : props.theme.colors.background};
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
  background: #DCFCE7;
  border: 1px solid #86EFAC;
  border-radius: 8px;
  padding: ${props => props.theme.spacing.lg};
  margin-top: ${props => props.theme.spacing.lg};
`;

const FileName = styled.div`
  font-weight: 600;
  color: #16A34A;
  margin-bottom: ${props => props.theme.spacing.xs};
  font-size: 1rem;
`;

const FileDetails = styled.div`
  font-size: 0.875rem;
  color: #059669;
`;

const PreviewSection = styled.div`
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

const ConfigSection = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: 16px;
  padding: ${props => props.theme.spacing.xxl};
  box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.1);
  border: 1px solid ${props => props.theme.colors.border};
  margin-bottom: ${props => props.theme.spacing.xl};
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

const Input = styled.input`
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

const DateRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.md};
`;

const ColumnMappingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.md};
`;

const UploadButtonContainer = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.lg};
`;

const ImportStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.md};
`;

const StatCard = styled.div`
  background: ${props => props.theme.colors.background};
  padding: ${props => props.theme.spacing.md};
  border-radius: 8px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.primary};
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.textSecondary};
  margin-top: ${props => props.theme.spacing.xs};
`;

const EposCsvInput = () => {
  const navigate = useNavigate();
  const { venueId } = useParams();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [error, setError] = useState(null);
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState('');
  const [venueName, setVenueName] = useState('');
  const [columnMapping, setColumnMapping] = useState({
    item_code: -1,  // -1 means N/A
    item_description: 0,
    quantity_sold: -1,
    unit_price: -1,
    total_value: -1
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [periodStartDate, setPeriodStartDate] = useState('');
  const [periodEndDate, setPeriodEndDate] = useState('');
  const fileInputRef = React.useRef(null);

  // Initialize venue from route params or localStorage
  useEffect(() => {
    const initVenue = venueId || localStorage.getItem('selectedVenue');
    if (initVenue) {
      setSelectedVenue(initVenue);
    }
  }, [venueId]);

  // Fetch venues on mount
  useEffect(() => {
    const fetchVenues = async () => {
      const result = await apiService.getVenues();
      if (result.success) {
        setVenues(result.data);

        // Set venue name if venue is already selected
        if (selectedVenue) {
          const venue = result.data.find(v => v.id === selectedVenue);
          if (venue) {
            setVenueName(venue.name);
          }
        }
      } else {
        setError('Failed to load venues: ' + result.error);
      }
    };
    fetchVenues();
  }, [selectedVenue]);

  // Load CSV preferences and last session date when venue is selected
  useEffect(() => {
    const loadVenueData = async () => {
      if (!selectedVenue) return;

      try {
        // Load CSV preferences
        const prefsResult = await apiService.getVenueCsvPreferences(selectedVenue);
        if (prefsResult.success && prefsResult.data.preferences) {
          const prefs = prefsResult.data.preferences;
          setColumnMapping({
            item_code: prefs.item_code_column ?? -1,
            item_description: prefs.item_description_column ?? 0,
            quantity_sold: prefs.quantity_sold_column ?? -1,
            unit_price: prefs.unit_price_column ?? -1,
            total_value: prefs.total_value_column ?? -1
          });
        }

        // Load last session date to pre-fill date inputs
        // Always set end date to today
        const today = new Date();
        setPeriodEndDate(today.toISOString().split('T')[0]);

        // Try to get last stock entry date for start date
        const dateResult = await apiService.getVenueLastSessionDate(selectedVenue);
        if (dateResult.success && dateResult.data.lastSessionDate) {
          // Use the last stock entry date as the start date
          setPeriodStartDate(dateResult.data.lastSessionDate);
        }
      } catch (err) {
        console.error('Error loading venue data:', err);
      }
    };

    loadVenueData();
  }, [selectedVenue]);

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

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file) => {
    setError(null);

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setSelectedFile(file);

    // Read and parse CSV
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

        // Identify empty columns (no header and no data in any row)
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

        // Reset column mapping to defaults with cleaned column count
        if (cleanedRows[0] && cleanedRows[0].length > 0) {
          setColumnMapping({
            item_code: -1,
            item_description: 0,
            quantity_sold: -1,
            unit_price: -1,
            total_value: -1
          });
        }
      } catch (err) {
        setError('Error parsing CSV file: ' + err.message);
      }
    };
    reader.onerror = () => {
      setError('Error reading file');
    };
    reader.readAsText(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleUploadToDatabase = async () => {
    if (!selectedVenue) {
      setError('Please select a venue');
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
      // Parse CSV data based on column mapping
      const records = csvData.slice(1).map(row => {
        const record = {
          item_code: columnMapping.item_code >= 0 ? (row[columnMapping.item_code] || '') : '',
          item_description: columnMapping.item_description >= 0 ? (row[columnMapping.item_description] || '') : '',
          quantity_sold: columnMapping.quantity_sold >= 0 ? (parseFloat(row[columnMapping.quantity_sold]) || 0) : 0,
          unit_price: columnMapping.unit_price >= 0 ? (parseFloat(row[columnMapping.unit_price]) || 0) : 0,
          total_value: columnMapping.total_value >= 0 ? (parseFloat(row[columnMapping.total_value]) || 0) : 0
        };
        return record;
      }).filter(record => record.item_description); // Filter out empty rows

      const importData = {
        epos_system_name: 'Generic CSV',
        original_filename: selectedFile.name,
        imported_by: 'User',
        period_start_date: periodStartDate || null,
        period_end_date: periodEndDate || null,
        records: records
      };

      const result = await apiService.importEposData(selectedVenue, importData);

      if (result.success) {
        // Save CSV preferences for next time
        await apiService.saveVenueCsvPreferences(selectedVenue, {
          item_code_column: columnMapping.item_code,
          item_description_column: columnMapping.item_description,
          quantity_sold_column: columnMapping.quantity_sold,
          unit_price_column: columnMapping.unit_price,
          total_value_column: columnMapping.total_value
        });

        setUploadSuccess({
          total: result.data.import.total_records,
          matched: result.data.import.matched_records,
          unmatched: result.data.import.unmatched_records,
          matchRate: result.data.import.match_rate
        });
      } else {
        setError('Upload failed: ' + result.error);
      }
    } catch (err) {
      setError('Upload error: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <EposContainer>
      <Header>
        <Title>📊 EPOS CSV Input</Title>
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
          ✅ Import successful! {uploadSuccess.total} records processed, {uploadSuccess.matched} matched ({uploadSuccess.matchRate})
          <ImportStats>
            <StatCard>
              <StatValue>{uploadSuccess.total}</StatValue>
              <StatLabel>Total Records</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{uploadSuccess.matched}</StatValue>
              <StatLabel>Matched</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{uploadSuccess.unmatched}</StatValue>
              <StatLabel>New Products</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{uploadSuccess.matchRate}</StatValue>
              <StatLabel>Match Rate</StatLabel>
            </StatCard>
          </ImportStats>
        </SuccessMessage>
      )}

      <UploadSection>
        <SectionTitle>Upload PLU Sales CSV</SectionTitle>

        <UploadArea
          isDragging={isDragging}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleUploadClick}
        >
          <UploadIcon>📁</UploadIcon>
          <UploadText>Drop your CSV file here or click to browse</UploadText>
          <UploadHint>Supports CSV files from EPOS systems</UploadHint>
        </UploadArea>

        <HiddenFileInput
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
        />

        {selectedFile && (
          <FileInfo>
            <FileName>📄 {selectedFile.name}</FileName>
            <FileDetails>
              Size: {(selectedFile.size / 1024).toFixed(2)} KB •
              Rows: {csvData.length > 0 ? csvData.length : 0}
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
              <Label>Report Period (Optional)</Label>
              <UploadHint style={{ marginBottom: '0.5rem' }}>
                Specify the date range covered by this EPOS report
              </UploadHint>
              <DateRow>
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={periodStartDate}
                    onChange={(e) => setPeriodStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={periodEndDate}
                    onChange={(e) => setPeriodEndDate(e.target.value)}
                  />
                </div>
              </DateRow>
            </FormGroup>

            <FormGroup>
              <Label>Column Mapping</Label>
              <UploadHint style={{ marginBottom: '1rem' }}>
                Map your CSV columns to the fields below. Select "N/A" if a field is not available in your CSV.
              </UploadHint>
              <ColumnMappingGrid>
                <div>
                  <Label>Item Code</Label>
                  <Select
                    value={columnMapping.item_code}
                    onChange={(e) => setColumnMapping({...columnMapping, item_code: parseInt(e.target.value)})}
                  >
                    <option value={-1}>N/A</option>
                    {csvData[0]?.map((header, idx) => (
                      <option key={idx} value={idx}>{header || `Column ${idx + 1}`}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Item Description *</Label>
                  <Select
                    value={columnMapping.item_description}
                    onChange={(e) => setColumnMapping({...columnMapping, item_description: parseInt(e.target.value)})}
                  >
                    {csvData[0]?.map((header, idx) => (
                      <option key={idx} value={idx}>{header || `Column ${idx + 1}`}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Quantity Sold</Label>
                  <Select
                    value={columnMapping.quantity_sold}
                    onChange={(e) => setColumnMapping({...columnMapping, quantity_sold: parseInt(e.target.value)})}
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
                    value={columnMapping.unit_price}
                    onChange={(e) => setColumnMapping({...columnMapping, unit_price: parseInt(e.target.value)})}
                  >
                    <option value={-1}>N/A</option>
                    {csvData[0]?.map((header, idx) => (
                      <option key={idx} value={idx}>{header || `Column ${idx + 1}`}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Total Value</Label>
                  <Select
                    value={columnMapping.total_value}
                    onChange={(e) => setColumnMapping({...columnMapping, total_value: parseInt(e.target.value)})}
                  >
                    <option value={-1}>N/A</option>
                    {csvData[0]?.map((header, idx) => (
                      <option key={idx} value={idx}>{header || `Column ${idx + 1}`}</option>
                    ))}
                  </Select>
                </div>
              </ColumnMappingGrid>
            </FormGroup>

            <UploadButtonContainer>
              <Button
                onClick={handleUploadToDatabase}
                disabled={!selectedVenue || isUploading}
              >
                {isUploading ? '⏳ Uploading...' : '📤 Upload to Database'}
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
                    <th key={index}>{header}</th>
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
    </EposContainer>
  );
};

export default EposCsvInput;