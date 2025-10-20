import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';

const VenueSelection = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [stocktakerName, setStocktakerName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    setLoading(true);
    setError(null);
    
    const result = await apiService.getVenues();
    
    if (result.success) {
      setVenues(result.data);
    } else {
      setError('Failed to load venues: ' + result.error);
    }
    
    setLoading(false);
  };

  const startStockTake = async (venue) => {
	  if (!stocktakerName.trim()) {
		alert('Please enter stocktaker name');
		return;
	  }

	  setCreating(true);
	  
	  const sessionData = {
		venue_id: venue.id,
		stocktaker_name: stocktakerName.trim(),
		notes: `Stock take started for ${venue.name}`
	  };

	  const result = await apiService.createSession(sessionData);
	  
	  if (result.success) {
		// Fix: The session ID is nested under session object
		const sessionId = result.data.session?.id;
		
		if (sessionId) {
		  navigate(`/stocktaking/${sessionId}`);
		} else {
		  alert('Session created but no ID returned');
		  setCreating(false);
		}
	  } else {
		alert('Failed to create session: ' + result.error);
		setCreating(false);
	  }
	};

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem' }}>
        <div>Loading venues...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
        Start New Stock Take
      </h1>

      {/* Stocktaker Name Input */}
      <div style={{ marginBottom: '2rem', maxWidth: '400px' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Stocktaker Name:
        </label>
        <input
          type="text"
          value={stocktakerName}
          onChange={(e) => setStocktakerName(e.target.value)}
          placeholder="Enter your name"
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            border: '1px solid #ddd',
            borderRadius: '5px'
          }}
        />
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
            onClick={loadVenues}
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

      {/* Venue Selection */}
      <div>
        <h2 style={{ marginBottom: '1rem' }}>Select Venue:</h2>
        
        {venues.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem', 
            backgroundColor: '#f8f9fa',
            borderRadius: '5px',
            border: '1px solid #ddd'
          }}>
            <p>No venues available</p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '1rem' 
          }}>
            {venues.map((venue) => (
              <VenueCard 
                key={venue.id} 
                venue={venue} 
                onSelect={() => startStockTake(venue)}
                disabled={creating || !stocktakerName.trim()}
                creating={creating}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Venue Card Component
const VenueCard = ({ venue, onSelect, disabled, creating }) => {
  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #ddd',
      borderRadius: '5px',
      padding: '1.5rem',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1
    }}>
      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#333' }}>
        {venue.name}
      </h3>
      
      {venue.address && (
        <p style={{ margin: '0 0 1rem 0', color: '#666', fontSize: '0.9rem' }}>
          {venue.address}
        </p>
      )}

      <button
        onClick={onSelect}
        disabled={disabled}
        style={{
          backgroundColor: disabled ? '#6c757d' : '#007bff',
          color: 'white',
          border: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: '5px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '1rem',
          width: '100%'
        }}
      >
        {creating ? 'Starting...' : 'Start Stock Take'}
      </button>
    </div>
  );
};

export default VenueSelection;