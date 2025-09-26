import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../services/apiService';
// Remove unused import
// import { formatDate } from '../utils/helpers';

const SessionHistory = () => {
  const [sessions, setSessions] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all', // all, in_progress, completed, reviewed
    venue: 'all',
    limit: 50
  });
  const [pagination, setPagination] = useState({
    total: 0,
    offset: 0,
    hasMore: false
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    // Define loadSessions inside useEffect to avoid dependency warning
    const loadSessionsWithFilters = async (offset = 0) => {
      setLoading(true);
      setError(null);

      try {
        let result;
        
        if (filters.venue === 'all') {
          // Get all sessions
          const status = filters.status === 'all' ? null : filters.status;
          result = await apiService.getAllSessions(status, filters.limit, offset);
        } else {
          // Get sessions for specific venue
          const status = filters.status === 'all' ? null : filters.status;
          result = await apiService.getVenueSessions(filters.venue, status, filters.limit, offset);
        }

        if (result.success) {
          const sessionData = result.data.sessions || [];
          
          if (offset === 0) {
            setSessions(sessionData);
          } else {
            setSessions(prev => [...prev, ...sessionData]);
          }

          setPagination({
            total: result.data.total || sessionData.length,
            offset: offset,
            hasMore: sessionData.length === filters.limit
          });
        } else {
          setError('Failed to load session history: ' + result.error);
        }
      } catch (err) {
        setError('Error loading sessions: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadSessionsWithFilters();
  }, [filters]);

  const loadInitialData = async () => {
    // Load venues for filter dropdown
    const venuesResult = await apiService.getVenues();
    if (venuesResult.success) {
      setVenues(venuesResult.data);
    }
    
    // Sessions will be loaded by the useEffect with filters dependency
  };

  const loadMoreSessions = () => {
    const newOffset = pagination.offset + filters.limit;
    
    // Call the session loading logic directly
    const loadMore = async () => {
      setLoading(true);
      setError(null);

      try {
        let result;
        
        if (filters.venue === 'all') {
          const status = filters.status === 'all' ? null : filters.status;
          result = await apiService.getAllSessions(status, filters.limit, newOffset);
        } else {
          const status = filters.status === 'all' ? null : filters.status;
          result = await apiService.getVenueSessions(filters.venue, status, filters.limit, newOffset);
        }

        if (result.success) {
          const sessionData = result.data.sessions || [];
          setSessions(prev => [...prev, ...sessionData]);

          setPagination({
            total: result.data.total || sessionData.length,
            offset: newOffset,
            hasMore: sessionData.length === filters.limit
          });
        } else {
          setError('Failed to load more sessions: ' + result.error);
        }
      } catch (err) {
        setError('Error loading more sessions: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadMore();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination({ total: 0, offset: 0, hasMore: false });
  };

  const exportSessionsCSV = () => {
    const csvHeader = 'Date,Venue,Stocktaker,Status,Products Counted,Notes\n';
    const csvRows = sessions.map(session => {
      const date = new Date(session.created_at).toLocaleDateString();
      const venue = session.venue_name || 'Unknown';
      const stocktaker = session.stocktaker_name || 'Unknown';
      const status = session.status || 'unknown';
      const productCount = session.entry_count || '0';
      const notes = (session.notes || '').replace(/"/g, '""'); // Escape quotes
      
      return `"${date}","${venue}","${stocktaker}","${status}","${productCount}","${notes}"`;
    }).join('\n');

    const csvContent = csvHeader + csvRows;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stock-sessions-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading && sessions.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem' }}>
        <div>Loading session history...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>Session History</h1>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={exportSessionsCSV}
            disabled={sessions.length === 0}
            style={{
              backgroundColor: sessions.length > 0 ? '#28a745' : '#6c757d',
              color: 'white',
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '3px',
              cursor: sessions.length > 0 ? 'pointer' : 'not-allowed'
            }}
          >
            Export CSV
          </button>
          
          <Link
            to="/venues"
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              padding: '0.5rem 1rem',
              textDecoration: 'none',
              borderRadius: '3px'
            }}
          >
            New Stock Take
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div style={{ 
        backgroundColor: 'white', 
        border: '1px solid #ddd', 
        borderRadius: '5px', 
        padding: '1rem', 
        marginBottom: '1.5rem',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
            Status:
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '3px',
              fontSize: '0.875rem'
            }}
          >
            <option value="all">All Status</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="reviewed">Reviewed</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
            Venue:
          </label>
          <select
            value={filters.venue}
            onChange={(e) => handleFilterChange('venue', e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '3px',
              fontSize: '0.875rem'
            }}
          >
            <option value="all">All Venues</option>
            {venues.map(venue => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
            Show:
          </label>
          <select
            value={filters.limit}
            onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
            style={{
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '3px',
              fontSize: '0.875rem'
            }}
          >
            <option value={25}>25 sessions</option>
            <option value={50}>50 sessions</option>
            <option value={100}>100 sessions</option>
          </select>
        </div>
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
        </div>
      )}

      {/* Sessions List */}
      <div style={{ backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '5px' }}>
        {sessions.length === 0 && !loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No sessions found</p>
            <p>Try adjusting your filters or create a new stock take</p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 2fr 1.5fr 1fr 1fr 1fr 1fr',
              gap: '1rem',
              padding: '1rem',
              borderBottom: '1px solid #ddd',
              backgroundColor: '#f8f9fa',
              fontWeight: 'bold',
              fontSize: '0.875rem'
            }}>
              <div>Date</div>
              <div>Venue</div>
              <div>Stocktaker</div>
              <div>Status</div>
              <div>Products</div>
              <div>Completed</div>
              <div>Actions</div>
            </div>

            {/* Session Rows */}
            {sessions.map(session => (
              <SessionRow key={session.id} session={session} />
            ))}

            {/* Load More Button */}
            {pagination.hasMore && (
              <div style={{ padding: '1rem', textAlign: 'center', borderTop: '1px solid #ddd' }}>
                <button
                  onClick={loadMoreSessions}
                  disabled={loading}
                  style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    padding: '0.5rem 1.5rem',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Summary */}
      {sessions.length > 0 && (
        <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666', textAlign: 'center' }}>
          Showing {sessions.length} of {pagination.total || sessions.length} sessions
        </div>
      )}
    </div>
  );
};

// Session Row Component
const SessionRow = ({ session }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#28a745';
      case 'in_progress': return '#fd7e14';
      case 'reviewed': return '#6f42c1';
      default: return '#6c757d';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'reviewed': return 'Reviewed';
      default: return status;
    }
  };

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '1fr 2fr 1.5fr 1fr 1fr 1fr 1fr',
      gap: '1rem',
      padding: '1rem',
      borderBottom: '1px solid #eee',
      alignItems: 'center'
    }}>
      <div style={{ fontSize: '0.875rem' }}>
        {new Date(session.created_at).toLocaleDateString()}
      </div>
      
      <div>
        <div style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
          {session.venue_name || 'Unknown Venue'}
        </div>
        {session.venue_address && (
          <div style={{ fontSize: '0.75rem', color: '#666' }}>
            {session.venue_address}
          </div>
        )}
      </div>
      
      <div style={{ fontSize: '0.875rem' }}>
        {session.stocktaker_name}
      </div>
      
      <div>
        <span style={{
          backgroundColor: getStatusColor(session.status),
          color: 'white',
          padding: '0.25rem 0.5rem',
          borderRadius: '3px',
          fontSize: '0.75rem',
          fontWeight: 'bold'
        }}>
          {getStatusLabel(session.status)}
        </span>
      </div>
      
      <div style={{ fontSize: '0.875rem', textAlign: 'center' }}>
        {session.entry_count || '0'}
      </div>
      
      <div style={{ fontSize: '0.875rem' }}>
        {session.completed_at ? new Date(session.completed_at).toLocaleDateString() : '-'}
      </div>
      
      <div>
        {session.status === 'in_progress' ? (
          <Link
            to={`/stocktaking/${session.id}`}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              padding: '0.25rem 0.75rem',
              textDecoration: 'none',
              borderRadius: '3px',
              fontSize: '0.75rem'
            }}
          >
            Continue
          </Link>
        ) : (
          <Link
            to={`/stocktaking/${session.id}`}
            style={{
              backgroundColor: '#17a2b8',
              color: 'white',
              padding: '0.25rem 0.75rem',
              textDecoration: 'none',
              borderRadius: '3px',
              fontSize: '0.75rem'
            }}
          >
            View
          </Link>
        )}
      </div>
    </div>
  );
};

export default SessionHistory;