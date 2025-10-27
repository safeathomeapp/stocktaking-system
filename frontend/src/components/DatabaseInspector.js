import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
// eslint-disable-next-line no-unused-vars

const Container = styled.div`
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%);
  display: flex;
  flex-direction: column;
  padding: 0;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  overflow: hidden;
`;

const Header = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 25px 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);

  h1 {
    margin: 0 0 5px 0;
    color: #fff;
    font-size: 32px;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  p {
    margin: 0;
    color: rgba(255, 255, 255, 0.6);
    font-size: 13px;
    font-weight: 500;
  }
`;

const TablesSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 30px 40px;
`;

const TablesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
  overflow-y: auto;
  padding-right: 10px;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(102, 126, 234, 0.5);
    border-radius: 10px;
    &:hover {
      background: rgba(102, 126, 234, 0.7);
    }
  }
`;

const TableButton = styled.button`
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
  border: 2px solid ${props => props.active ? '#667eea' : 'rgba(102, 126, 234, 0.3)'};
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  &:hover {
    border-color: #667eea;
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(102, 126, 234, 0.3);
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);

    &::before {
      opacity: 1;
    }
  }

  ${props => props.active && `
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.4) 0%, rgba(118, 75, 162, 0.4) 100%);
    box-shadow: 0 12px 24px rgba(102, 126, 234, 0.4);

    &::before {
      opacity: 1;
    }
  `}

  .table-name {
    font-size: 15px;
    font-weight: 600;
    color: #fff;
    margin-bottom: 8px;
    word-break: break-word;
    width: 100%;
  }

  .record-count {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    background: rgba(102, 126, 234, 0.3);
    padding: 4px 8px;
    border-radius: 6px;
    font-weight: 600;
  }
`;

const ContentArea = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  overflow: hidden;
  margin-bottom: 20px;
`;

const ColumnsCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 16px;
  padding: 25px;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  h3 {
    margin: 0 0 20px 0;
    color: #fff;
    font-size: 16px;
    font-weight: 600;
  }
`;

const ColumnsList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-right: 10px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(102, 126, 234, 0.4);
    border-radius: 10px;
    &:hover {
      background: rgba(102, 126, 234, 0.6);
    }
  }
`;

const ColumnItem = styled.div`
  background: rgba(102, 126, 234, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(102, 126, 234, 0.15);
    border-color: rgba(102, 126, 234, 0.4);
    transform: translateX(4px);
  }

  .column-name {
    font-weight: 600;
    color: #fff;
    margin-bottom: 6px;
    font-size: 13px;
  }

  .column-type {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.4) 0%, rgba(118, 75, 162, 0.4) 100%);
    color: rgba(255, 255, 255, 0.9);
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 11px;
    display: inline-block;
    margin-right: 6px;
    margin-bottom: 6px;
    border: 1px solid rgba(102, 126, 234, 0.3);
  }

  .column-nullable {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.7);
    background: rgba(255, 193, 7, 0.2);
    padding: 3px 8px;
    border-radius: 4px;
    display: inline-block;
    border: 1px solid rgba(255, 193, 7, 0.3);
  }
`;

const RecordsCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 16px;
  padding: 25px;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  h3 {
    margin: 0 0 20px 0;
    color: #fff;
    font-size: 16px;
    font-weight: 600;
  }
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(102, 126, 234, 0.2);
`;

const StatBox = styled.div`
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 12px;
  padding: 15px;
  text-align: center;

  .label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
  }

  .count {
    font-size: 28px;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;

const TableContainer = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 12px;

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;

    thead {
      background: rgba(102, 126, 234, 0.2);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid rgba(102, 126, 234, 0.3);
    }

    td {
      padding: 12px;
      border-bottom: 1px solid rgba(102, 126, 234, 0.2);
      font-size: 12px;
      color: rgba(255, 255, 255, 0.8);
      word-break: break-word;
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      &:hover {
        background: rgba(102, 126, 234, 0.15);
      }
    }

    tbody tr:hover {
      background: rgba(102, 126, 234, 0.15);
    }
  }
