import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from '../styles/components/Button';
import { Container } from '../styles/GlobalStyles';
import { apiService } from '../services/apiService';

// Styled Components
const DashboardContainer = styled(Container)`
  padding-top: ${props => props.theme.spacing.xl};
  padding-bottom: ${props => props.theme.spacing.xl};
  min-height: 100vh;
  background: linear-gradient(135deg, ${props => props.theme.colors.background} 0%, #E0E7FF 100%);
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.xxl};
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin-bottom: ${props => props.theme.spacing.md};
  
  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 3rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.125rem;
  color: ${props => props.theme.colors.textSecondary};
  max-width: 600px;
  margin: 0 auto;
  
  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 1.25rem;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.xxl};
  
  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: ${props => props.theme.spacing.lg};
  }
`;

const StatCard = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: 12px;
  padding: ${props => props.theme.spacing.lg};
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid ${props => props.theme.colors.border};
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.1);
  }
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.theme.colors.primary};
  margin-bottom: ${props => props.theme.spacing.xs};
  
  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 2.5rem;
  }
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 1rem;
  }
`;

const ActionSection = styled.section`
  background: ${props => props.theme.colors.surface};
  border-radius: 16px;
  padding: ${props => props.theme.spacing.xl};
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid ${props => props.theme.colors.border};
  margin-bottom: ${props => props.theme.spacing.xxl};
`;

const ActionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin-bottom: ${props => props.theme.spacing.lg};
  text-align: center;
  
  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 1.75rem;
  }
`;

const VenueForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
  max-width: 500px;
  margin: 0 auto;
  
  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    gap: ${props => props.theme.spacing.lg};
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`;

const Label = styled.label`
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  font-size: 0.875rem;
  
  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 1rem;
  }
`;

const Select = styled.select`
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

const Input = styled.input`
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

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.lg};
  
  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    flex-direction: row;
    justify-content: center;
    gap: ${props => props.theme.spacing.lg};
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
  const [selectedVenue, setSelectedVenue] = useState('');
  const [stocktakerName, setStocktakerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    activeSessions: 0,
    completedToday: 0,
    totalVenues: 0,
    avgAccuracy: 98
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchVenues();
    fetchStats();
  }, []);

  const fetchVenues = async () => {
    try {
      const response = await apiService.getVenues();
      if (response.success) {
        setVenues(response.data);
      } else {
        setError('Failed to load venues: ' + response.error);
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
      setError('Failed to load venues. Please refresh the page.');
    }
  };

  const fetchStats = async () => {
    try {
      // Get active sessions
      const activeSessions = await apiService.getSessions('in_progress');

      // Get completed sessions
      const completedSessions = await apiService.getSessions('completed');

      // Get all sessions to calculate completed today
      const allSessions = await apiService.getAllSessions();

      let activeSessionsCount = 0;
      let completedTodayCount = 0;

      if (activeSessions.success) {
        activeSessionsCount = activeSessions.data.sessions?.length || 0;
      }

      if (allSessions.success) {
        const today = new Date().toISOString().split('T')[0];
        completedTodayCount = allSessions.data.sessions?.filter(session =>
          session.status === 'completed' &&
          session.session_date === today
        ).length || 0;
      }

      setStats(prev => ({
        ...prev,
        activeSessions: activeSessionsCount,
        completedToday: completedTodayCount,
        totalVenues: venues.length,
        avgAccuracy: 98 // Keep this as static for now
      }));
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Don't show error for stats, just keep defaults
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVenue || !stocktakerName.trim()) {
      setError('Please select a venue and enter your name.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const sessionData = {
        venue_id: selectedVenue,
        stocktaker_name: stocktakerName.trim(),
        session_date: new Date().toISOString().split('T')[0],
        notes: 'Created from dashboard'
      };
      
      const response = await apiService.createSession(sessionData);
      if (response.success) {
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

  const handleViewHistory = () => {
    navigate('/history');
  };

  return (
    <DashboardContainer>
      <Header>
        <Title>Stock Management System</Title>
        <Subtitle>
          Professional inventory management for hospitality venues with real-time tracking and comprehensive reporting.
        </Subtitle>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatNumber>{stats.activeSessions}</StatNumber>
          <StatLabel>Active Sessions</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{stats.completedToday}</StatNumber>
          <StatLabel>Completed Today</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{stats.totalVenues}</StatNumber>
          <StatLabel>Total Venues</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{stats.avgAccuracy}%</StatNumber>
          <StatLabel>Average Accuracy</StatLabel>
        </StatCard>
      </StatsGrid>

      <ActionSection>
        <ActionTitle>Start New Stock Take</ActionTitle>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <VenueForm onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="venue">Select Venue</Label>
            <Select
              id="venue"
              value={selectedVenue}
              onChange={(e) => setSelectedVenue(e.target.value)}
              required
            >
              <option value="">Choose a venue...</option>
              {venues.map((venue) => {
                const addressParts = [
                  venue.address_line_1,
                  venue.city,
                  venue.postcode
                ].filter(Boolean);
                const displayAddress = addressParts.length > 0 ? addressParts.join(', ') : (venue.address || 'No address');

                return (
                  <option key={venue.id} value={venue.id}>
                    {venue.name} - {displayAddress}
                  </option>
                );
              })}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="stocktaker">Stocktaker Name</Label>
            <Input
              id="stocktaker"
              type="text"
              placeholder="Enter your name"
              value={stocktakerName}
              onChange={(e) => setStocktakerName(e.target.value)}
              required
            />
          </FormGroup>

          <ButtonGroup>
            <Button
              type="submit"
              disabled={loading}
              size="lg"
            >
              {loading ? <LoadingSpinner /> : 'Start Stock Take'}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleViewHistory}
              size="lg"
            >
              View History
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/venue/new')}
              size="lg"
            >
              Add New Venue
            </Button>
          </ButtonGroup>
        </VenueForm>
      </ActionSection>
    </DashboardContainer>
  );
};

export default Dashboard;
