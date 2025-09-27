import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from '../styles/components/Button';
import { Container } from '../styles/GlobalStyles';
import { apiService } from '../services/apiService';

const HistoryContainer = styled(Container)`
  padding-top: ${props => props.theme.spacing.lg};
  padding-bottom: ${props => props.theme.spacing.xl};
  min-height: 100vh;
  background: linear-gradient(135deg, ${props => props.theme.colors.background} 0%, #E8F4FD 100%);
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.xl};
  padding: ${props => props.theme.spacing.xl};
  background: ${props => props.theme.colors.surface};
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid ${props => props.theme.colors.border};

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin: 0;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 1.75rem;
  }
`;

const Subtitle = styled.p`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.textSecondary};
  margin: 0;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 1rem;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xxl};
  font-size: 1.125rem;
  color: ${props => props.theme.colors.textSecondary};
  background: ${props => props.theme.colors.surface};
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const FilterSection = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: 16px;
  padding: ${props => props.theme.spacing.xl};
  margin-bottom: ${props => props.theme.spacing.lg};
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid ${props => props.theme.colors.border};
`;

const FilterGrid = styled.div`
  display: grid;
  gap: ${props => props.theme.spacing.md};
  grid-template-columns: 1fr;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    grid-template-columns: 1fr 1fr 200px;
    align-items: end;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`;

const FilterLabel = styled.label`
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  font-size: 0.875rem;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 1rem;
  }
`;

const FilterSelect = styled.select`
  padding: ${props => props.theme.spacing.md};
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  font-size: 1rem;
  min-height: ${props => props.theme.tablet.minTouchTarget};

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 1.125rem;
    padding: ${props => props.theme.spacing.lg};
  }
`;

const FilterInput = styled.input`
  padding: ${props => props.theme.spacing.md};
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  font-size: 1rem;
  min-height: ${props => props.theme.tablet.minTouchTarget};

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
  }

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 1.125rem;
    padding: ${props => props.theme.spacing.lg};
  }
`;

const SessionGrid = styled.div`
  display: grid;
  gap: ${props => props.theme.spacing.lg};
`;

const SessionCard = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: 16px;
  padding: ${props => props.theme.spacing.xl};
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid ${props => props.theme.colors.border};
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.1);
    border-color: ${props => props.theme.colors.primary};
  }
`;

const SessionHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.lg};

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
  }
`;

const SessionInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
  flex: 1;
`;

const SessionTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 1.25rem;
  }
`;

const SessionDetails = styled.p`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.textSecondary};
  margin: 0;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 1rem;
  }
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.md};
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  ${props => {
    switch (props.status) {
      case 'completed':
        return `
          background: #DEF7EC;
          color: #065F46;
        `;
      case 'in_progress':
        return `
          background: #FEF3C7;
          color: #92400E;
        `;
      case 'cancelled':
        return `
          background: #FEE2E2;
          color: #991B1B;
        `;
      default:
        return `
          background: ${props.theme.colors.border};
          color: ${props.theme.colors.textSecondary};
        `;
    }
  }}
`;

const SessionStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.lg};
  background: ${props => props.theme.colors.background};
  border-radius: 12px;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.primary};
  margin-bottom: ${props => props.theme.spacing.xs};

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 1.75rem;
  }
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 0.875rem;
  }
`;

const SessionActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    flex-direction: row;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xxl};
  color: ${props => props.theme.colors.textSecondary};
  background: ${props => props.theme.colors.surface};
  border-radius: 16px;
  border: 2px dashed ${props => props.theme.colors.border};
`;

const EmptyStateText = styled.p`
  font-size: 1.125rem;
  margin: 0 0 ${props => props.theme.spacing.md} 0;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ExportSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.lg};
  background: ${props => props.theme.colors.background};
  border-radius: 12px;
  margin-top: ${props => props.theme.spacing.lg};

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

const ExportText = styled.div`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.875rem;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 1rem;
  }
`;

const ExportButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    flex-direction: row;
  }
`;

