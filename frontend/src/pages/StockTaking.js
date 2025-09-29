import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import { formatQuantityLevel, getQuantityDescription } from '../utils/helpers';

const StockTaking = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [session, setSession] = useState(null);
  const [products, setProducts] = useState([]);
  const [entries, setEntries] = useState([]);
  const [progress, setProgress] = useState({ completed: 0, total: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, counted, uncounted
  const [currentProductIndex, setCurrentProductIndex] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Load session details
        const sessionResult = await apiService.getSessionById(sessionId);
        if (!sessionResult.success) {
          throw new Error(sessionResult.error);
        }
        setSession(sessionResult.data);

        // Load venue products
        const productsResult = await apiService.getVenueProducts(sessionResult.data.venue_id);
        if (!productsResult.success) {
          throw new Error(productsResult.error);
        }
        setProducts(productsResult.data);

        // Load existing entries
        const entriesResult = await apiService.getSessionEntries(sessionId);
        if (entriesResult.success) {
          setEntries(entriesResult.data.entries || []);
        }

        // Load progress
        const progressResult = await apiService.getSessionProgress(sessionId);
        if (progressResult.success) {
          setProgress(progressResult.data);
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [sessionId]);

  const loadStockTakingData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load session details
      const sessionResult = await apiService.getSessionById(sessionId);
      if (!sessionResult.success) {
        throw new Error(sessionResult.error);
      }
      setSession(sessionResult.data);

      // Load venue products
      const productsResult = await apiService.getVenueProducts(sessionResult.data.venue_id);
      if (!productsResult.success) {
        throw new Error(productsResult.error);
      }
      setProducts(productsResult.data);

      // Load existing entries
      const entriesResult = await apiService.getSessionEntries(sessionId);
      if (entriesResult.success) {
        setEntries(entriesResult.data.entries || []);
      }

      // Load progress
      const progressResult = await apiService.getSessionProgress(sessionId);
      if (progressResult.success) {
        setProgress(progressResult.data);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStockEntry = async (product, quantityUnits = 0, venueAreaId = null) => {
    try {
      // Check if entry already exists
      const existingEntry = entries.find(entry => entry.product_id === product.id);

      const entryData = {
        quantity_units: quantityUnits,
        venue_area_id: venueAreaId
      };

      let result;
      if (existingEntry) {
        // Update existing entry
        result = await apiService.updateStockEntry(existingEntry.id, entryData);
      } else {
        // Create new entry
        result = await apiService.addStockEntry(sessionId, {
          product_id: product.id,
          ...entryData
        });
      }

      if (result.success) {
        // Reload entries and progress
        await loadStockTakingData();
        
        // Move to next product if this was a new entry
        if (!existingEntry && currentProductIndex < filteredProducts.length - 1) {
          setCurrentProductIndex(currentProductIndex + 1);
        }
      } else {
        alert('Failed to save stock entry: ' + result.error);
      }
    } catch (err) {
      alert('Error saving stock entry: ' + err.message);
    }
  };

  const completeSession = async () => {
    // Use window.confirm instead of plain confirm to avoid ESLint error
    if (!window.confirm('Are you sure you want to complete this stock take? You won\'t be able to make changes after completion.')) {
      return;
    }

    const result = await apiService.updateSession(sessionId, {
      status: 'completed',
      notes: session.notes + ' | Completed via web interface'
    });

    if (result.success) {
      alert('Stock take completed successfully!');
      navigate('/');
    } else {
      alert('Failed to complete session: ' + result.error);
    }
  };

  // Filter products based on current filter
  const filteredProducts = products.filter(product => {
    if (filter === 'all') return true;
    
    const hasEntry = entries.some(entry => entry.product_id === product.id);
    if (filter === 'counted') return hasEntry;
    if (filter === 'uncounted') return !hasEntry;
    
    return true;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem' }}>
        <div>Loading stock take session...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '1rem' }}>
        <div style={{ 
          backgroundColor: '#f8d7da', 
          padding: '1rem', 
          borderRadius: '5px', 
          border: '1px solid #f5c6cb' 
        }}>
          <h2 style={{ color: '#721c24', marginTop: 0 }}>Error Loading Session</h2>
          <p style={{ color: '#721c24' }}>{error}</p>
          <button 
            onClick={() => navigate('/')}
            style={{ 
              backgroundColor: '#6c757d', 
              color: 'white', 
              padding: '0.5rem 1rem', 
              border: 'none', 
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{session?.venue_name}</h1>
            <p style={{ margin: '0.25rem 0', color: '#666' }}>Stocktaker: {session?.stocktaker_name}</p>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#999' }}>
              Started: {session ? new Date(session.created_at).toLocaleString() : ''}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => navigate('/')}
              style={{ 
                backgroundColor: '#6c757d', 
                color: 'white', 
                padding: '0.5rem 1rem', 
                border: 'none', 
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Back to Dashboard
            </button>
            
            {progress.percentage === 100 && (
              <button 
                onClick={completeSession}
                style={{ 
                  backgroundColor: '#28a745', 
                  color: 'white', 
                  padding: '0.5rem 1rem', 
                  border: 'none', 
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Complete Session
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Progress: {progress.completed} of {progress.total} products</span>
            <span>{progress.percentage}%</span>
          </div>
          <div style={{ 
            width: '100%', 
            backgroundColor: '#e9ecef', 
            borderRadius: '4px', 
            height: '8px' 
          }}>
            <div style={{ 
              width: `${progress.percentage}%`, 
              backgroundColor: '#007bff', 
              height: '8px', 
              borderRadius: '4px',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {['all', 'uncounted', 'counted'].map(filterOption => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #ddd',
                borderRadius: '3px',
                backgroundColor: filter === filterOption ? '#007bff' : 'white',
                color: filter === filterOption ? 'white' : '#333',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {filterOption} ({
                filterOption === 'all' ? products.length :
                filterOption === 'counted' ? entries.length :
                products.length - entries.length
              })
            </button>
          ))}
        </div>
      </div>

      {/* Products List */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '1rem' 
      }}>
        {filteredProducts.map((product, index) => (
          <ProductCard 
            key={product.id}
            product={product}
            entry={entries.find(entry => entry.product_id === product.id)}
            onStockEntry={handleStockEntry}
            isActive={index === currentProductIndex && filter === 'uncounted'}
          />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          <p>No products to display for the current filter.</p>
        </div>
      )}
    </div>
  );
};

// Product Card Component
const ProductCard = ({ product, entry, onStockEntry, isActive }) => {
  const [quantityUnits, setQuantityUnits] = useState(entry?.quantity_units || 0);
  const [venueAreaId, setVenueAreaId] = useState(entry?.venue_area_id || null);
  const [isEditing, setIsEditing] = useState(!entry && isActive);

  const handleSave = () => {
    onStockEntry(product, quantityUnits, venueAreaId);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  return (
    <div style={{
      backgroundColor: 'white',
      border: `2px solid ${entry ? '#28a745' : (isActive ? '#007bff' : '#ddd')}`,
      borderRadius: '8px',
      padding: '1.5rem',
      position: 'relative'
    }}>
      {/* Product Info */}
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>
          {product.name}
        </h3>
        
        <div style={{ fontSize: '0.875rem', color: '#666' }}>
          {product.brand && <span>Brand: {product.brand} | </span>}
          {product.category && <span>Category: {product.category} | </span>}
          {product.size && <span>Size: {product.size}</span>}
        </div>
      </div>

      {/* Current Status */}
      {entry && !isEditing && (
        <div style={{ 
          backgroundColor: '#d4edda', 
          padding: '0.75rem', 
          borderRadius: '4px', 
          marginBottom: '1rem',
          border: '1px solid #c3e6cb'
        }}>
          <div style={{ fontWeight: 'bold', color: '#155724' }}>
            Quantity: {entry.quantity_units || 0}
          </div>
          {entry.venue_area_name && (
            <div style={{ color: '#155724', fontSize: '0.875rem' }}>
              Area: {entry.venue_area_name}
            </div>
          )}
        </div>
      )}

      {/* Input Controls */}
      {isEditing && (
        <div style={{ marginBottom: '1rem' }}>
          {/* Quantity Level Slider */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Stock Level: {formatQuantityLevel(quantityLevel)} ({getQuantityDescription(quantityLevel)})
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={quantityLevel}
              onChange={(e) => setQuantityLevel(parseFloat(e.target.value))}
              style={{ width: '100%', marginBottom: '0.5rem' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#666' }}>
              <span>Empty</span>
              <span>Quarter</span>
              <span>Half</span>
              <span>Three-quarters</span>
              <span>Full</span>
            </div>
          </div>

          {/* Quick Level Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Empty', value: 0 },
              { label: '1/4', value: 0.25 },
              { label: '1/2', value: 0.5 },
              { label: '3/4', value: 0.75 },
              { label: 'Full', value: 1 }
            ].map(({ label, value }) => (
              <button
                key={label}
                onClick={() => setQuantityLevel(value)}
                style={{
                  padding: '0.25rem 0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '3px',
                  backgroundColor: quantityLevel === value ? '#007bff' : 'white',
                  color: quantityLevel === value ? 'white' : '#333',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Unit Count */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Unit Count (optional):
            </label>
            <input
              type="number"
              value={quantityUnits}
              onChange={(e) => setQuantityUnits(parseInt(e.target.value) || 0)}
              min="0"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '3px'
              }}
            />
          </div>

          {/* Location Notes */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Location/Notes:
            </label>
            <input
              type="text"
              value={locationNotes}
              onChange={(e) => setLocationNotes(e.target.value)}
              placeholder="e.g., Bar area, Cellar, Behind till..."
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '3px'
              }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '3px',
                cursor: 'pointer',
                flex: 1
              }}
            >
              Save
            </button>
            {entry && (
              <button
                onClick={() => setIsEditing(false)}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            )}
          </>
        ) : (
          <button
            onClick={handleEdit}
            style={{
              backgroundColor: entry ? '#17a2b8' : '#007bff',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '3px',
              cursor: 'pointer',
              flex: 1
            }}
          >
            {entry ? 'Edit Count' : 'Count Stock'}
          </button>
        )}
      </div>

      {/* Status Badge */}
      {entry && (
        <div style={{
          position: 'absolute',
          top: '0.5rem',
          right: '0.5rem',
          backgroundColor: '#28a745',
          color: 'white',
          padding: '0.25rem 0.5rem',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: 'bold'
        }}>
          Counted
        </div>
      )}
    </div>
  );
};

export default StockTaking;