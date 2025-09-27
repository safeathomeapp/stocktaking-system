import styled, { css } from 'styled-components';

const cardVariants = {
  default: css`
    background: ${props => props.theme.colors.surface};
    border: 1px solid ${props => props.theme.colors.border};
    box-shadow: 0 4px 6px -1px ${props => props.theme.colors.shadow};
  `,
  elevated: css`
    background: ${props => props.theme.colors.surfaceElevated};
    border: 1px solid ${props => props.theme.colors.borderLight};
    box-shadow: 0 8px 15px -3px ${props => props.theme.colors.shadowMedium};
  `,
  interactive: css`
    background: ${props => props.theme.colors.surface};
    border: 1px solid ${props => props.theme.colors.border};
    box-shadow: 0 4px 6px -1px ${props => props.theme.colors.shadow};
    cursor: pointer;
    transition: all ${props => props.theme.animation.normal} ${props => props.theme.animation.easing};

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 15px -3px ${props => props.theme.colors.shadowMedium};
      border-color: ${props => props.theme.colors.primary};
    }

    &:active {
      transform: translateY(0);
    }
  `,
  outlined: css`
    background: transparent;
    border: 2px solid ${props => props.theme.colors.border};
    box-shadow: none;
  `
};

const cardSizes = {
  sm: css`
    padding: ${props => props.theme.spacing.md};
    border-radius: ${props => props.theme.borderRadius.md};
  `,
  md: css`
    padding: ${props => props.theme.spacing.lg};
    border-radius: ${props => props.theme.borderRadius.lg};
  `,
  lg: css`
    padding: ${props => props.theme.spacing.xl};
    border-radius: ${props => props.theme.borderRadius.xl};
  `
};

export const Card = styled.div`
  ${props => cardVariants[props.variant || 'default']}
  ${props => cardSizes[props.size || 'md']}

  ${props => props.fullWidth && `
    width: 100%;
  `}

  ${props => props.center && `
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  `}
`;

export const CardHeader = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};

  &:last-child {
    margin-bottom: 0;
  }
`;

export const CardContent = styled.div`
  ${props => props.noPadding && `
    margin: -${props.theme.spacing.lg};
    margin-top: 0;
    margin-bottom: 0;
  `}
`;

export const CardFooter = styled.div`
  margin-top: ${props => props.theme.spacing.lg};
  padding-top: ${props => props.theme.spacing.lg};
  border-top: 1px solid ${props => props.theme.colors.borderLight};

  ${props => props.noBorder && `
    border-top: none;
    padding-top: 0;
  `}
`;

export const CardTitle = styled.h2`
  font-size: ${props => props.theme.fontSize.xl};
  font-weight: ${props => props.theme.fontWeight.semibold};
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.sm} 0;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: ${props => props.theme.fontSize['2xl']};
  }
`;

export const CardSubtitle = styled.p`
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.colors.textSecondary};
  margin: 0;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: ${props => props.theme.fontSize.base};
  }
`;