import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';

const NavigationBar = styled.nav`
  background: ${props => props.theme.colors.surface};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  padding: ${props => props.theme.spacing.lg};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
`;

const NavigationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    flex-direction: row;
    gap: 0;
  }
`;

const NavigationTitle = styled.h1`
  margin: 0;
  color: ${props => props.theme.colors.text};
  font-size: 1.25rem;
  font-weight: 700;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 1.5rem;
  }
`;

const NavigationLinks = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  flex-wrap: wrap;
  justify-content: center;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    gap: ${props => props.theme.spacing.lg};
    justify-content: flex-end;
  }
`;

const NavigationLink = styled(Link)`
  text-decoration: none;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  background: ${props => props.active ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.active ? 'white' : props.theme.colors.text};
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  min-height: ${props => props.theme.tablet.minTouchTarget};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border: 1px solid ${props => props.active ? props.theme.colors.primary : 'transparent'};

  &:hover {
    background: ${props => props.active ? props.theme.colors.primaryHover : props.theme.colors.background};
    border-color: ${props => props.theme.colors.primary};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 1rem;
    padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.xl};
  }
`;

const Navigation = () => {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <NavigationBar>
      <NavigationContainer>
        <NavigationTitle>Stock Taking System</NavigationTitle>
        <NavigationLinks>
          <NavigationLink
            to="/"
            active={isActive('/')}
          >
            Dashboard
          </NavigationLink>
          <NavigationLink
            to="/venue/new"
            active={isActive('/venue')}
          >
            Add Venue
          </NavigationLink>
          <NavigationLink
            to="/history"
            active={isActive('/history')}
          >
            History
          </NavigationLink>
        </NavigationLinks>
      </NavigationContainer>
    </NavigationBar>
  );
};

export default Navigation;