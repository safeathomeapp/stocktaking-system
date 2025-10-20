import styled from 'styled-components';

export const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.gradient ?
    `linear-gradient(135deg, ${props.theme.colors.background} 0%, ${props.gradientTo || '#E8F4FD'} 100%)` :
    props.theme.colors.background};
`;

export const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 ${props => props.theme.mobile.containerPadding};

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    padding: 0 ${props => props.theme.tablet.containerPadding};
  }

  @media (min-width: ${props => props.theme.breakpoints.wide}) {
    max-width: 1400px;
  }
`;

export const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.xl};
  padding: ${props => props.theme.spacing.xl};
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.xl};
  box-shadow: 0 4px 6px -1px ${props => props.theme.colors.shadow};
  border: 1px solid ${props => props.theme.colors.border};

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
`;

export const HeaderContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`;

export const PageTitle = styled.h1`
  font-size: ${props => props.theme.fontSize['2xl']};
  font-weight: ${props => props.theme.fontWeight.bold};
  color: ${props => props.theme.colors.text};
  margin: 0;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: ${props => props.theme.fontSize['3xl']};
  }
`;

export const PageSubtitle = styled.p`
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.colors.textSecondary};
  margin: 0;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: ${props => props.theme.fontSize.base};
  }
`;

export const Section = styled.section`
  margin-bottom: ${props => props.theme.spacing.xl};

  &:last-child {
    margin-bottom: 0;
  }
`;

export const SectionTitle = styled.h2`
  font-size: ${props => props.theme.fontSize.xl};
  font-weight: ${props => props.theme.fontWeight.semibold};
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.lg} 0;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: ${props => props.theme.fontSize['2xl']};
  }
`;

export const SectionDescription = styled.p`
  font-size: ${props => props.theme.fontSize.base};
  color: ${props => props.theme.colors.textSecondary};
  margin: 0 0 ${props => props.theme.spacing.lg} 0;
  line-height: 1.6;
`;

export const Grid = styled.div`
  display: grid;
  gap: ${props => props.gap || props.theme.spacing.lg};
  grid-template-columns: ${props => props.columns || 'repeat(auto-fit, minmax(300px, 1fr))'};

  ${props => props.responsive && `
    grid-template-columns: 1fr;

    @media (min-width: ${props.theme.breakpoints.tablet}) {
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    }

    @media (min-width: ${props.theme.breakpoints.desktop}) {
      grid-template-columns: ${props.columns || 'repeat(auto-fit, minmax(300px, 1fr))'};
    }
  `}
`;

export const FlexContainer = styled.div`
  display: flex;
  flex-direction: ${props => props.direction || 'row'};
  align-items: ${props => props.align || 'stretch'};
  justify-content: ${props => props.justify || 'flex-start'};
  gap: ${props => props.gap || props.theme.spacing.md};
  flex-wrap: ${props => props.wrap ? 'wrap' : 'nowrap'};

  ${props => props.responsive && `
    flex-direction: column;

    @media (min-width: ${props.theme.breakpoints.tablet}) {
      flex-direction: ${props.direction || 'row'};
    }
  `}
`;

export const Spacer = styled.div`
  height: ${props => props.size || props.theme.spacing.lg};
  width: 100%;
`;

export const Divider = styled.hr`
  border: none;
  height: 1px;
  background: ${props => props.theme.colors.border};
  margin: ${props => props.margin || props.theme.spacing.lg} 0;
`;

export const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.xxxl};
  text-align: center;
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: 0 2px 4px ${props => props.theme.colors.shadow};
  margin: ${props => props.theme.spacing.xl} 0;
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.xxxl};
  text-align: center;
  color: ${props => props.theme.colors.textSecondary};
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 2px dashed ${props => props.theme.colors.border};
  margin: ${props => props.theme.spacing.xl} 0;
`;

export const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.xl};
  text-align: center;
  background: ${props => props.theme.colors.dangerLight};
  border: 1px solid ${props => props.theme.colors.danger};
  border-radius: ${props => props.theme.borderRadius.lg};
  color: ${props => props.theme.colors.danger};
  margin: ${props => props.theme.spacing.xl} 0;
`;

export const SuccessContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.xl};
  text-align: center;
  background: ${props => props.theme.colors.successLight};
  border: 1px solid ${props => props.theme.colors.success};
  border-radius: ${props => props.theme.borderRadius.lg};
  color: ${props => props.theme.colors.success};
  margin: ${props => props.theme.spacing.xl} 0;
`;