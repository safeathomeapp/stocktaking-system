import React, { useState } from 'react';
import styled from 'styled-components';

const SummaryContainer = styled.div`width: 100%;`;
const SummaryHeader = styled.div`background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px;`;
const HeaderTitle = styled.h1`margin: 0 0 20px 0; font-size: 28px;`;
const HeaderGrid = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;`;
const HeaderItem = styled.div`display: flex; flex-direction: column; .label { font-size: 12px; } .value { font-size: 18px; }`;
const StatsGrid = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 30px;`;
const StatCard = styled.div`background: white; border: 2px solid #e9ecef; padding: 20px; text-align: center; .stat-number { font-size: 32px; font-weight: 700; color: #667eea; } .stat-label { font-size: 13px; color: #666; }`;
const SectionTitle = styled.h2`font-size: 20px; font-weight: 600; margin: 30px 0 20px 0;`;
const CategorySection = styled.div`margin-bottom: 25px; background: white; border: 1px solid #e9ecef; border-radius: 8px;`;
const CategoryHeader = styled.div`background: #f8f9fa; padding: 15px 20px; cursor: pointer; display: flex; justify-content: space-between;`;
const CategoryItems = styled.div`padding: 0;`;
const ItemRow = styled.div`padding: 15px 20px; border-bottom: 1px solid #e9ecef; display: flex; justify-content: space-between; &:last-child { border-bottom: none; }`;
const IgnoredItemsSection = styled.div`background: #fffbea; border: 1px solid #ffc107; margin-bottom: 30px;`;
const IgnoredItemsHeader = styled.div`background: #fff3cd; border-bottom: 1px solid #ffc107; padding: 15px 20px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none; &:hover { background: #ffe8a8; }`;
const IgnoredItemsContent = styled.div`padding: 20px;`;
const IgnoredItem = styled.div`background: white; padding: 15px; border-left: 4px solid #ffc107; margin-bottom: 10px;`;
const ActionButtons = styled.div`display: flex; gap: 12px; margin-top: 30px; justify-content: center;`;
const Button = styled.button`padding: 12px 32px; font-size: 16px; font-weight: 600; border: none; border-radius: 6px; cursor: pointer;`;
const BackButton = styled(Button)`background: #6c757d; color: white;`;
const SubmitButton = styled(Button)`background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;`;

const Step5_Summary = ({ invoiceMetadata = {}, parsedItems = [], itemCheckboxes = {}, matchedItems = {}, ignoredItems = [], ignoreReasons = {}, detectedSupplier = {}, onSubmit = () => {}, onBack = () => {}, isSubmitting = false }) => {
  const [expandedCategories, setExpandedCategories] = useState({});
  const [isIgnoredExpanded, setIsIgnoredExpanded] = useState(false);
  const importedItems = Object.entries(itemCheckboxes).filter(([_, isChecked]) => isChecked).map(([idx]) => parseInt(idx));
  const totalImported = importedItems.length;
  const totalIgnored = ignoredItems.length;
  const autoMatchedCount = importedItems.filter(idx => matchedItems[idx]?.isAutoMatched).length;
  const groupedByCategory = {};
  parsedItems.forEach((item, idx) => { const category = item.categoryHeader || 'Other'; if (!groupedByCategory[category]) groupedByCategory[category] = []; groupedByCategory[category].push({ ...item, index: idx }); });
  const toggleCategory = (category) => { setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] })); };
  const toggleIgnoredSection = () => { setIsIgnoredExpanded(!isIgnoredExpanded); };
  return (
    <SummaryContainer>
      <SummaryHeader>
        <HeaderTitle>Invoice Summary</HeaderTitle>
        <HeaderGrid>
          <HeaderItem>
            <div className="label">Supplier</div>
            <div className="value">{detectedSupplier?.name || 'Unknown'}</div>
          </HeaderItem>
          <HeaderItem>
            <div className="label">Invoice Number</div>
            <div className="value">{invoiceMetadata?.invoiceNumber || 'N/A'}</div>
          </HeaderItem>
          <HeaderItem>
            <div className="label">Total</div>
            <div className="value">${(invoiceMetadata?.totalAmount || 0).toFixed(2)}</div>
          </HeaderItem>
        </HeaderGrid>
      </SummaryHeader>
      <StatsGrid>
        <StatCard><div className="stat-number">{parsedItems.length}</div><div className="stat-label">Total</div></StatCard>
        <StatCard><div className="stat-number">{totalImported}</div><div className="stat-label">Imported</div></StatCard>
        <StatCard><div className="stat-number">{totalIgnored}</div><div className="stat-label">Ignored</div></StatCard>
      </StatsGrid>
      {totalIgnored > 0 && <IgnoredItemsSection><IgnoredItemsHeader onClick={toggleIgnoredSection}><span>Items Ignored ({totalIgnored})</span><span>{isIgnoredExpanded ? '▼' : '▶'}</span></IgnoredItemsHeader>{isIgnoredExpanded && <IgnoredItemsContent>{ignoredItems.map((item, idx) => <IgnoredItem key={idx}><strong>{item.supplierName}</strong>{ignoreReasons[idx] && <div>Reason: {ignoreReasons[idx]}</div>}</IgnoredItem>)}</IgnoredItemsContent>}</IgnoredItemsSection>}
      <SectionTitle>Items by Category</SectionTitle>
      {Object.entries(groupedByCategory).map(([category, items]) => {
        const importedCategoryItems = items.filter(item => itemCheckboxes[item.index] === true);
        if (!importedCategoryItems.length) return null;
        const isExpanded = expandedCategories[category] !== false;
        return <CategorySection key={category}><CategoryHeader onClick={() => toggleCategory(category)}><div>{category}</div><div>{isExpanded ? '▼' : '▶'}</div></CategoryHeader>{isExpanded && <CategoryItems>{importedCategoryItems.map((item, idx) => <ItemRow key={idx}><div>{item.supplierName}</div><div>{matchedItems[item.index]?.isAutoMatched ? 'Auto' : 'Manual'}</div></ItemRow>)}</CategoryItems>}</CategorySection>;
      })}
      <ActionButtons>
        <BackButton onClick={onBack}>Back</BackButton>
        <SubmitButton onClick={onSubmit}>Confirm</SubmitButton>
      </ActionButtons>
    </SummaryContainer>
  );
};

export default Step5_Summary;
