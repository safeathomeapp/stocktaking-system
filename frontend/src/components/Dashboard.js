import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from '../styles/components/Button';
import { Container } from '../styles/GlobalStyles';
import { apiService } from '../services/apiService';


// Styled Components
const DashboardContainer = styled(Container)`
  padding-top: ${props => props.theme.spacing.lg};
  padding-bottom: ${props => props.theme.spacing.xl};
  min-height: 100vh;
  background: linear-gradient(135deg, ${props => props.theme.colors.background} 0%, #E0E7FF 100%);
`;

const TopBar = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.xl};
  padding: ${props => props.theme.spacing.lg};
  background: ${props => props.theme.colors.surface};
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid ${props => props.theme.colors.border};

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

const VenueSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    flex-direction: row;
    align-items: center;
    gap: ${props => props.theme.spacing.md};
  }
`;

const VenueSelect = styled.select`
  padding: ${props => props.theme.spacing.md};
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  font-size: 1rem;
  min-height: ${props => props.theme.tablet.minTouchTarget};
  min-width: 250px;

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

const SessionsSection = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: 12px;
  padding: ${props => props.theme.spacing.xl};
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid ${props => props.theme.colors.border};
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin-bottom: ${props => props.theme.spacing.lg};

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 1.75rem;
  }
`;

const FilterTabs = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const FilterTab = styled.button`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border: none;
  background: none;
  color: ${props => props.active ? props.theme.colors.primary : props.theme.colors.textSecondary};
  font-weight: ${props => props.active ? 600 : 400};
  border-bottom: 2px solid ${props => props.active ? props.theme.colors.primary : 'transparent'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: ${props => props.theme.colors.primary};
  }
`;

const SessionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
  max-height: 400px;
  overflow-y: auto;
`;

const SessionCard = styled.div`
  padding: ${props => props.theme.spacing.lg};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  background: ${props => props.theme.colors.background};
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: ${props => props.isClickable ? 'pointer' : 'default'};

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px -2px rgba(0, 0, 0, 0.1);
    ${props => props.isClickable && `
      border-color: ${props.theme.colors.primary};
    `}
  }
`;

const SessionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const SessionActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
  align-items: flex-end;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    flex-direction: row;
    gap: ${props => props.theme.spacing.sm};
    align-items: center;
  }
`;

const SessionInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const SessionVenue = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0;
`;

const SessionDetails = styled.p`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.textSecondary};
  margin: 0;
`;

const SessionStatus = styled.span`
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: ${props => {
    switch (props.status) {
      case 'in_progress': return '#FEF3C7';
      case 'completed': return '#D1FAE5';
      case 'paused': return '#FEE2E2';
      default: return '#F3F4F6';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'in_progress': return '#92400E';
      case 'completed': return '#065F46';
      case 'paused': return '#991B1B';
      default: return '#374151';
    }
  }};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xxl};
  color: ${props => props.theme.colors.textSecondary};
`;

const StartStocktakeSection = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.lg};

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    grid-template-columns: 1fr 1fr;
    gap: ${props => props.theme.spacing.lg};
  }

  @media (min-width: ${props => props.theme.breakpoints.desktop}) {
    grid-template-columns: 1fr 1fr 1fr 1fr;
    max-width: 1200px;
    margin-left: auto;
    margin-right: auto;
  }
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

const ErrorMessage = styled.div`
  background: ${props => props.theme.colors.danger};
  color: white;
  padding: ${props => props.theme.spacing.md};
  border-radius: 8px;
  margin-bottom: ${props => props.theme.spacing.md};
  font-weight: 500;
`;

