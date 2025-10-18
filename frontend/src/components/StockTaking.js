import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from '../styles/components/Button';
import { Container } from '../styles/GlobalStyles';
import { apiService } from '../services/apiService';

const StockTakingContainer = styled(Container)`
  padding-top: ${props => props.theme.spacing.md};
  padding-bottom: ${props => props.theme.spacing.xl};
  min-height: 100vh;
  background: linear-gradient(135deg, ${props => props.theme.colors.background} 0%, #F0F4FF 100%);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.sm};
  background: ${props => props.theme.colors.surface};
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid ${props => props.theme.colors.border};
`;

const HeaderContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const Title = styled.h1`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 1.25rem;
  }
`;

const SessionInfo = styled.p`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.textSecondary};
  margin: 0;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 0.875rem;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xxl};
  font-size: 1.125rem;
  color: ${props => props.theme.colors.textSecondary};
  background: ${props => props.theme.colors.surface};
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
`;

const StockSection = styled.section`
  background: ${props => props.theme.colors.surface};
  border-radius: 16px;
  padding: ${props => props.theme.spacing.xl};
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid ${props => props.theme.colors.border};
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.lg} 0;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 1.5rem;
  }
`;

const SearchBar = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    flex-direction: row;
    align-items: center;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  padding: ${props => props.theme.spacing.md};
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: 6px;
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  font-size: 1rem;
  min-height: ${props => props.theme.tablet.minTouchTarget};

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
  }

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 1.125rem;
    padding: ${props => props.theme.spacing.lg};
  }
`;

const StockGrid = styled.div`
  display: grid;
  gap: ${props => props.theme.spacing.md};

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    gap: ${props => props.theme.spacing.lg};
  }
`;

const StockItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.lg};
  background: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

const ItemDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
  flex: 1;
`;

const ItemName = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 1.125rem;
  }
`;

const ItemInfo = styled.span`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.textSecondary};

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 1rem;
  }
`;

const CountSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
  min-width: 200px;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    align-items: center;
  }
`;

const CountLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 1rem;
  }
`;

const CountInput = styled.input`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: 6px;
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  font-size: 1rem;
  text-align: center;
  width: 100px;
  min-height: ${props => props.theme.tablet.minTouchTarget};

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 1.125rem;
    padding: ${props => props.theme.spacing.md};
  }
`;

const ProgressTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.md} 0;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: ${props => props.theme.colors.border};
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, ${props => props.theme.colors.primary} 0%, ${props => props.theme.colors.secondary} 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
  width: ${props => props.progress}%;
`;

const ProgressText = styled.p`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.textSecondary};
  margin: 0;
  text-align: center;
`;

const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.lg};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xxl};
  color: ${props => props.theme.colors.textSecondary};
  background: ${props => props.theme.colors.background};
  border-radius: 12px;
  border: 2px dashed ${props => props.theme.colors.border};
`;

const EmptyStateText = styled.p`
  font-size: 1.125rem;
  margin: 0 0 ${props => props.theme.spacing.md} 0;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// Condensed Area Management Components
const AreaCarousel = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: 6px;
  padding: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.sm};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid ${props => props.theme.colors.border};
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const AreaScrollContainer = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  min-width: min-content;
  align-items: center;
`;

const EditAreasButton = styled.button`
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 6px;
  background: ${props => props.$editMode ? props.theme.colors.primary : props.theme.colors.surface};
  color: ${props => props.$editMode ? 'white' : props.theme.colors.textSecondary};
  cursor: pointer;
  margin-right: ${props => props.theme.spacing.sm};
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
  }
`;

const DraggableAreaTab = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  cursor: ${props => props.$editMode ? 'grab' : 'pointer'};
  opacity: ${props => props.$isDragging ? 0.5 : 1};

  &:active {
    cursor: ${props => props.$editMode ? 'grabbing' : 'pointer'};
  }
`;

const AreaDragHandle = styled.div`
  display: ${props => props.$editMode ? 'flex' : 'none'};
  flex-direction: column;
  gap: 2px;
  padding: ${props => props.theme.spacing.xs};
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
`;

const AreaTab = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: 6px;
  border: 1px solid ${props => props.$active ? props.theme.colors.primary : props.theme.colors.border};
  background: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.surface};
  color: ${props => props.$active ? 'white' : props.theme.colors.text};
  font-weight: 500;
  font-size: 0.875rem;
  min-height: 36px;
  transition: all 0.2s ease;
  white-space: nowrap;
  position: relative;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
  }

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 0.9rem;
  }
`;

const AreaProgress = styled.span`
  font-size: 0.75rem;
  opacity: 0.8;
  margin-left: ${props => props.theme.spacing.xs};
`;

const AddAreaButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.sm};
  border: 2px dashed ${props => props.theme.colors.border};
  border-radius: 6px;
  background: transparent;
  color: ${props => props.theme.colors.textSecondary};
  font-size: 1.25rem;
  min-height: 36px;
  min-width: 36px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.primary};
  }
`;

// Inline Add Product Components
const AddProductItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.surface};
  border: 2px dashed ${props => props.theme.colors.border};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: ${props => props.theme.spacing.sm};

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    background: ${props => props.theme.colors.background};
  }
`;

const AddProductIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${props => props.theme.colors.primary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
`;

const AddProductForm = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 6px;
  margin-top: ${props => props.theme.spacing.sm};
  flex-wrap: wrap;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    flex-wrap: nowrap;
  }
`;

const CompactInput = styled.input`
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 6px;
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  font-size: 0.875rem;
  min-height: 32px;
  flex: 1;
  min-width: 120px;

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    outline: none;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
  }
`;

const CompactSelect = styled.select`
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 6px;
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  font-size: 0.875rem;
  min-height: 32px;
  cursor: pointer;

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    outline: none;
  }
`;

const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const FieldLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
`;

const VoiceButton = styled(Button)`
  position: relative;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};

  ${props => props.listening && `
    background: ${props.theme.colors.danger};
    animation: pulse 1.5s infinite;
  `}

  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
  }
`;

const SuggestionsList = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: ${props => props.theme.colors.surface};
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: 6px;
  border-top: none;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const SuggestionItem = styled.li`
  padding: ${props => props.theme.spacing.md};
  cursor: pointer;
  border-bottom: 1px solid ${props => props.theme.colors.border};

  &:hover {
    background: ${props => props.theme.colors.background};
  }

  &:last-child {
    border-bottom: none;
  }
`;

