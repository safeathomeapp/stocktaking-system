import styled, { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    background-color: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text};
    line-height: 1.6;
    -webkit-tap-highlight-color: transparent;
  }

  button {
    cursor: pointer;
    border: none;
    outline: none;
    font-family: inherit;
  }

  input {
    font-family: inherit;
    outline: none;
  }

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    body {
      font-size: ${props => props.theme.tablet.fontSize};
    }
  }
`;

export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 ${props => props.theme.spacing.md};
  
  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    padding: 0 ${props => props.theme.tablet.containerPadding};
  }
`;
