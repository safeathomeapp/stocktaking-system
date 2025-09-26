import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { GlobalStyle } from './styles/GlobalStyles';
import { theme } from './styles/theme';

import Dashboard from './components/Dashboard';
import StockTaking from './components/StockTaking';
import SessionHistory from './components/SessionHistory';

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
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