// Compact Draggable Product List
const DraggableProductList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const DraggableItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 6px;
  cursor: ${props => props.$editMode ? (props.$isDragging ? 'grabbing' : 'grab') : 'default'};
  transition: all 0.2s ease;
  opacity: ${props => props.$isDragging ? 0.5 : 1};
  min-height: 64px;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const DragHandle = styled.div`
  display: ${props => props.$editMode ? 'flex' : 'none'};
  flex-direction: column;
  gap: 2px;
  cursor: grab;
  padding: ${props => props.theme.spacing.xs};
  border-radius: 4px;

  &:hover {
    background: ${props => props.theme.colors.border};
  }

  &:active {
    cursor: grabbing;
  }
`;

const RemoveButton = styled.button`
  display: ${props => props.$editMode ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid ${props => props.theme.colors.danger};
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.danger};
  cursor: pointer;
  font-size: 1.25rem;
  transition: all 0.2s ease;
  padding: 0;

  &:hover {
    background: ${props => props.theme.colors.danger};
    color: white;
  }

  &:active {
    transform: scale(0.95);
  }
`;

const DragDot = styled.div`
  width: 3px;
  height: 3px;
  background: ${props => props.theme.colors.textSecondary};
  border-radius: 50%;
`;

const ProductCountGrid = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  flex: 1;
  justify-content: space-between;
`;

const ProductDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
  flex: 1;
  min-width: 0;
`;

const ProductName = styled.h4`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ProductInfo = styled.span`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.textSecondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CompactCountSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  min-width: 120px;
`;

const DecimalInput = styled.input`
  width: 100px;
  padding: ${props => props.theme.spacing.md};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 6px;
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  font-size: 1.25rem;
  text-align: center;
  height: 56px;

  /* Remove up/down arrows */
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  &[type=number] {
    -moz-appearance: textfield;
  }

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    outline: none;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
`;

const UnitLabel = styled.span`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.textSecondary};
  white-space: nowrap;
`;

const SearchIcon = styled.button`
  padding: ${props => props.theme.spacing.xs};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 6px;
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  min-width: 28px;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.primary};
  }

  &:active {
    transform: scale(0.95);
  }
`;

const PhotoModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${props => props.theme.spacing.lg};

  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    padding: ${props => props.theme.spacing.md};
  }
`;

const PhotoContainer = styled.div`
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);

  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    max-width: 95vw;
    max-height: 95vh;
  }
`;

const PhotoImage = styled.img`
  width: 100%;
  height: auto;
  max-height: 80vh;
  object-fit: contain;
  display: block;
`;

const PhotoHeader = styled.div`
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.surface};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PhotoTitle = styled.h3`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: ${props => props.theme.colors.textSecondary};
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text};
  }
`;

const NoPhotoPlaceholder = styled.div`
  padding: ${props => props.theme.spacing.xxl};
  text-align: center;
  color: ${props => props.theme.colors.textSecondary};
  font-size: 1.125rem;
  background: ${props => props.theme.colors.background};
`;

const SearchSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.sm};
  position: relative;
`;

const CollapsibleSearch = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  z-index: 10;
  transform: ${props => props.show ? 'translateX(0)' : 'translateX(100%)'};
  opacity: ${props => props.show ? 1 : 0};
  transition: all 0.3s ease;
  pointer-events: ${props => props.show ? 'auto' : 'none'};
`;

const EmptyAreasMessage = styled.div`
  padding: ${props => props.theme.spacing.lg};
  text-align: center;
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.875rem;
  line-height: 1.4;
`;

const ErrorMessage = styled.div`
  background: ${props => props.theme.colors.danger};
  color: white;
  padding: ${props => props.theme.spacing.md};
  border-radius: 8px;
  margin-bottom: ${props => props.theme.spacing.md};
  font-weight: 500;
`;

const DisabledOverlay = styled.div`
  position: relative;
  opacity: ${props => props.disabled ? 0.5 : 1};
  pointer-events: ${props => props.disabled ? 'none' : 'auto'};

  ${props => props.disabled && `
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.7);
      z-index: 1;
    }
  `}