const Dashboard = () => {
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(() => {
    // Initialize from localStorage if available
    return localStorage.getItem('selectedVenue') || '';
  });
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // Update localStorage whenever selectedVenue changes
  useEffect(() => {
    if (selectedVenue) {
      localStorage.setItem('selectedVenue', selectedVenue);
    }
  }, [selectedVenue]);

  useEffect(() => {
    fetchVenues();
    fetchSessions();
    fetchUserProfile();
  }, []);

  useEffect(() => {
    filterSessions();
  }, [sessions, activeFilter, selectedVenue]);

  const fetchVenues = useCallback(async () => {
    try {
      const savedVenue = localStorage.getItem('selectedVenue');
      const response = await apiService.getVenues();
      if (response.success) {
        setVenues(response.data);

        // Validate saved venue still exists, otherwise use first venue
        if (savedVenue && response.data.some(v => v.id === savedVenue)) {
          // Saved venue is valid, keep it selected
          setSelectedVenue(savedVenue);
        } else if (response.data.length > 0) {
          // No saved venue or saved venue doesn't exist, use first venue
          setSelectedVenue(response.data[0].id);
        }
      } else {
        setError('Failed to load venues: ' + response.error);
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
      setError('Failed to load venues. Please refresh the page.');
    }
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await apiService.getAllSessions();
      if (response.success) {
        setSessions(response.data.sessions || []);
      } else {
        console.error('Failed to load sessions:', response.error);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await apiService.getUserSummary();
      if (response.success) {
        setUserProfile(response.summary);
      } else {
        console.error('Failed to load user profile:', response.error);
        setUserProfile({
          first_name: 'Stock',
          last_name: 'Taker',
          profile_complete: false
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile({
        first_name: 'Stock',
        last_name: 'Taker',
        profile_complete: false
      });
    }
  };

  const filterSessions = () => {
    let filtered = sessions;

    // First filter by venue if one is selected
    if (selectedVenue) {
      filtered = filtered.filter(session => session.venue_id === selectedVenue);
    }

    // Then filter by status
    switch (activeFilter) {
      case 'active':
        filtered = filtered.filter(session =>
          session.status === 'in_progress' || session.status === 'paused'
        );
        break;
      case 'completed':
        filtered = filtered.filter(session => session.status === 'completed');
        break;
      default:
        // Keep all sessions for the selected venue
        break;
    }

    setFilteredSessions(filtered);
  };

  const handleStartStocktake = async () => {
    if (!selectedVenue) {
      setError('Please select a venue.');
      return;
    }

    if (!userProfile) {
      setError('User profile not loaded. Please refresh the page or update your settings.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check for open sessions
      const openSessionsResponse = await apiService.getSessions('in_progress');
      let openSessions = [];

      if (openSessionsResponse.success) {
        openSessions = openSessionsResponse.data.sessions || [];
      }

      // If there are open sessions, ask user to confirm closing them
      if (openSessions.length > 0) {
        const latestSession = openSessions.sort((a, b) => new Date(b.session_date) - new Date(a.session_date))[0];
        const confirmClose = window.confirm(
          `There is an open session from ${formatSessionDate(latestSession.session_date)} at ${getVenueName(latestSession.venue_id)}. ` +
          `This session will be automatically completed before starting a new one. Continue?`
        );

        if (!confirmClose) {
          setLoading(false);
          return;
        }

        // Close all open sessions
        for (const session of openSessions) {
          try {
            await apiService.updateSession(session.id, { status: 'completed' });
          } catch (error) {
            console.error('Error closing session:', session.id, error);
          }
        }
      }

      const stocktakerName = `${userProfile.first_name} ${userProfile.last_name}`.trim();

      const sessionData = {
        venue_id: selectedVenue,
        stocktaker_name: stocktakerName,
        session_date: new Date().toISOString().split('T')[0],
        notes: 'Created from dashboard - Single user system'
      };

      const response = await apiService.createSession(sessionData);
      if (response.success) {
        // Navigate directly to counting page now
        navigate(`/stock-taking/${response.data.session.id}`);
      } else {
        setError('Failed to create session: ' + response.error);
      }
    } catch (error) {
      console.error('Error creating session:', error);
      setError('Failed to create stock-taking session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatSessionDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getVenueName = (venueId) => {
    const venue = venues.find(v => v.id === venueId);
    return venue ? venue.name : 'Unknown Venue';
  };

  const handleSessionClick = (session) => {
    // Only allow clicking on active sessions (in_progress or paused)
    if (session.status === 'in_progress' || session.status === 'paused') {
      navigate(`/stock-taking/${session.id}`);
    }
  };

  const handleContinueSession = (e, session) => {
    e.stopPropagation(); // Prevent card click
    navigate(`/stock-taking/${session.id}`);
  };

  return (
    <DashboardContainer>
      <TopBar>
        <VenueSection>
          <VenueSelect
            value={selectedVenue}
            onChange={(e) => setSelectedVenue(e.target.value)}
          >
            <option value="">Select a venue...</option>
            {venues.map((venue) => {
              const addressParts = [
                venue.address_line_1,
                venue.city,
                venue.county,
                venue.postcode
              ].filter(Boolean);
              const displayAddress = addressParts.length > 0 ? addressParts.join(', ') : (venue.address || 'No address');

              return (
                <option key={venue.id} value={venue.id}>
                  {venue.name} - {displayAddress}
                </option>
              );
            })}
          </VenueSelect>

          <Button
            variant="secondary"
            onClick={() => navigate('/venue/new')}
          >
            Add New Venue
          </Button>
        </VenueSection>

        <Button
          variant="outline"
          onClick={() => navigate('/settings')}
        >
          ⚙️ Settings
        </Button>
      </TopBar>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <SessionsSection>
        <SectionTitle>Stock Taking Sessions</SectionTitle>

        <FilterTabs>
          <FilterTab
            active={activeFilter === 'all'}
            onClick={() => setActiveFilter('all')}
          >
            All Sessions
          </FilterTab>
          <FilterTab
            active={activeFilter === 'active'}
            onClick={() => setActiveFilter('active')}
          >
            Active
          </FilterTab>
          <FilterTab
            active={activeFilter === 'completed'}
            onClick={() => setActiveFilter('completed')}
          >
            Completed
          </FilterTab>
        </FilterTabs>

        <SessionsList>
          {filteredSessions.length === 0 ? (
            <EmptyState>
              {activeFilter === 'all' && 'No sessions found'}
              {activeFilter === 'active' && 'No active sessions'}
              {activeFilter === 'completed' && 'No completed sessions'}
            </EmptyState>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.status === 'in_progress' || session.status === 'paused';

              return (
                <SessionCard
                  key={session.id}
                  isClickable={isActive}
                  onClick={() => handleSessionClick(session)}
                >
                  <SessionHeader>
                    <SessionInfo>
                      <SessionVenue>
                        {getVenueName(session.venue_id)}
                      </SessionVenue>
                      <SessionDetails>
                        Date: {formatSessionDate(session.session_date)} •
                        Stocktaker: {session.stocktaker_name}
                      </SessionDetails>
                      {session.notes && (
                        <SessionDetails>
                          Notes: {session.notes}
                        </SessionDetails>
                      )}
                    </SessionInfo>

                    <SessionActions>
                      <SessionStatus status={session.status}>
                        {session.status.replace('_', ' ')}
                      </SessionStatus>

                      {isActive && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={(e) => handleContinueSession(e, session)}
                        >
                          Continue
                        </Button>
                      )}
                    </SessionActions>
                  </SessionHeader>
                </SessionCard>
              );
            })
          )}
        </SessionsList>
      </SessionsSection>

      <StartStocktakeSection>
        <Button
          onClick={handleStartStocktake}
          disabled={loading || !selectedVenue}
          size="lg"
        >
          {loading ? <LoadingSpinner /> : 'Start New Stock Take'}
        </Button>

        <Button
          onClick={() => navigate(`/area-setup/${selectedVenue}`)}
          disabled={!selectedVenue}
          variant="secondary"
          size="lg"
        >
          Set-up Areas
        </Button>

        <Button
          onClick={() => navigate('/invoice-input')}
          variant="outline"
          size="lg"
        >
          Input Invoices
        </Button>

        <Button
          onClick={() => navigate(`/epos-csv-input/${selectedVenue}`)}
          variant="outline"
          size="lg"
          disabled={!selectedVenue}
        >
          Input Epos CSV
        </Button>
      </StartStocktakeSection>
    </DashboardContainer>
  );
};

export default Dashboard;