`;

const TableWrapper = styled.div`
  flex: 1;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(102, 126, 234, 0.4);
    border-radius: 10px;
    &:hover {
      background: rgba(102, 126, 234, 0.6);
    }
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #667eea;

  .spinner {
    border: 4px solid rgba(255, 255, 255, 0.1);
    border-top: 4px solid #667eea;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  background: rgba(244, 67, 54, 0.2);
  color: #ff6b6b;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid rgba(244, 67, 54, 0.4);
  margin-bottom: 20px;
  font-size: 13px;
`;

const NoDataMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background: rgba(102, 126, 234, 0.1);
  color: rgba(255, 255, 255, 0.6);
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  font-size: 13px;
`;

const SelectPrompt = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: rgba(255, 255, 255, 0.5);
  font-size: 16px;
  font-style: italic;
`;

export default function DatabaseInspector() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [columns, setColumns] = useState([]);
  const [data, setData] = useState([]);
  const [recordCount, setRecordCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tableCounts, setTableCounts] = useState({});

  // Fetch available tables on mount
  useEffect(() => {
    const fetchTables = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch('http://localhost:3005/api/db-tables');
        const result = await response.json();

        if (response.ok) {
          const tableList = result.tables || [];
          setTables(tableList);

          // Fetch counts for all tables
          const counts = {};
          for (const table of tableList) {
            try {
              const countResponse = await fetch(`http://localhost:3005/api/db-inspect/${table}`);
              const countData = await countResponse.json();
              if (countResponse.ok) {
                counts[table] = countData.count || 0;
              }
            } catch (err) {
              counts[table] = 0;
            }
          }
          setTableCounts(counts);
        } else {
          setError('Failed to load tables: ' + (result.error || 'Unknown error'));
        }
      } catch (err) {
        setError('Error connecting to database API: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTables();
  }, []);

  // Fetch table details when selection changes
  useEffect(() => {
    if (!selectedTable) return;

    const fetchTableData = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(`http://localhost:3005/api/db-inspect/${selectedTable}`);
        const result = await response.json();

        if (response.ok) {
          setColumns(result.columns || []);
          setData(result.data || []);
          setRecordCount(result.count || 0);
        } else {
          setError('Failed to load table data: ' + (result.error || 'Unknown error'));
        }
      } catch (err) {
        setError('Error fetching table data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTableData();
  }, [selectedTable]);

  return (
    <Container>
      <Header>
        <h1>🗄️ Database Inspector</h1>
        <p>Stock Taking System v2.0.1 — PostgreSQL 17 Local Database</p>
      </Header>

      <TablesSection>
        <TablesGrid>
          {tables.map((table) => (
            <TableButton
              key={table}
              active={selectedTable === table}
              onClick={() => setSelectedTable(table)}
            >
              <div className="table-name">{table}</div>
              <div className="record-count">{tableCounts[table] || 0} records</div>
            </TableButton>
          ))}
        </TablesGrid>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        {!selectedTable ? (
          <ContentArea>
            <SelectPrompt>Select a table to view details</SelectPrompt>
          </ContentArea>
        ) : loading ? (
          <ContentArea>
            <LoadingSpinner>
              <div className="spinner" />
            </LoadingSpinner>
          </ContentArea>
        ) : (
          <ContentArea>
            <ColumnsCard>
              <h3>📋 Columns ({columns.length})</h3>
              <ColumnsList>
                {columns.length > 0 ? (
                  columns.map((col) => (
                    <ColumnItem key={col.column_name}>
                      <div className="column-name">{col.column_name}</div>
                      <div>
                        <span className="column-type">{col.data_type}</span>
                        <span className="column-nullable">
                          {col.is_nullable === 'YES' ? 'nullable' : 'NOT NULL'}
                        </span>
                      </div>
                    </ColumnItem>
                  ))
                ) : (
                  <NoDataMessage>No columns found</NoDataMessage>
                )}
              </ColumnsList>
            </ColumnsCard>

            <RecordsCard>
              <h3>📊 Data Preview</h3>
              <StatsRow>
                <StatBox>
                  <div className="label">Total Records</div>
                  <div className="count">{recordCount}</div>
                </StatBox>
                <StatBox>
                  <div className="label">Columns</div>
                  <div className="count">{columns.length}</div>
                </StatBox>
              </StatsRow>
              {data.length > 0 ? (
                <TableContainer>
                  <TableWrapper>
                    <table>
                      <thead>
                        <tr>
                          {columns.map((col) => (
                            <th key={col.column_name}>{col.column_name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((row, idx) => (
                          <tr key={idx}>
                            {columns.map((col) => (
                              <td key={col.column_name} title={String(row[col.column_name] || '(null)')}>
                                {row[col.column_name] !== null && row[col.column_name] !== undefined
                                  ? String(row[col.column_name]).substring(0, 100)
                                  : '(null)'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </TableWrapper>
                </TableContainer>
              ) : (
                <NoDataMessage>This table is empty</NoDataMessage>
              )}
            </RecordsCard>
          </ContentArea>
        )}
      </TablesSection>
    </Container>
  );
}