`;

const StockTaking = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockItems, setStockItems] = useState([]);
  const [stockCounts, setStockCounts] = useState({});
  const [stockCases, setStockCases] = useState({}); // Cases count per product
  const [stockUnits, setStockUnits] = useState({}); // Units count per product
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'

  // Session and venue data
  const [sessionData, setSessionData] = useState(null);
  const [venueData, setVenueData] = useState(null);

  // Areas functionality
  const [currentArea, setCurrentArea] = useState(null);
  const [areas, setAreas] = useState([]);
  const [editAreasMode, setEditAreasMode] = useState(false);
  const [draggedArea, setDraggedArea] = useState(null);
  const [showAddArea, setShowAddArea] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');

  // Search functionality
  const [showSearch, setShowSearch] = useState(false);

  // Product editing mode
  const [editProductsMode, setEditProductsMode] = useState(false);

  // Add new product functionality
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductBrand, setNewProductBrand] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('');
  const [newProductSubcategory, setNewProductSubcategory] = useState('');
  const [masterProducts, setMasterProducts] = useState([]);
  const [newProductUnit, setNewProductUnit] = useState('bottle');
  const [newProductUnitSize, setNewProductUnitSize] = useState('');
  const [newProductCaseSize, setNewProductCaseSize] = useState('');
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMasterProduct, setSelectedMasterProduct] = useState(null);


  // Area photo display
  const [showAreaPhoto, setShowAreaPhoto] = useState(false);

  // Drag and drop
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);

  // Get current area data including photo
  const getCurrentAreaData = () => {
    return updatedAreas.find(area => area.id === currentArea);
  };

  // Product suggestion database for fuzzy search - use full master_products
  const productDatabase = masterProducts;

  useEffect(() => {
    // Load session and venue data
    loadSessionData();
    loadMasterProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const loadMasterProducts = async () => {
    try {
      const response = await apiService.getMasterProducts();
      if (response.success && response.data.products) {
        setMasterProducts(response.data.products);
      }
    } catch (error) {
      console.error('Error loading master products:', error);
    }
  };

  const loadSessionData = async () => {
    // Ensure sessionId is a string and not an object
    const cleanSessionId = String(sessionId);

    try {
      setLoading(true);
      console.log('Loading session data for sessionId:', sessionId, typeof sessionId);

      // Get session details
      const sessionResponse = await apiService.getSessionById(cleanSessionId);
      console.log('Session response:', sessionResponse);
      if (!sessionResponse.success) throw new Error('Failed to load session');
      setSessionData(sessionResponse.data);

      // Declare productsResponse outside the conditional block so it's accessible later
      let productsResponse = null;

      // Get venue details
      if (sessionResponse.data.venue_id) {
        const venueResponse = await apiService.getVenues();
        if (venueResponse.success) {
          const venue = venueResponse.data.find(v => v.id === sessionResponse.data.venue_id);
          setVenueData(venue);
        }

        // Get venue products
        productsResponse = await apiService.getVenueProducts(sessionResponse.data.venue_id);

        // Get venue areas
        const areasResponse = await apiService.getVenueAreas(sessionResponse.data.venue_id);

        if (productsResponse.success && areasResponse.success) {
          // Process products with their actual areas
          processProductsAndAreas(productsResponse.data, areasResponse.data.areas);
        } else if (productsResponse.success) {
          // Fallback: process products without specific areas
          processProductsAndAreas(productsResponse.data, []);
        }
      }

      // Get existing stock entries for this session
      const entriesResponse = await apiService.getSessionEntries(cleanSessionId);

      if (entriesResponse.success) {
        const counts = {};
        const cases = {};
        const units = {};
        const areaAssignments = {}; // Track which area each product was counted in
        // Fix: The API returns {entries: [...]} not a direct array
        const entries = entriesResponse.data.entries || [];

        entries.forEach(entry => {
          const totalQuantity = parseFloat(entry.quantity_units) || 0;
          counts[entry.product_id] = totalQuantity.toString();

          // Track which area this product was counted in
          if (entry.venue_area_id) {
            areaAssignments[entry.product_id] = entry.venue_area_id;
          }

          // Split total back into cases and units
          // Find the product to get case_size
          const product = productsResponse?.data?.find(p => p.id === entry.product_id);
          const caseSize = product?.case_size || 24;

          const caseCount = Math.floor(totalQuantity / caseSize);
          const unitCount = totalQuantity % caseSize;

          cases[entry.product_id] = caseCount > 0 ? caseCount.toString() : '';
          units[entry.product_id] = unitCount > 0 ? unitCount.toString() : '';
        });

        setStockCounts(counts);
        setStockCases(cases);
        setStockUnits(units);

        // Update products with their saved area assignments
        if (productsResponse && productsResponse.data && Object.keys(areaAssignments).length > 0) {
          const updatedProducts = productsResponse.data.map(product => {
            if (areaAssignments[product.id]) {
              return {
                ...product,
                area_id: areaAssignments[product.id]
              };
            }
            return product;
          });

          // Re-process products and areas with updated assignments
          const areasResponse = await apiService.getVenueAreas(sessionResponse.data.venue_id);
          if (areasResponse.success) {
            processProductsAndAreas(updatedProducts, areasResponse.data.areas);
          }
        }
      }

    } catch (error) {
      console.error('Error loading session data:', error);
      setError('Failed to load session data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const processProductsAndAreas = (products, venueAreas = []) => {
    let areasArray = [];
    let processedProducts = [];

    if (venueAreas.length > 0) {
      // Use actual venue areas
      const areaGroups = {};

      // Initialize all venue areas
      venueAreas.forEach(area => {
        areaGroups[area.id] = {
          ...area,
          products: []
        };
      });

      // Group products by their assigned areas
      products.forEach((product) => {
        const areaId = product.area_id;
        if (areaId && areaGroups[areaId]) {
          areaGroups[areaId].products.push({
            ...product,
            area: areaId,
            expectedCount: 0
          });
        } else {
          // Products without area assignment go to first area or create "Unassigned" area
          const firstAreaId = venueAreas[0]?.id;
          if (firstAreaId && areaGroups[firstAreaId]) {
            areaGroups[firstAreaId].products.push({
              ...product,
              area: firstAreaId,
              expectedCount: 0
            });
          }
        }
      });

      // Create areas array with product counts
      areasArray = Object.values(areaGroups).map(area => ({
        id: area.id,
        name: area.name,
        photo: area.photo, // Include photo from database
        completedItems: 0,
        totalItems: area.products.length
      }));

      // Flatten all products
      processedProducts = Object.values(areaGroups).flatMap(area => area.products);
    } else {
      // Fallback: Group by category when no areas are defined
      const areaGroups = {};

      products.forEach((product) => {
        const areaName = product.category || 'General';
        if (!areaGroups[areaName]) {
          areaGroups[areaName] = [];
        }
        areaGroups[areaName].push({
          ...product,
          area: areaName.toLowerCase().replace(/\s+/g, '-'),
          expectedCount: 0
        });
      });

      areasArray = Object.entries(areaGroups).map(([name, products]) => ({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name: name,
        completedItems: 0,
        totalItems: products.length
      }));

      processedProducts = Object.values(areaGroups).flat();
    }

    setAreas(areasArray);
    setCurrentArea(areasArray[0]?.id || null);
    setStockItems(processedProducts);
  };

  const handleBack = () => {
    navigate('/');
  };

  // Smart unit conversion for display
  const formatUnitSize = (unitSizeMl) => {
    if (!unitSizeMl || isNaN(unitSizeMl)) return '';

    const ml = parseInt(unitSizeMl);

    if (ml <= 1000) {
      return `${ml}ml`;
    } else if (ml < 10000) {
      // Convert to cl (centiliters)
      const cl = ml / 10;
      return `${cl}cl`;
    } else {
      // Convert to L (liters)
      const l = ml / 1000;
      return `${l}L`;
    }
  };

  // Area management
  const handleAreaChange = (areaId) => {
    if (!editAreasMode) {
      setCurrentArea(areaId);
    }
  };

  const getCurrentAreaItems = () => {
    return filteredItems.filter(item => item.area === currentArea);
  };

  // Area drag and drop
  const handleAreaDragStart = (e, areaId) => {
    if (editAreasMode) {
      setDraggedArea(areaId);
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleAreaDragOver = (e) => {
    if (editAreasMode) {
      e.preventDefault();
    }
  };

  const handleAreaDrop = async (e, dropAreaId) => {
    e.preventDefault();

    if (editAreasMode && draggedArea && dropAreaId && draggedArea !== dropAreaId) {
      const draggedIndex = areas.findIndex(area => area.id === draggedArea);
      const dropIndex = areas.findIndex(area => area.id === dropAreaId);

      if (draggedIndex !== -1 && dropIndex !== -1) {
        const newAreas = [...areas];
        const [draggedAreaData] = newAreas.splice(draggedIndex, 1);
        newAreas.splice(dropIndex, 0, draggedAreaData);

        // Update local state immediately for responsive UI
        setAreas(newAreas);

        // Save new display order to database
        try {
          const updatePromises = newAreas.map((area, index) => {
            if (typeof area.id === 'number') { // Only update database areas, not temporary ones
              return apiService.updateArea(area.id, {
                name: area.name,
                display_order: index,
                description: area.description || ''
              });
            }
            return Promise.resolve({ success: true });
          });

          const results = await Promise.all(updatePromises);
          const failedUpdates = results.filter(r => !r.success);

          if (failedUpdates.length > 0) {
            console.error('Some area order updates failed:', failedUpdates);
            setError('Failed to save area order. Changes will be lost on refresh.');
          } else {
            console.log('Area order saved successfully');
          }
        } catch (error) {
          console.error('Error updating area order:', error);
          setError('Failed to save area order. Changes will be lost on refresh.');
        }
      }
    }

    setDraggedArea(null);
  };

  const handleAreaDragEnd = () => {
    setDraggedArea(null);
  };

  // Add new area - immediately save to database
  const handleAddArea = async () => {
    if (newAreaName.trim() && venueData?.id) {
      try {
        // Save area to database immediately
        const areaData = {
          name: newAreaName.trim(),
          display_order: areas.length,
          description: ''
        };

        const response = await apiService.addVenueArea(venueData.id, areaData);

        if (response.success) {
          // Add the database area to local state
          const newArea = {
            id: response.data.area.id,
            name: response.data.area.name,
            display_order: response.data.area.display_order,
            completedItems: 0,
            totalItems: 0
          };

          setAreas(prev => [...prev, newArea]);
          setCurrentArea(newArea.id);
          setNewAreaName('');
          setShowAddArea(false);
          console.log('Area saved to database:', response.data.area);
        } else {
          console.error('Failed to save area:', response.error);
          setError('Failed to save area. Please try again.');
        }
      } catch (error) {
        console.error('Error saving area:', error);
        setError('Failed to save area. Please try again.');
      }
    }
  };

  // Fuzzy search for product suggestions
  const fuzzySearch = (query, items) => {
    if (!query) return [];

    const queryLower = query.toLowerCase();
    return items.filter(product => {
      // Search in product name and brand
      const searchText = `${product.name} ${product.brand || ''}`.toLowerCase();
      // Simple fuzzy logic: check if all characters in query exist in order
      let queryIndex = 0;
      for (let i = 0; i < searchText.length && queryIndex < queryLower.length; i++) {
        if (searchText[i] === queryLower[queryIndex]) {
          queryIndex++;
        }
      }
      return queryIndex === queryLower.length;
    }).slice(0, 10);
  };

  // Handle product name input change with fuzzy search
  const handleProductNameChange = (value) => {
    setNewProductName(value);

    if (value.length > 1) {
      const suggestions = fuzzySearch(value, productDatabase);
      setProductSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (masterProduct) => {
    setSelectedMasterProduct(masterProduct);
    setNewProductName(masterProduct.name);
    setNewProductBrand(masterProduct.brand || '');
    setNewProductCategory(masterProduct.category || '');
    setNewProductSubcategory(masterProduct.subcategory || '');
    setNewProductUnit(masterProduct.unit_type || 'bottle');
    setNewProductUnitSize(masterProduct.unit_size ? String(masterProduct.unit_size) : '');
    setNewProductCaseSize(masterProduct.case_size ? String(masterProduct.case_size) : '');
    setShowSuggestions(false);
  };


  // Handle area photo display
  const handlePhotoButtonClick = () => {
    setShowAreaPhoto(true);
  };

  const closePhotoModal = () => {
    setShowAreaPhoto(false);
  };


  // Add new product
  // Generate UUID for new products
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleAddProduct = async () => {
    if (newProductName && venueData?.id && currentArea) {
      try {
        // Find the current area object to get its database ID
        const currentAreaObj = areas.find(area => area.id === currentArea);

        if (!currentAreaObj) {
          setError('Please select a valid area before adding products.');
          return;
        }

        // Determine master_product_id
        let masterProductId = null;

        // If product was selected from suggestions, use its ID
        if (selectedMasterProduct) {
          masterProductId = selectedMasterProduct.id;
        } else {
          // Check if a similar product exists in master_products
          const similarProduct = masterProducts.find(mp =>
            mp.name.toLowerCase() === newProductName.toLowerCase() &&
            (mp.brand || '').toLowerCase() === (newProductBrand || '').toLowerCase() &&
            mp.unit_size === (newProductUnitSize ? parseInt(newProductUnitSize) : null)
          );

          if (similarProduct) {
            // Use existing master product
            masterProductId = similarProduct.id;
          } else {
            // Ask user if they want to add to master_products
            const shouldAddToMaster = window.confirm(
              `This product is not in the master products database. Would you like to add it?\n\n` +
              `Name: ${newProductName}\n` +
              `Brand: ${newProductBrand || 'N/A'}\n` +
              `Category: ${newProductCategory}\n` +
              `Subcategory: ${newProductSubcategory || 'N/A'}\n` +
              `Unit Size: ${newProductUnitSize || 'N/A'} ml\n` +
              `Case Size: ${newProductCaseSize || 'N/A'}`
            );

            if (shouldAddToMaster) {
              try {
                const masterProductData = {
                  name: newProductName,
                  brand: newProductBrand,
                  category: newProductCategory,
                  subcategory: newProductSubcategory,
                  unit_type: newProductUnit,
                  unit_size: newProductUnitSize ? parseInt(newProductUnitSize) : null,
                  case_size: newProductCaseSize ? parseInt(newProductCaseSize) : null,
                  active: true
                };

                const masterResponse = await apiService.createMasterProduct(masterProductData);
                if (masterResponse.success) {
                  console.log('Added to master_products:', masterResponse.data);
                  // Get the new master product ID
                  masterProductId = masterResponse.data.product?.id || masterResponse.data.id;
                  // Reload master products
                  await loadMasterProducts();
                }
              } catch (err) {
                console.error('Failed to add to master products:', err);
                // Continue anyway - still add to venue products without master_product_id
              }
            }
          }
        }

        // Prepare product data for database
        const productData = {
          name: newProductName,
          brand: newProductBrand,
          category: newProductCategory,
          subcategory: newProductSubcategory,
          unit_type: newProductUnit,
          unit_size: newProductUnitSize ? parseInt(newProductUnitSize) : null,
          case_size: newProductCaseSize ? parseInt(newProductCaseSize) : null,
          area_id: typeof currentAreaObj.id === 'number' ? currentAreaObj.id : null,
          barcode: '',
          master_product_id: masterProductId
        };

        // Save product to venue products
        const response = await apiService.createVenueProduct(venueData.id, productData);

        if (response.success) {
          // Add the database product to local state
          const newProduct = {
            id: response.data.product.id,
            name: response.data.product.name,
            brand: response.data.product.brand,
            category: response.data.product.category,
            subcategory: response.data.product.subcategory,
            unit_type: response.data.product.unit_type,
            unit_size: response.data.product.unit_size,
            case_size: response.data.product.case_size,
            area_id: response.data.product.area_id,
            area: currentArea, // Keep area reference for UI
            expectedCount: 0,
            barcode: response.data.product.barcode
          };

          setStockItems(prev => [...prev, newProduct]);

          // Reset form
          setNewProductName('');
          setNewProductBrand('');
          setNewProductCategory('');
          setNewProductSubcategory('');
          setNewProductUnit('bottle');
          setNewProductUnitSize('');
          setNewProductCaseSize('');
          setSelectedMasterProduct(null);
          setShowAddProduct(false);
          setShowSuggestions(false);
          console.log('Product saved to database:', response.data.product);
        } else {
          console.error('Failed to save product:', response.error);
          setError('Failed to save product. Please try again.');
        }
      } catch (error) {
        console.error('Error saving product:', error);
        setError('Failed to save product. Please try again.');
      }
    } else {
      if (!currentArea) {
        setError('Please select an area before adding products.');
      } else if (!newProductName) {
        setError('Please fill in product name.');
      }
    }
  };

  // Remove product from counting session
  const handleRemoveProduct = async (productId) => {
    if (window.confirm('Remove this product from the current counting session?\n\nThis will not delete it from your venue products.')) {
      try {
        // Delete stock entry from database
        await apiService.deleteStockEntry(sessionId, productId);

        // Update local state
        setStockItems(prev => prev.filter(item => item.id !== productId));
        setStockCounts(prev => {
          const newCounts = { ...prev };
          delete newCounts[productId];
          return newCounts;
        });
        setStockCases(prev => {
          const newCases = { ...prev };
          delete newCases[productId];
          return newCases;
        });
        setStockUnits(prev => {
          const newUnits = { ...prev };
          delete newUnits[productId];
          return newUnits;
        });
      } catch (error) {
        console.error('Error deleting stock entry:', error);
        setError('Failed to remove product from session');
      }
    }
  };

  // Product drag and drop handlers
  const handleDragStart = (e, itemId) => {
    if (editProductsMode) {
      setDraggedItem(itemId);
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragOver = (e, itemId) => {
    if (editProductsMode) {
      e.preventDefault();
      setDragOverItem(itemId);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDrop = (e, dropItemId) => {
    e.preventDefault();

    if (editProductsMode && draggedItem && dropItemId && draggedItem !== dropItemId) {
      const currentAreaItems = getCurrentAreaItems();
      const draggedIndex = currentAreaItems.findIndex(item => item.id === draggedItem);
      const dropIndex = currentAreaItems.findIndex(item => item.id === dropItemId);

      if (draggedIndex !== -1 && dropIndex !== -1) {
        const newItems = [...stockItems];
        const allItemsCurrentArea = newItems.filter(item => item.area === currentArea);
        const otherAreaItems = newItems.filter(item => item.area !== currentArea);

        // Reorder items in current area
        const [draggedItemData] = allItemsCurrentArea.splice(draggedIndex, 1);
        allItemsCurrentArea.splice(dropIndex, 0, draggedItemData);

        // Combine with other area items
        setStockItems([...otherAreaItems, ...allItemsCurrentArea]);
      }
    }

    handleDragEnd();
  };

  const handleCountChange = (itemId, count) => {
    // Allow decimal values
    const numericValue = parseFloat(count);
    if (!isNaN(numericValue) || count === '') {
      setStockCounts(prev => ({
        ...prev,
        [itemId]: count
      }));
    }
  };

  const handleCasesChange = (itemId, cases) => {
    const numericValue = parseInt(cases);
    if (!isNaN(numericValue) || cases === '') {
      setStockCases(prev => ({
        ...prev,
        [itemId]: cases
      }));

      // Calculate total: cases * case_size + units
      const caseCount = parseInt(cases) || 0;
      const unitCount = parseInt(stockUnits[itemId]) || 0;
      const product = stockItems.find(p => p.id === itemId);
      const caseSize = product?.case_size || 24; // Default to 24 if not specified

      const total = (caseCount * caseSize) + unitCount;
      setStockCounts(prev => ({
        ...prev,
        [itemId]: total.toString()
      }));
    }
  };

  const handleUnitsChange = (itemId, units) => {
    // Allow floats with up to 2 decimal places
    const numericValue = parseFloat(units);
    if (!isNaN(numericValue) || units === '') {
      // Validate decimal places (max 2)
      const parts = units.split('.');
      if (parts.length > 1 && parts[1].length > 2) {
        // Round to 2 decimal places
        const rounded = parseFloat(units).toFixed(2);
        setStockUnits(prev => ({
          ...prev,
          [itemId]: rounded
        }));

        // Calculate total with rounded value
        const caseCount = parseInt(stockCases[itemId]) || 0;
        const unitCount = parseFloat(rounded) || 0;
        const product = stockItems.find(p => p.id === itemId);
        const caseSize = product?.case_size || 24;
        const total = (caseCount * caseSize) + unitCount;

        setStockCounts(prev => ({
          ...prev,
          [itemId]: total.toFixed(2)
        }));
      } else {
        setStockUnits(prev => ({
          ...prev,
          [itemId]: units
        }));

        // Calculate total: cases * case_size + units
        const caseCount = parseInt(stockCases[itemId]) || 0;
        const unitCount = parseFloat(units) || 0;
        const product = stockItems.find(p => p.id === itemId);
        const caseSize = product?.case_size || 24; // Default to 24 if not specified

        const total = (caseCount * caseSize) + unitCount;
        setStockCounts(prev => ({
          ...prev,
          [itemId]: total.toFixed(2)
        }));
      }
    }
  };

  const handleDecimalCount = (itemId, expectedCount, fraction) => {
    const value = (expectedCount * fraction).toFixed(2);
    setStockCounts(prev => ({
      ...prev,
      [itemId]: value
    }));
  };

  const handleSaveProgress = async () => {
    setSaving(true);
    setSaveStatus('saving');
    setError(null);

    try {
      const sessionId = String(sessionData?.id);
      const savePromises = [];

      // Save or update each stock count
      for (const [productId, quantity] of Object.entries(stockCounts)) {
        if (quantity !== '' && !isNaN(parseFloat(quantity))) {
          // Find the product to get expected count
          const allProducts = stockItems;
          const product = allProducts.find(p => p.id === productId);
          const expectedCount = product?.expectedCount || 1;

          // Simple data capture - store actual quantity as input
          const actualQuantity = parseFloat(quantity);

          // Get current area's database ID
          const currentAreaObj = areas.find(area => area.id === currentArea);
          const venueAreaId = currentAreaObj && typeof currentAreaObj.id === 'number' ? currentAreaObj.id : null;

          const entryData = {
            product_id: productId,
            quantity_units: actualQuantity,
            venue_area_id: venueAreaId
          };

          // Try to add entry (will fail if exists, then we'll update)
          const addResponse = await apiService.addStockEntry(sessionId, entryData);
          if (!addResponse.success) {
            console.log('Add failed, trying to update existing entry:', addResponse.error);
            // If add failed, try to find and update existing entry
            const entriesResponse = await apiService.getSessionEntries(sessionId);
            if (entriesResponse.success) {
              // Handle different response formats
              const entries = Array.isArray(entriesResponse.data)
                ? entriesResponse.data
                : entriesResponse.data.entries || [];

              console.log('Fetched entries for update:', entries);
              const existingEntry = entries.find(entry => entry.product_id === productId);
              if (existingEntry) {
                console.log('Updating existing entry:', existingEntry.id);
                const updateResponse = await apiService.updateStockEntry(existingEntry.id, {
                  quantity_units: actualQuantity,
                  venue_area_id: venueAreaId
                });
                if (!updateResponse.success) {
                  console.error('Failed to update entry:', updateResponse.error);
                }
              } else {
                console.log('No existing entry found for product_id:', productId);
              }
            } else {
              console.error('Failed to fetch entries:', entriesResponse.error);
            }
          }
        }
      }

      console.log('Stock progress saved successfully');
      setSaveStatus('saved');

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Error saving progress:', error);
      setError('Failed to save progress. Please try again.');
      setSaveStatus('error');

      // Reset to idle after 3 seconds on error
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteSession = async () => {
    setSaving(true);
    setError(null);

    try {
      const sessionId = String(sessionData?.id);
      console.log('Completing session:', sessionId);
      console.log('Stock counts to save:', stockCounts);

      // First save all current progress
      let savedCount = 0;
      let totalCount = Object.entries(stockCounts).filter(([, quantity]) => quantity !== '' && !isNaN(parseFloat(quantity))).length;

      for (const [productId, quantity] of Object.entries(stockCounts)) {
        if (quantity !== '' && !isNaN(parseFloat(quantity))) {
          console.log(`Saving product ${productId} with quantity ${quantity}`);

          // Simple data capture - store actual quantity as input
          const actualQuantity = parseFloat(quantity);

          // Get current area's database ID
          const currentAreaObj = areas.find(area => area.id === currentArea);
          const venueAreaId = currentAreaObj && typeof currentAreaObj.id === 'number' ? currentAreaObj.id : null;

          const entryData = {
            product_id: productId,
            quantity_units: actualQuantity,
            venue_area_id: venueAreaId
          };

          try {
            const addResponse = await apiService.addStockEntry(sessionId, entryData);
            if (addResponse.success) {
              savedCount++;
              console.log(`Successfully saved product ${productId}`);
            } else {
              console.log(`Failed to add entry for product ${productId}, trying to update existing entry`);
              const entriesResponse = await apiService.getSessionEntries(sessionId);
              console.log('Entries response:', entriesResponse);

              if (entriesResponse.success && entriesResponse.data) {
                // Handle different data structures
                let entries = entriesResponse.data;
                if (!Array.isArray(entries)) {
                  // If data is wrapped in another object, try to extract the array
                  entries = entries.entries || entries.data || [];
                }

                console.log('Entries array:', entries);

                if (Array.isArray(entries)) {
                  const existingEntry = entries.find(entry => entry.product_id === productId);
                  if (existingEntry) {
                    const updateResult = await apiService.updateStockEntry(existingEntry.id, {
                      quantity_units: actualQuantity,
                      venue_area_id: venueAreaId
                    });
                    if (updateResult.success) {
                      savedCount++;
                      console.log(`Successfully updated product ${productId}`);
                    } else {
                      console.error(`Failed to update entry for product ${productId}:`, updateResult.error);
                    }
                  } else {
                    console.log(`No existing entry found for product ${productId}, entry may need to be created differently`);
                  }
                } else {
                  console.error(`Entries data is not an array:`, entries);
                }
              } else {
                console.error(`Failed to get existing entries for product ${productId}:`, entriesResponse.error || 'Invalid response structure');
              }
            }
          } catch (error) {
            console.error(`Error processing product ${productId}:`, error);
          }
        }
      }

      console.log(`Saved ${savedCount} out of ${totalCount} entries`);

      // Then mark session as completed
      console.log('Marking session as completed');
      const notes = totalCount > 0
        ? `Session completed with ${savedCount}/${totalCount} items saved (${Object.keys(stockCounts).length} items counted)`
        : `Session completed with ${Object.keys(stockCounts).length} items counted`;

      const updateResponse = await apiService.updateSession(sessionId, {
        status: 'completed',
        notes: notes
      });

      if (updateResponse.success) {
        console.log('Session completed successfully');
        if (savedCount < totalCount) {
          setError(`Session completed but only ${savedCount}/${totalCount} stock entries were saved successfully.`);
          // Still navigate after a delay to show the message
          setTimeout(() => navigate('/analysis'), 3000);
        } else {
          navigate('/analysis');
        }
      } else {
        console.error('Failed to update session status:', updateResponse.error);
        setError('Failed to complete session: ' + updateResponse.error);
      }
    } catch (error) {
      console.error('Error completing session:', error);
      setError('Failed to complete session: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = stockItems.filter(item => {
    const productName = item.venue_name || item.name || '';
    const productCategory = item.category || '';
    return productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           productCategory.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const currentAreaItems = getCurrentAreaItems();
  const completedItems = Object.keys(stockCounts).length;
  const totalItems = stockItems.length;
  const currentAreaCompletedItems = currentAreaItems.filter(item => stockCounts[item.id]).length;
  const currentAreaTotalItems = currentAreaItems.length;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  const currentAreaProgress = currentAreaTotalItems > 0 ? (currentAreaCompletedItems / currentAreaTotalItems) * 100 : 0;

  // Update area progress counts in real-time
  const updatedAreas = areas.map(area => {
    const areaItems = stockItems.filter(item => item.area === area.id);
    const areaCompletedItems = areaItems.filter(item => stockCounts[item.id]).length;
    return {
      ...area,
      completedItems: areaCompletedItems,
      totalItems: areaItems.length
    };
  });


  if (loading) {
    return (
      <StockTakingContainer>
        <LoadingMessage>
          <LoadingSpinner style={{ marginRight: '12px' }} />
          Loading stock taking session...
        </LoadingMessage>
      </StockTakingContainer>
    );
  }

  if (error) {
    return (
      <StockTakingContainer>
        <ErrorMessage>{error}</ErrorMessage>
        <Button variant="outline" onClick={() => navigate('/')} size="lg">
          Back to Dashboard
        </Button>
      </StockTakingContainer>
    );
  }

  return (
    <StockTakingContainer>
      <Header>
        <HeaderContent>
          <Title>{venueData?.name || 'Stock Taking Session'}</Title>
          <SessionInfo>
            Session: {sessionId ? String(sessionId).slice(-8) : 'Loading...'} • {sessionData?.stocktaker_name || 'Loading...'} • {sessionData?.session_date ? new Date(sessionData.session_date).toLocaleDateString() : new Date().toLocaleDateString()} • Overall: {completedItems}/{totalItems} • Areas: {updatedAreas.filter(a => a.completedItems >= a.totalItems).length}/{updatedAreas.length}
          </SessionInfo>
        </HeaderContent>
        <Button variant="outline" onClick={handleBack} size="sm">
          Back
        </Button>
      </Header>

      {/* Condensed Area Navigation */}
      <AreaCarousel>
        <AreaScrollContainer>
          <EditAreasButton
            $editMode={editAreasMode}
            onClick={() => {
              const wasInEditMode = editAreasMode;
              setEditAreasMode(!editAreasMode);

              if (!editAreasMode && updatedAreas.length === 0) {
                // Skip + button, go straight to input when no areas exist
                setShowAddArea(true);
              } else if (wasInEditMode && updatedAreas.length > 0) {
                // Auto-select first area when exiting edit mode
                setCurrentArea(updatedAreas[0].id);
              }
            }}
            title={editAreasMode ? "Exit edit mode" : (updatedAreas.length === 0 ? "Create areas" : "Edit areas")}
          >
            ⚙️
          </EditAreasButton>

          {!editAreasMode && updatedAreas.length === 0 && (
            <span style={{
              fontSize: '0.75rem',
              color: '#6B7280',
              marginLeft: '8px',
              display: 'inline-flex',
              alignItems: 'center'
            }}>
              No areas created yet. Click the cog to create areas for organizing your inventory.
            </span>
          )}

          {editAreasMode && updatedAreas.length === 0 && !showAddArea && (
            <span style={{
              fontSize: '0.75rem',
              color: '#6B7280',
              marginLeft: '8px',
              display: 'inline-flex',
              alignItems: 'center'
            }}>
              Create your first area
            </span>
          )}

          {updatedAreas.map(area => (
            <DraggableAreaTab
              key={area.id}
              $editMode={editAreasMode}
              $isDragging={draggedArea === area.id}
              draggable={editAreasMode}
              onDragStart={(e) => handleAreaDragStart(e, area.id)}
              onDragOver={handleAreaDragOver}
              onDrop={(e) => handleAreaDrop(e, area.id)}
              onDragEnd={handleAreaDragEnd}
            >
              <AreaDragHandle $editMode={editAreasMode}>
                <DragDot />
                <DragDot />
                <DragDot />
              </AreaDragHandle>

              <AreaTab
                $active={currentArea === area.id}
                onClick={() => handleAreaChange(area.id)}
              >
                {area.name}
                <AreaProgress>
                  {area.completedItems}/{area.totalItems}
                </AreaProgress>
              </AreaTab>
            </DraggableAreaTab>
          ))}

          {editAreasMode && (
            showAddArea ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CompactInput
                  type="text"
                  placeholder="Area name"
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddArea()}
                  autoFocus
                />
                <Button variant="primary" onClick={handleAddArea} size="sm">✓</Button>
                <Button variant="outline" onClick={() => {
                  setShowAddArea(false);
                  if (updatedAreas.length === 0) {
                    setEditAreasMode(false);
                  }
                }} size="sm">✕</Button>
              </div>
            ) : updatedAreas.length > 0 && (
              <AddAreaButton
                onClick={() => setShowAddArea(true)}
                title="Add new area"
              >
                +
              </AddAreaButton>
            )
          )}
        </AreaScrollContainer>
      </AreaCarousel>

      <MainContent>
        <DisabledOverlay disabled={updatedAreas.length === 0 || !currentArea}>
          <StockSection>
            <SearchSection>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <EditAreasButton
                  $editMode={editProductsMode}
                  onClick={() => setEditProductsMode(!editProductsMode)}
                  title={editProductsMode ? "Exit product edit mode" : "Edit product order"}
                >
                  ⚙️
                </EditAreasButton>
                <SectionTitle style={{ margin: 0, fontSize: '1.125rem' }}>
                  {updatedAreas.find(a => a.id === currentArea)?.name || 'No area selected'}
                </SectionTitle>
                <SearchIcon
                  onClick={handlePhotoButtonClick}
                  title={getCurrentAreaData()?.photo ? "View area photo" : "No area photo available"}
                  style={{
                    opacity: getCurrentAreaData()?.photo ? 1 : 0.5
                  }}
                >
                  🖼️
                </SearchIcon>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                  ({currentAreaTotalItems} items)
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                    {currentAreaCompletedItems}/{currentAreaTotalItems} • {Math.round(currentAreaProgress)}%
                  </span>
                  <div style={{ width: '60px', height: '4px', background: '#E5E7EB', borderRadius: '2px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        background: 'linear-gradient(90deg, #3B82F6 0%, #10B981 100%)',
                        width: `${currentAreaProgress}%`,
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>
              </div>
            </SearchSection>

          <DraggableProductList>
            {currentAreaItems.map(item => (
              <DraggableItem
                key={item.id}
                data-product-id={item.id}
                draggable={editProductsMode}
                $editMode={editProductsMode}
                $isDragging={draggedItem === item.id}
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragOver={(e) => handleDragOver(e, item.id)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, item.id)}
              >
                <DragHandle $editMode={editProductsMode}>
                  <DragDot />
                  <DragDot />
                  <DragDot />
                </DragHandle>

                <ProductCountGrid>
                  <ProductDetails>
                    <ProductName>
                      <span>{item.venue_name || item.name}</span>
                      <RemoveButton
                        $editMode={editProductsMode}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveProduct(item.id);
                        }}
                        title="Remove from counting session"
                      >
                        ✕
                      </RemoveButton>
                    </ProductName>
                    <ProductInfo>
                      {[
                        formatUnitSize(item.unit_size),
                        item.unit_type ? item.unit_type.charAt(0).toUpperCase() + item.unit_type.slice(1) + 's' : null,
                        item.case_size ? `Case of ${item.case_size}` : null
                      ].filter(Boolean).join(' • ')}
                    </ProductInfo>
                  </ProductDetails>

                  <CompactCountSection>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <DecimalInput
                          type="number"
                          min="0"
                          placeholder="0"
                          value={stockCases[item.id] || ''}
                          onChange={(e) => handleCasesChange(item.id, e.target.value)}
                        />
                        <UnitLabel>Cases</UnitLabel>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <DecimalInput
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0"
                          value={stockUnits[item.id] || ''}
                          onChange={(e) => handleUnitsChange(item.id, e.target.value)}
                        />
                        <UnitLabel>Units</UnitLabel>
                      </div>
                    </div>
                  </CompactCountSection>
                </ProductCountGrid>
              </DraggableItem>
            ))}

            {/* Inline Add Product */}
            {showAddProduct ? (
              <AddProductForm>
                <div style={{ position: 'relative', flex: 1 }}>
                  <CompactInput
                    type="text"
                    placeholder="Product name..."
                    value={newProductName}
                    onChange={(e) => handleProductNameChange(e.target.value)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    autoFocus
                  />
                  {/* Regular typed suggestions */}
                  {showSuggestions && productSuggestions.length > 0 && (
                    <SuggestionsList>
                      {productSuggestions.map((product, index) => (
                        <SuggestionItem
                          key={index}
                          onMouseDown={() => handleSuggestionSelect(product)}
                        >
                          <div style={{ fontWeight: '600' }}>{product.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>
                            {product.brand && `${product.brand} • `}
                            {product.category}{product.subcategory ? ` • ${product.subcategory}` : ''}
                            {product.unit_size && ` • ${product.unit_size}ml`}
                          </div>
                        </SuggestionItem>
                      ))}
                    </SuggestionsList>
                  )}
                </div>

                <CompactInput
                  type="text"
                  placeholder="Brand"
                  value={newProductBrand}
                  onChange={(e) => setNewProductBrand(e.target.value)}
                />

                <CompactSelect
                  value={newProductUnit}
                  onChange={(e) => setNewProductUnit(e.target.value)}
                >
                  <option value="bottle">Bottle</option>
                  <option value="can">Can</option>
                  <option value="keg">Keg</option>
                  <option value="cask">Cask</option>
                  <option value="bag-in-box">Bag-in-Box</option>
                </CompactSelect>

                <CompactInput
                  type="number"
                  placeholder="Unit Size (ml)"
                  value={newProductUnitSize}
                  onChange={(e) => setNewProductUnitSize(e.target.value)}
                  style={{ width: '120px' }}
                />

                <CompactInput
                  type="number"
                  placeholder="Case Size"
                  value={newProductCaseSize}
                  onChange={(e) => setNewProductCaseSize(e.target.value)}
                  style={{ width: '100px' }}
                />

                <Button
                  variant="primary"
                  onClick={handleAddProduct}
                  disabled={!newProductName}
                  size="sm"
                >
                  ✓
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddProduct(false);
                    setNewProductName('');
                    setNewProductBrand('');
                    setNewProductCategory('');
                    setNewProductSubcategory('');
                    setNewProductUnit('bottle');
                    setNewProductUnitSize('');
                    setNewProductCaseSize('');
                    setSelectedMasterProduct(null);
                    setShowSuggestions(false);
                  }}
                  size="sm"
                >
                  ✕
                </Button>
              </AddProductForm>
            ) : (
              <AddProductItem onClick={() => setShowAddProduct(true)}>
                <AddProductIcon>+</AddProductIcon>
                <span>Add new product to {updatedAreas.find(a => a.id === currentArea)?.name}</span>
              </AddProductItem>
            )}
          </DraggableProductList>
        </StockSection>

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'center' }}>
          <Button
            variant="secondary"
            onClick={handleSaveProgress}
            disabled={saving}
            size="sm"
            style={{
              flex: 1,
              maxWidth: '120px',
              backgroundColor: saveStatus === 'saved' ? '#10B981' : saveStatus === 'error' ? '#EF4444' : undefined,
              color: saveStatus === 'saved' || saveStatus === 'error' ? 'white' : undefined,
              transition: 'all 0.3s ease'
            }}
          >
            {saveStatus === 'saving' ? <LoadingSpinner /> :
             saveStatus === 'saved' ? '✓ Saved' :
             saveStatus === 'error' ? '✕ Error' :
             'Save'}
          </Button>
          <Button
            variant="primary"
            onClick={handleCompleteSession}
            disabled={saving || completedItems === 0}
            size="sm"
            style={{ flex: 1, maxWidth: '120px' }}
          >
            {saving ? <LoadingSpinner /> : 'Complete'}
          </Button>
        </div>
        </DisabledOverlay>
      </MainContent>

      {/* Area Photo Modal */}
      {showAreaPhoto && getCurrentAreaData()?.photo && (
        <PhotoModal onClick={closePhotoModal}>
          <PhotoContainer onClick={e => e.stopPropagation()}>
            <PhotoHeader>
              <PhotoTitle>{getCurrentAreaData()?.name} - Reference Photo</PhotoTitle>
              <CloseButton onClick={closePhotoModal} title="Close photo">
                ✕
              </CloseButton>
            </PhotoHeader>
            <PhotoImage
              src={getCurrentAreaData()?.photo}
              alt={`${getCurrentAreaData()?.name} reference photo`}
              onError={(e) => {
                console.error('Failed to load area photo');
                closePhotoModal();
              }}
            />
          </PhotoContainer>
        </PhotoModal>
      )}

      {/* No Photo Modal */}
      {showAreaPhoto && !getCurrentAreaData()?.photo && (
        <PhotoModal onClick={closePhotoModal}>
          <PhotoContainer onClick={e => e.stopPropagation()}>
            <PhotoHeader>
              <PhotoTitle>{getCurrentAreaData()?.name} - No Photo Available</PhotoTitle>
              <CloseButton onClick={closePhotoModal} title="Close">
                ✕
              </CloseButton>
            </PhotoHeader>
            <NoPhotoPlaceholder>
              📷<br />No reference photo has been captured for this area yet.<br />
              <small>Go to Area Setup to capture a reference photo.</small>
            </NoPhotoPlaceholder>
          </PhotoContainer>
        </PhotoModal>
      )}
    </StockTakingContainer>
  );
};

export default StockTaking;
