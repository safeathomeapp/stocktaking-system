import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../services/apiService';
import { formatDate } from '../utils/helpers';

const Dashboard = () => {
  const [activeSessions, setActiveSessions] = useState([]);
  const [stats, setStats] = useState({
    totalVenues: 0,
    activeSessions: 0,
    completedToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check API health
      const healthResult = await apiService.checkHealth();
      setHealthStatus(healthResult.success ? 'healthy' : 'unhealthy');

      // Load active sessions
      const sessionsResult = await apiService.getSessions('in_progress');
      if (sessionsResult.success) {
        const sessions = sessionsResult.data.sessions || [];
        setActiveSessions(sessions);
        setStats(prev => ({ ...prev, activeSessions: sessions.length }));
      }

      // Load venue count
      const venuesResult = await apiService.getVenues();
      if (venuesResult.success) {
        const venues = venuesResult.data || [];
        setStats(prev => ({ ...prev, totalVenues: venues.length }));
      }

      // Load completed sessions today (simplified - just get completed sessions)
      const completedResult = await apiService.getSessions('completed');
      if (completedResult.success) {
        const completed = completedResult.data.sessions || [];
        const today = new Date().toDateString();
        const completedToday = completed.filter(session => 
          new Date(session.completed_at).toDateString() === today
        );
        setStats(prev => ({ ...prev, completedToday: completedToday.length }));
      }

    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem' }}>
        <div>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>Dashboard</h1>
        <Link
          to="/venues"
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            padding: '0.75rem 1.5rem',
            textDecoration: 'none',
            borderRadius: '5px',
            fontWeight: 'bold'
          }}
        >
          + New Stock Take
        </Link>
      </div>

      {/* API Health Status */}
      <div style={{ 
        backgroundColor: healthStatus === 'healthy' ? '#d4edda' : '#f8d7da',
        padding: '0.75rem',
        borderRadius: '5px',
        marginBottom: '1.5rem',
        border: `1px solid ${healthStatus === 'healthy' ? '#c3e6cb' : '#f5c6cb'}`
      }}>
        <strong>API Status: </strong>
        <span style={{ color: healthStatus === 'healthy' ? '#155724' : '#721c24' }}>
          {healthStatus === 'healthy' ? 'Connected' : 'Connection Issues'}
        </span>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          padding: '1rem', 
          borderRadius: '5px', 
          marginBottom: '1.5rem',
          border: '1px solid #f5c6cb' 
        }}>
          <p style={{ margin: 0, color: '#721c24' }}>{error}</p>
          <button 
            onClick={loadDashboardData}
            style={{ 
              marginTop: '0.5rem', 
              color: '#721c24', 
              background: 'none', 
              border: 'none',
              textDecoration: 'underline',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Quick Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem', 
        marginBottom: '2rem' 
      }}>
        <StatCard title="Total Venues" value={stats.totalVenues} color="#007bff" />
        <StatCard title="Active Sessions" value={stats.activeSessions} color="#fd7e14" />
        <StatCard title="Completed Today" value={stats.completedToday} color="#28a745" />
      </div>

      {/* Active Sessions */}
      <div style={{ 
        backgroundColor: 'white', 
        border: '1px solid #ddd', 
        borderRadius: '5px',
        padding: '1.5rem'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>
          Active Sessions ({activeSessions.length})
        </h2>

        {activeSessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No active stock takes</p>
            <p>Start a new stock take to begin counting inventory</p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '1rem' 
          }}>
            {activeSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, color }) => {
  return (
    <div style={{ 
      backgroundColor: 'white', 
      border: '1px solid #ddd', 
      borderRadius: '5px', 
      padding: '1.5rem',
      textAlign: 'center'
    }}>
      <div style={{ 
        fontSize: '2rem', 
        fontWeight: 'bold', 
        color: color,
        marginBottom: '0.5rem'
      }}>
        {value}
      </div>
      <div style={{ color: '#666' }}>{title}</div>
    </div>
  );
};

// Session Card Component  
const SessionCard = ({ session }) => {
  return (
    <Link
      to={`/stocktaking/${session.id}`}
      style={{ 
        display: 'block',
        backgroundColor: '#f8f9fa', 
        border: '1px solid #ddd', 
        borderRadius: '5px', 
        padding: '1rem',
        textDecoration: 'none',
        color: 'inherit'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#333' }}>
          {session.venue_name || 'Unknown Venue'}
        </h3>
        <span style={{ 
          backgroundColor: '#fd7e14', 
          color: 'white', 
          fontSize: '0.75rem', 
          padding: '0.25rem 0.5rem', 
          borderRadius: '3px' 
        }}>
          In Progress
        </span>
      </div>
      <p style={{ margin: '0.5rem 0', color: '#666' }}>
        Stocktaker: {session.stocktaker_name}
      </p>
      <p style={{ margin: 0, fontSize: '0.875rem', color: '#999' }}>
        Started: {formatDate(session.created_at)}
      </p>
    </Link>
  );
};

export default Dashboard;