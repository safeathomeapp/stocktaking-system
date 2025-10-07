import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from '../styles/components/Button';
import { Container } from '../styles/GlobalStyles';

const AnalysisContainer = styled(Container)`
  padding-top: ${props => props.theme.spacing.lg};
  padding-bottom: ${props => props.theme.spacing.xl};
  min-height: 100vh;
  background: linear-gradient(135deg, ${props => props.theme.colors.background} 0%, #F0F9FF 100%);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin: 0;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 2.5rem;
  }
`;

const ContentCard = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: 16px;
  padding: ${props => props.theme.spacing.xxl};
  box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.1);
  border: 1px solid ${props => props.theme.colors.border};
  text-align: center;
`;

const ComingSoonText = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const Description = styled.p`
  font-size: 1.125rem;
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: ${props => props.theme.spacing.xl};
  line-height: 1.6;
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: ${props => props.theme.spacing.xl} 0;
  text-align: left;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const FeatureItem = styled.li`
  padding: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.sm};
  background: ${props => props.theme.colors.background};
  border-radius: 8px;
  color: ${props => props.theme.colors.text};
  font-size: 1rem;

  &:before {
    content: '📊 ';
    margin-right: ${props => props.theme.spacing.sm};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  justify-content: center;
  flex-wrap: wrap;
`;

const Analysis = () => {
  const navigate = useNavigate();

  return (
    <AnalysisContainer>
      <Header>
        <Title>📈 Stock Analysis & Reporting</Title>
      </Header>

      <ContentCard>
        <ComingSoonText>Coming Soon!</ComingSoonText>
        <Description>
          This page will provide comprehensive analysis and reporting tools to help you understand
          your stock levels, identify trends, and make data-driven decisions.
        </Description>

        <FeatureList>
          <FeatureItem>EPOS sales vs actual stock comparison</FeatureItem>
          <FeatureItem>Variance analysis and loss detection</FeatureItem>
          <FeatureItem>Stock level trends over time</FeatureItem>
          <FeatureItem>Product movement and velocity analysis</FeatureItem>
          <FeatureItem>Area-by-area breakdown and insights</FeatureItem>
          <FeatureItem>Export reports to PDF and Excel</FeatureItem>
        </FeatureList>

        <Description>
          In the meantime, you can view your session history or start a new stock-take.
        </Description>

        <ButtonGroup>
          <Button onClick={() => navigate('/')} size="lg">
            Back to Dashboard
          </Button>
          <Button onClick={() => navigate('/history')} variant="outline" size="lg">
            View Session History
          </Button>
        </ButtonGroup>
      </ContentCard>
    </AnalysisContainer>
  );
};

export default Analysis;