const SessionHistory = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all sessions from the database
      const response = await apiService.getAllSessions(null, 100); // Get up to 100 sessions

      if (response.success) {
        // Transform the API data to match our UI format
        const transformedSessions = response.data.sessions?.map(session => ({
          id: session.id,
          venueName: session.venue_name || 'Unknown Venue',
          stocktakerName: session.stocktaker_name,
          date: session.session_date,
          status: session.status,
          itemsScanned: session.entry_count || 0,
          discrepancies: 0, // This would need to be calculated from actual discrepancy data
          duration: calculateDuration(session.created_at, session.completed_at),
          accuracy: 98 // This would need to be calculated from actual data
        })) || [];

        setSessions(transformedSessions);
      } else {
        setError('Failed to load session history: ' + response.error);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      setError('Failed to load session history. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime) return 'Unknown';
    if (!endTime) return 'In Progress';

    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleSessionClick = (sessionId) => {
    navigate(`/stock-taking/${sessionId}`);
  };

  const handleExport = async (format) => {
    setExporting(true);
    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 2000));
    setExporting(false);

    // In a real app, this would trigger the actual download
    alert(`Exporting to ${format.toUpperCase()} format...`);
  };

  const filteredSessions = sessions.filter(session => {
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    const matchesDate = !dateFilter || session.date.includes(dateFilter);
    return matchesStatus && matchesDate;
  });

  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(s => s.status === 'completed').length;
  const avgAccuracy = sessions.length > 0
    ? (sessions.reduce((acc, s) => acc + s.accuracy, 0) / sessions.length).toFixed(1)
    : 0;
  const totalItems = sessions.reduce((acc, s) => acc + s.itemsScanned, 0);

  if (loading) {
    return (
      <HistoryContainer>
        <LoadingMessage>
          <LoadingSpinner style={{ marginRight: '12px' }} />
          Loading session history...
        </LoadingMessage>
      </HistoryContainer>
    );
  }

  if (error) {
    return (
      <HistoryContainer>
        <Header>
          <HeaderContent>
            <Title>Session History</Title>
            <Subtitle>Unable to load session history</Subtitle>
          </HeaderContent>
          <Button variant="outline" onClick={handleBack}>
            Back to Dashboard
          </Button>
        </Header>
        <EmptyState>
          <EmptyStateText>Error Loading Sessions</EmptyStateText>
          <p>{error}</p>
          <div style={{ marginTop: '16px' }}>
            <Button variant="primary" onClick={loadSessions}>
              Try Again
            </Button>
          </div>
        </EmptyState>
      </HistoryContainer>
    );
  }

  return (
    <HistoryContainer>
      <Header>
        <HeaderContent>
          <Title>Session History</Title>
          <Subtitle>View and manage all stock-taking sessions</Subtitle>
        </HeaderContent>
        <Button variant="outline" onClick={handleBack}>
          Back to Dashboard
        </Button>
      </Header>

      <SessionStats>
        <StatItem>
          <StatValue>{totalSessions}</StatValue>
          <StatLabel>Total Sessions</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{completedSessions}</StatValue>
          <StatLabel>Completed</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{avgAccuracy}%</StatValue>
          <StatLabel>Avg Accuracy</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{totalItems}</StatValue>
          <StatLabel>Items Scanned</StatLabel>
        </StatItem>
      </SessionStats>

      <FilterSection>
        <FilterGrid>
          <FilterGroup>
            <FilterLabel htmlFor="status-filter">Filter by Status</FilterLabel>
            <FilterSelect
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="cancelled">Cancelled</option>
            </FilterSelect>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel htmlFor="date-filter">Filter by Date</FilterLabel>
            <FilterInput
              id="date-filter"
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>&nbsp;</FilterLabel>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStatusFilter('all');
                setDateFilter('');
              }}
            >
              Clear Filters
            </Button>
          </FilterGroup>
        </FilterGrid>
      </FilterSection>

      <SessionGrid>
        {filteredSessions.length > 0 ? (
          filteredSessions.map(session => (
            <SessionCard key={session.id} onClick={() => handleSessionClick(session.id)}>
              <SessionHeader>
                <SessionInfo>
                  <SessionTitle>{session.venueName}</SessionTitle>
                  <SessionDetails>
                    {session.stocktakerName} • {new Date(session.date).toLocaleDateString()} • {session.duration}
                  </SessionDetails>
                </SessionInfo>
                <StatusBadge status={session.status}>
                  {session.status.replace('_', ' ')}
                </StatusBadge>
              </SessionHeader>

              <SessionStats>
                <StatItem>
                  <StatValue>{session.itemsScanned}</StatValue>
                  <StatLabel>Items</StatLabel>
                </StatItem>
                <StatItem>
                  <StatValue>{session.discrepancies}</StatValue>
                  <StatLabel>Issues</StatLabel>
                </StatItem>
                <StatItem>
                  <StatValue>{session.accuracy}%</StatValue>
                  <StatLabel>Accuracy</StatLabel>
                </StatItem>
              </SessionStats>

              <SessionActions>
                {session.status === 'in_progress' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSessionClick(session.id);
                    }}
                  >
                    Continue Session
                  </Button>
                )}
                {session.status === 'completed' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        alert('Viewing detailed report...');
                      }}
                    >
                      View Report
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExport('pdf');
                      }}
                      disabled={exporting}
                    >
                      {exporting ? <LoadingSpinner /> : 'Export PDF'}
                    </Button>
                  </>
                )}
                {session.status === 'cancelled' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      alert('Viewing cancellation details...');
                    }}
                  >
                    View Details
                  </Button>
                )}
              </SessionActions>
            </SessionCard>
          ))
        ) : (
          <EmptyState>
            <EmptyStateText>No sessions found</EmptyStateText>
            <p>Try adjusting your filters or create a new stock-taking session</p>
            <div style={{ marginTop: '16px' }}>
              <Button variant="primary" onClick={() => navigate('/')}>
                Start New Session
              </Button>
            </div>
          </EmptyState>
        )}
      </SessionGrid>

      <ExportSection>
        <ExportText>
          Export all session data for reporting and analysis
        </ExportText>
        <ExportButtons>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            disabled={exporting || sessions.length === 0}
          >
            {exporting ? <LoadingSpinner /> : 'Export CSV'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('excel')}
            disabled={exporting || sessions.length === 0}
          >
            {exporting ? <LoadingSpinner /> : 'Export Excel'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleExport('pdf')}
            disabled={exporting || sessions.length === 0}
          >
            {exporting ? <LoadingSpinner /> : 'Export PDF Report'}
          </Button>
        </ExportButtons>
      </ExportSection>
    </HistoryContainer>
  );
};

export default SessionHistory;
