import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { GlobalStyle } from './styles/GlobalStyles';
import { theme } from './styles/theme';

import Dashboard from './components/Dashboard';
import StockTaking from './components/StockTaking';
import SessionHistory from './components/SessionHistory';
import VenueManagement from './components/VenueManagement';
import Settings from './components/Settings';
import InvoiceInput from './components/InvoiceInput';
import EposCsvInput from './components/EposCsvInput';
import AreaSetup from './components/AreaSetup';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/stock-taking/:sessionId" element={<StockTaking />} />
            <Route path="/history" element={<SessionHistory />} />
            <Route path="/venue/new" element={<VenueManagement />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/invoice-input" element={<InvoiceInput />} />
            <Route path="/epos-csv-input/:venueId?" element={<EposCsvInput />} />
            <Route path="/area-setup/:venueId" element={<AreaSetup />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
