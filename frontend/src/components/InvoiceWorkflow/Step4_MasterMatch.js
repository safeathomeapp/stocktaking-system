import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FUZZY_MATCH_CONFIG } from '../../config/matchingConfig';

const Container = styled.div;
const Title = styled.h1;
const Subtitle = styled.p;

const Step4_MasterMatch = ({ unmatchedItems = [], detectedSupplier = {}, onComplete, onBack }) => {
  const [matches, setMatches] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (unmatchedItems.length === 0) {
      setIsLoading(false);
      return;
    }
    setIsLoading(false);
  }, [unmatchedItems]);

  const handleProceed = () => {
    onComplete({});
  };

  if (isLoading) return <Container><Title>Loading...</Title></Container>;

  return (
    <Container>
      <Title>Step 4: Master Product Matching</Title>
      <Subtitle>Coming soon</Subtitle>
      <div style={{ padding: '20px', background: '#f0f0f0', borderRadius: '8px' }}>
        <p>This step will match supplier items to master products.</p>
        <p>Items to match: {unmatchedItems.length}</p>
      </div>
      <div style={{ marginTop: '20px' }}>
        <button onClick={onBack}>Back</button>
        <button onClick={handleProceed} style={{ marginLeft: '10px' }}>Continue</button>
      </div>
    </Container>
  );
};

export default Step4_MasterMatch;