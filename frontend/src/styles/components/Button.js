import styled, { css } from 'styled-components';

const buttonVariants = {
  primary: css`
    background-color: ${props => props.theme.colors.primary};
    color: white;
    
    &:hover, &:focus {
      background-color: ${props => props.theme.colors.primaryHover};
    }
  `,
  secondary: css`
    background-color: ${props => props.theme.colors.secondary};
    color: white;
    
    &:hover, &:focus {
      background-color: #059669;
    }
  `,
  danger: css`
    background-color: ${props => props.theme.colors.danger};
    color: white;
    
    &:hover, &:focus {
      background-color: #DC2626;
    }
  `,
  outline: css`
    background-color: transparent;
    color: ${props => props.theme.colors.primary};
    border: 2px solid ${props => props.theme.colors.primary};
    
    &:hover, &:focus {
      background-color: ${props => props.theme.colors.primary};
      color: white;
    }
  `
};

const buttonSizes = {
  sm: css`
    padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
    font-size: 14px;
    min-height: 36px;
  `,
  md: css`
    padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
    font-size: 16px;
    min-height: ${props => props.theme.tablet.minTouchTarget};
  `,
  lg: css`
    padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.xl};
    font-size: 18px;
    min-height: 56px;
  `
};

export const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s ease;
  position: relative;
  min-width: ${props => props.theme.tablet.minTouchTarget};
  
  ${props => buttonVariants[props.variant || 'primary']}
  ${props => buttonSizes[props.size || 'md']}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &:active {
    transform: translateY(1px);
  }
  
  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    min-height: ${props => props.theme.tablet.minTouchTarget};
    font-size: ${props => props.size === 'lg' ? '20px' : '18px'};
  }
`;

export const IconButton = styled(Button)`
  width: ${props => props.theme.tablet.minTouchTarget};
  height: ${props => props.theme.tablet.minTouchTarget};
  padding: ${props => props.theme.spacing.sm};
  min-width: auto;
`;
