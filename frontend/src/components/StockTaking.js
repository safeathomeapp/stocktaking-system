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
  background: ${props => props.editMode ? props.theme.colors.primary : props.theme.colors.surface};
  color: ${props => props.editMode ? 'white' : props.theme.colors.textSecondary};
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
  cursor: ${props => props.editMode ? 'grab' : 'pointer'};
  opacity: ${props => props.isDragging ? 0.5 : 1};

  &:active {
    cursor: ${props => props.editMode ? 'grabbing' : 'pointer'};
  }
`;

const AreaDragHandle = styled.div`
  display: ${props => props.editMode ? 'flex' : 'none'};
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
  border: 1px solid ${props => props.active ? props.theme.colors.primary : props.theme.colors.border};
  background: ${props => props.active ? props.theme.colors.primary : props.theme.colors.surface};
  color: ${props => props.active ? 'white' : props.theme.colors.text};
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
  cursor: ${props => props.editMode ? (props.isDragging ? 'grabbing' : 'grab') : 'default'};
  transition: all 0.2s ease;
  opacity: ${props => props.isDragging ? 0.5 : 1};
  min-height: 64px;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const DragHandle = styled.div`
  display: ${props => props.editMode ? 'flex' : 'none'};
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
  width: 80px;
  padding: ${props => props.theme.spacing.md};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 6px;
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  font-size: 1rem;
  text-align: center;
  height: 48px;

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

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.primary};
  }
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
  const [saving, setSaving] = useState(false);

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
  const [newProductCategory, setNewProductCategory] = useState('');
  const [newProductUnit, setNewProductUnit] = useState('bottles');
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Voice recognition
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceSuggestions, setVoiceSuggestions] = useState([]);
  const [showVoiceSuggestions, setShowVoiceSuggestions] = useState(false);
  const [voiceSearchLoading, setVoiceSearchLoading] = useState(false);
  const recognition = useRef(null);

  // Drag and drop
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);

  // Product suggestion database for fuzzy search
  const productDatabase = [
    'Absolute Vodka', 'Bacardi Rum', 'Bailey\'s Irish Cream', 'Bombay Gin', 'Budweiser', 'Corona', 'Guinness',
    'Heineken', 'Jack Daniel\'s', 'Jameson', 'Johnny Walker', 'Martini Rosso', 'Smirnoff', 'Stella Artois',
    'Tanqueray', 'Tequila', 'Veuve Clicquot', 'Wine - Chardonnay', 'Wine - Merlot', 'Wine - Pinot Grigio',
    'Cleaning Spray', 'Paper Towels', 'Dish Soap', 'Olive Oil', 'Balsamic Vinegar', 'Salt', 'Pepper'
  ];

  useEffect(() => {
    // Initialize voice recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setVoiceSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'en-US';

      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('Voice transcript:', transcript);

        // Check if this was for product input or search
        if (recognition.current._isForProduct) {
          handleVoiceResultForProduct(transcript);
          recognition.current._isForProduct = false;
        } else {
          handleVoiceResult(transcript);
        }
      };

      recognition.current.onend = () => {
        setIsListening(false);
      };

      recognition.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }

    // Load session and venue data
    loadSessionData();

    return () => {
      if (recognition.current) {
        recognition.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

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

      // Get venue details
      if (sessionResponse.data.venue_id) {
        const venueResponse = await apiService.getVenues();
        if (venueResponse.success) {
          const venue = venueResponse.data.find(v => v.id === sessionResponse.data.venue_id);
          setVenueData(venue);
        }

        // Get venue products
        const productsResponse = await apiService.getVenueProducts(sessionResponse.data.venue_id);

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
        // Fix: The API returns {entries: [...]} not a direct array
        const entries = entriesResponse.data.entries || [];
        entries.forEach(entry => {
          counts[entry.product_id] = entry.quantity_level.toString();
        });
        setStockCounts(counts);
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
    return items.filter(item => {
      const itemLower = item.toLowerCase();
      // Simple fuzzy logic: check if all characters in query exist in order
      let queryIndex = 0;
      for (let i = 0; i < itemLower.length && queryIndex < queryLower.length; i++) {
        if (itemLower[i] === queryLower[queryIndex]) {
          queryIndex++;
        }
      }
      return queryIndex === queryLower.length;
    }).slice(0, 5);
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
  const handleSuggestionSelect = (suggestion) => {
    setNewProductName(suggestion);
    setShowSuggestions(false);

    // Auto-populate category based on product name
    const lowerSuggestion = suggestion.toLowerCase();
    if (lowerSuggestion.includes('wine') || lowerSuggestion.includes('champagne')) {
      setNewProductCategory('Wine');
    } else if (lowerSuggestion.includes('beer') || lowerSuggestion.includes('lager') || lowerSuggestion.includes('ale')) {
      setNewProductCategory('Beer');
    } else if (lowerSuggestion.includes('vodka') || lowerSuggestion.includes('whiskey') || lowerSuggestion.includes('rum') || lowerSuggestion.includes('gin')) {
      setNewProductCategory('Spirits');
    } else if (lowerSuggestion.includes('clean') || lowerSuggestion.includes('paper') || lowerSuggestion.includes('soap')) {
      setNewProductCategory('Supplies');
    } else {
      setNewProductCategory('Other');
    }
  };

  // Voice recognition handlers
  const handleVoiceStart = () => {
    if (recognition.current && voiceSupported) {
      setIsListening(true);
      recognition.current.start();
    }
  };

  const handleVoiceStartForProduct = () => {
    if (recognition.current && voiceSupported) {
      setIsListening(true);
      // Set a flag to indicate this is for product input
      recognition.current._isForProduct = true;
      recognition.current.start();
    }
  };

  const handleVoiceResult = (transcript) => {
    console.log('Processing voice search:', transcript);

    // Use voice input to search existing products in current area
    const searchTerm = transcript.trim().toLowerCase();

    // Search through current area products
    const matchingProducts = getCurrentAreaItems().filter(item =>
      item.name.toLowerCase().includes(searchTerm) ||
      item.category.toLowerCase().includes(searchTerm)
    );

    if (matchingProducts.length > 0) {
      // Focus on the first matching product by scrolling to it
      const firstMatch = matchingProducts[0];
      const element = document.querySelector(`[data-product-id="${firstMatch.id}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Briefly highlight the found product
        element.style.border = '2px solid #3B82F6';
        setTimeout(() => {
          element.style.border = '';
        }, 2000);
      }

      // Also set the search term to show all matches
      setSearchTerm(searchTerm);
      setShowSearch(true);
    } else {
      // If no matches found, clear search and maybe show a message
      setSearchTerm('');
      console.log('No products found matching:', searchTerm);
    }

    setIsListening(false);
  };

  const handleVoiceResultForProduct = async (transcript) => {
    console.log('Processing voice for product input:', transcript);
    setVoiceSearchLoading(true);

    // Clean up the transcript
    const cleanedQuery = transcript.replace(/^(add|create|new)\s+/i, '').trim();

    try {
      // Search master products database with fuzzy matching
      const searchResult = await apiService.searchMasterProducts(
        cleanedQuery,
        sessionId,
        venueData?.id,
        10, // maxResults
        30  // minConfidence (lower for more suggestions)
      );

      if (searchResult.success && searchResult.data?.suggestions?.length > 0) {
        // Show voice suggestions to user for manual selection
        setVoiceSuggestions(searchResult.data.suggestions);
        setShowVoiceSuggestions(true);

        // Keep the original transcript in the field as a fallback
        setNewProductName(cleanedQuery);
      } else {
        // No suggestions found, use original input
        console.log('No master product suggestions found, using original input');
        setNewProductName(cleanedQuery);
        setShowVoiceSuggestions(false);
      }
    } catch (error) {
      console.error('Voice search error:', error);
      // Fallback to original behavior
      setNewProductName(cleanedQuery);
      setShowVoiceSuggestions(false);
    } finally {
      setVoiceSearchLoading(false);
      setIsListening(false);
    }
  };

  // Handle voice suggestion selection
  const handleVoiceSuggestionSelect = async (suggestion, rank) => {
    console.log('Selected voice suggestion:', suggestion);

    // Fill in the product form with suggestion data
    setNewProductName(suggestion.name);
    setNewProductCategory(suggestion.category || '');

    // Record the selection for learning
    if (suggestion.logId) {
      try {
        await apiService.recordProductSelection(suggestion.id, suggestion.logId, rank + 1);
      } catch (error) {
        console.error('Failed to record selection:', error);
      }
    }

    // Hide suggestions
    setShowVoiceSuggestions(false);
    setVoiceSuggestions([]);
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
    if (newProductName && newProductCategory && venueData?.id && currentArea) {
      try {
        // Find the current area object to get its database ID
        const currentAreaObj = areas.find(area => area.id === currentArea);

        if (!currentAreaObj) {
          setError('Please select a valid area before adding products.');
          return;
        }

        // Prepare product data for database
        const productData = {
          name: newProductName,
          category: newProductCategory,
          unit: newProductUnit,
          area_id: typeof currentAreaObj.id === 'number' ? currentAreaObj.id : null, // Only use database area IDs
          brand: '',
          size: '',
          barcode: ''
        };

        // Save product to database immediately
        const response = await apiService.createVenueProduct(venueData.id, productData);

        if (response.success) {
          // Add the database product to local state
          const newProduct = {
            id: response.data.product.id,
            name: response.data.product.name,
            category: response.data.product.category,
            unit_type: response.data.product.unit_type,
            area_id: response.data.product.area_id,
            area: currentArea, // Keep area reference for UI
            expectedCount: 0,
            brand: response.data.product.brand,
            size: response.data.product.size,
            barcode: response.data.product.barcode
          };

          setStockItems(prev => [...prev, newProduct]);

          // Reset form
          setNewProductName('');
          setNewProductCategory('');
          setNewProductUnit('bottles');
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
      } else if (!newProductName || !newProductCategory) {
        setError('Please fill in product name and category.');
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

  const handleDecimalCount = (itemId, expectedCount, fraction) => {
    const value = (expectedCount * fraction).toFixed(2);
    setStockCounts(prev => ({
      ...prev,
      [itemId]: value
    }));
  };

  const handleSaveProgress = async () => {
    setSaving(true);
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

          // For database compatibility, set quantity_level to 1.0 (not used for calculations)
          const quantityLevel = 1.0;

          const entryData = {
            product_id: productId,
            quantity_level: quantityLevel, // Fixed at 1.0 for compatibility
            quantity_units: actualQuantity, // Actual count data (12.5, etc.)
            location_notes: null,
            condition_flags: null,
            photo_url: null
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
                  quantity_level: quantityLevel,
                  quantity_units: actualQuantity
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
    } catch (error) {
      console.error('Error saving progress:', error);
      setError('Failed to save progress. Please try again.');
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

          // For database compatibility, set quantity_level to 1.0 (not used for calculations)
          const quantityLevel = 1.0;

          const entryData = {
            product_id: productId,
            quantity_level: quantityLevel,
            quantity_units: actualQuantity,
            location_notes: null,
            condition_flags: null,
            photo_url: null
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
                      quantity_level: quantityLevel,
                      quantity_units: actualQuantity
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
          setTimeout(() => navigate('/history'), 3000);
        } else {
          navigate('/history');
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

  const filteredItems = stockItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            Session: {sessionId ? String(sessionId).slice(-8) : 'Loading...'} • {sessionData?.stocktaker_name || 'Loading...'} • {sessionData?.session_date ? new Date(sessionData.session_date).toLocaleDateString() : new Date().toLocaleDateString()} • Overall: {completedItems}/{totalItems} • Areas: {updatedAreas.filter(a => a.completedItems >= a.totalItems).length}/{updatedAreas.length} • Voice: {voiceSupported ? 'Ready' : 'N/A'}
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
            editMode={editAreasMode}
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
              editMode={editAreasMode}
              isDragging={draggedArea === area.id}
              draggable={editAreasMode}
              onDragStart={(e) => handleAreaDragStart(e, area.id)}
              onDragOver={handleAreaDragOver}
              onDrop={(e) => handleAreaDrop(e, area.id)}
              onDragEnd={handleAreaDragEnd}
            >
              <AreaDragHandle editMode={editAreasMode}>
                <DragDot />
                <DragDot />
                <DragDot />
              </AreaDragHandle>

              <AreaTab
                active={currentArea === area.id}
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
                  editMode={editProductsMode}
                  onClick={() => setEditProductsMode(!editProductsMode)}
                  title={editProductsMode ? "Exit product edit mode" : "Edit product order"}
                >
                  ⚙️
                </EditAreasButton>
                <SectionTitle style={{ margin: 0, fontSize: '1.125rem' }}>
                  {updatedAreas.find(a => a.id === currentArea)?.name || 'No area selected'}
                </SectionTitle>
                <SearchIcon
                  onClick={() => setShowSearch(!showSearch)}
                  title="Search products"
                >
                  🔍
                </SearchIcon>
                {voiceSupported && (
                  <SearchIcon
                    onClick={handleVoiceStart}
                    disabled={isListening}
                    title="Voice search products"
                    style={{
                      backgroundColor: isListening ? '#EF4444' : '',
                      color: isListening ? 'white' : '',
                      animation: isListening ? 'pulse 1.5s infinite' : 'none'
                    }}
                  >
                    🎤
                  </SearchIcon>
                )}
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

            <CollapsibleSearch show={showSearch}>
              <SearchInput
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ fontSize: '0.875rem', padding: '8px 12px', width: '200px' }}
              />
            </CollapsibleSearch>

          <DraggableProductList>
            {currentAreaItems.map(item => (
              <DraggableItem
                key={item.id}
                data-product-id={item.id}
                draggable={editProductsMode}
                editMode={editProductsMode}
                isDragging={draggedItem === item.id}
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragOver={(e) => handleDragOver(e, item.id)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, item.id)}
              >
                <DragHandle editMode={editProductsMode}>
                  <DragDot />
                  <DragDot />
                  <DragDot />
                </DragHandle>

                <ProductCountGrid>
                  <ProductDetails>
                    <ProductName>{item.name}</ProductName>
                    <ProductInfo>
                      {item.category} • {item.expectedCount} {item.unit}
                    </ProductInfo>
                  </ProductDetails>

                  <CompactCountSection>
                    <DecimalInput
                      type="number"
                      step="0.01"
                      min="0"
                      value={stockCounts[item.id] || ''}
                      onChange={(e) => handleCountChange(item.id, e.target.value)}
                    />
                    <UnitLabel>{item.unit}</UnitLabel>
                  </CompactCountSection>
                </ProductCountGrid>
              </DraggableItem>
            ))}

            {/* Inline Add Product */}
            {showAddProduct ? (
              <AddProductForm>
                {voiceSupported && (
                  <VoiceButton
                    variant={isListening ? "danger" : "secondary"}
                    onClick={handleVoiceStartForProduct}
                    disabled={isListening}
                    listening={isListening}
                    size="sm"
                  >
                    🎤
                  </VoiceButton>
                )}

                <div style={{ position: 'relative', flex: 1 }}>
                  <CompactInput
                    type="text"
                    placeholder="Product name..."
                    value={newProductName}
                    onChange={(e) => handleProductNameChange(e.target.value)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    autoFocus
                  />
                  {/* Voice search loading indicator */}
                  {voiceSearchLoading && (
                    <SuggestionsList>
                      <SuggestionItem style={{ color: '#666', fontStyle: 'italic' }}>
                        🎤 Searching products...
                      </SuggestionItem>
                    </SuggestionsList>
                  )}

                  {/* Voice suggestions from master database */}
                  {showVoiceSuggestions && voiceSuggestions.length > 0 && (
                    <SuggestionsList>
                      <SuggestionItem style={{
                        backgroundColor: '#E3F2FD',
                        color: '#1976D2',
                        fontWeight: 'bold',
                        fontSize: '0.8rem',
                        padding: '4px 8px'
                      }}>
                        🎤 Voice Suggestions:
                      </SuggestionItem>
                      {voiceSuggestions.map((suggestion, index) => (
                        <SuggestionItem
                          key={`voice-${index}`}
                          onMouseDown={() => handleVoiceSuggestionSelect(suggestion, index)}
                          style={{ borderLeft: '3px solid #2196F3' }}
                        >
                          <div>
                            <strong>{suggestion.name}</strong>
                            {suggestion.brand && <span> ({suggestion.brand})</span>}
                            {suggestion.size && <span> - {suggestion.size}</span>}
                            <div style={{ fontSize: '0.75rem', color: '#666' }}>
                              {suggestion.category} • {suggestion.confidence}% match
                            </div>
                          </div>
                        </SuggestionItem>
                      ))}
                    </SuggestionsList>
                  )}

                  {/* Regular typed suggestions */}
                  {showSuggestions && productSuggestions.length > 0 && !showVoiceSuggestions && (
                    <SuggestionsList>
                      {productSuggestions.map((suggestion, index) => (
                        <SuggestionItem
                          key={index}
                          onMouseDown={() => handleSuggestionSelect(suggestion)}
                        >
                          {suggestion}
                        </SuggestionItem>
                      ))}
                    </SuggestionsList>
                  )}
                </div>

                <CompactInput
                  type="text"
                  placeholder="Category"
                  value={newProductCategory}
                  onChange={(e) => setNewProductCategory(e.target.value)}
                />

                <CompactSelect
                  value={newProductUnit}
                  onChange={(e) => setNewProductUnit(e.target.value)}
                >
                  <option value="bottles">Bottles</option>
                  <option value="cans">Cans</option>
                  <option value="kegs">Kegs</option>
                  <option value="units">Units</option>
                  <option value="boxes">Boxes</option>
                </CompactSelect>

                <Button
                  variant="primary"
                  onClick={handleAddProduct}
                  disabled={!newProductName || !newProductCategory}
                  size="sm"
                >
                  ✓
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddProduct(false);
                    setNewProductName('');
                    setNewProductCategory('');
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
            style={{ flex: 1, maxWidth: '120px' }}
          >
            {saving ? <LoadingSpinner /> : 'Save'}
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
    </StockTakingContainer>
  );
};

export default StockTaking;
