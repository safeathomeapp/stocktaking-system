import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation = () => {
  const location = useLocation();
  
  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav style={{ 
      backgroundColor: 'white', 
      borderBottom: '1px solid #ddd', 
      padding: '1rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ margin: 0, color: '#333' }}>Stock Taking System</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link 
            to="/" 
            style={{ 
              textDecoration: 'none', 
              padding: '0.5rem 1rem', 
              backgroundColor: isActive('/') ? '#007bff' : 'transparent',
              color: isActive('/') ? 'white' : '#333',
              borderRadius: '4px'
            }}
          >
            Dashboard
          </Link>
          <Link 
            to="/venues" 
            style={{ 
              textDecoration: 'none', 
              padding: '0.5rem 1rem', 
              backgroundColor: isActive('/venues') ? '#007bff' : 'transparent',
              color: isActive('/venues') ? 'white' : '#333',
              borderRadius: '4px'
            }}
          >
            Start Stock Take
          </Link>
          <Link 
            to="/history" 
            style={{ 
              textDecoration: 'none', 
              padding: '0.5rem 1rem', 
              backgroundColor: isActive('/history') ? '#007bff' : 'transparent',
              color: isActive('/history') ? 'white' : '#333',
              borderRadius: '4px'
            }}
          >
            History
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;