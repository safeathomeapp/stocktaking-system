import React, { useState } from 'react';
import styled from 'styled-components';
import PartialStateCheckbox from './PartialStateCheckbox';

/**
 * CategoryProductsDisplay Component
 *
 * Displays products organized by categories with hierarchical selection:
 * - Category headers with collapse/expand triangles (▼/▶)
 * - Parent category checkbox controls all child items
 * - Custom partial-state checkbox for categories with mixed selection
 * - Products displayed in rows under each category
 *
 * FEATURES:
 * - Collapsible categories (default: expanded)
 * - Parent checkbox toggles all children
 * - Child checkboxes update parent state
 * - Partial state visual when some items are selected
 * - Preserves PDF order of categories and products
 * - Full keyboard accessibility
 *
 * PROPS:
 * - categories: Array of category objects {name, itemCount, subtotal, ignoredCount}
 * - products: Array of products with category field assigned
 * - onProductToggle: Callback when product checkbox changes
 * - onCategoryToggle: Callback when category checkbox changes
 *
 * CATEGORY OBJECT STRUCTURE:
 * {
 *   name: string,                // Category name (e.g., "RETAIL GROCERY")
 *   itemCount: number,          // Total products in this category
 *   subtotal: number,           // Category total from PDF (£)
 *   ignoredCount: number        // Count of previously ignored items in this category
 * }
 *
 * STYLING:
 * - Category headers with distinctive styling and collapse icon
 * - Indented product rows for visual hierarchy
 * - Hover effects for better UX
 * - Color-coded visual feedback
 */

const Container = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

/**
 * Category header row
 * - Shows category name, item count, and collapse icon
 * - Clickable to toggle category expansion
 * - Parent checkbox controls all items in category
 */
const CategoryHeader = styled.div`
  background: #f8f9fa;
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;

  &:hover {
    background: #f0f1f3;
  }

  /* Indicate interactive state */
  &:active {
    background: #e9ecef;
  }
`;

/**
 * Collapse/expand triangle icon
 * - Points right (▶) when collapsed
 * - Points down (▼) when expanded
 * - Smooth rotation animation
 */
const CollapseIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: 12px;
  color: #666;
  transition: transform 0.2s ease;
  flex-shrink: 0;

  /* Rotate triangle based on collapsed state */
  ${props => !props.collapsed && 'transform: rotate(90deg);'}
`;

/**
 * Category label with name and item count
 * - Truncates long names with ellipsis
 * - Shows subtotal information
 */
const CategoryLabel = styled.span`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #333;
  min-width: 0;

  .category-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .category-meta {
    color: #999;
    font-size: 0.85rem;
    font-weight: 400;
    white-space: nowrap;
  }
`;

/**
 * Product rows container
 * - Shows or hides based on category expansion state
 * - Animated expansion/collapse
 */
const ProductsContainer = styled.div`
  max-height: ${props => props.expanded ? '2000px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease;
`;

/**
 * Product row with checkbox and details
 * - Indented to show hierarchy
 * - Matches main table styling
 * - Hover effects for selection feedback
 */
const ProductRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border-bottom: 1px solid #f0f0f0;
  background: white;
  transition: background-color 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #fafafa;
  }
`;

const ProductCheckbox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  flex-shrink: 0;
`;

/**
 * Product info displayed inline
 * - SKU, name, size, price information
 * - Responsive layout
 */
const ProductInfo = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 80px 1fr 120px 120px 100px 100px;
  gap: 1rem;
  align-items: center;
  font-size: 0.9rem;

  .sku {
    color: #999;
    font-family: monospace;
  }

  .name {
    color: #333;
    font-weight: 500;
  }

  .size {
    color: #666;
  }

  .price {
    text-align: right;
    color: #333;
    font-weight: 500;
  }

  @media (max-width: 1200px) {
    grid-template-columns: 80px 1fr 100px;
    gap: 0.5rem;

    .size,
    .case-size {
      display: none;
    }
  }
`;

/**
 * No categories message
 * - Shows when categories are not available
 * - Provides context about why categories aren't shown
 */
const NoCategoriesMessage = styled.div`
  padding: 2rem;
  text-align: center;
  color: #999;
  background: #fafafa;
  border-radius: 8px;
`;

function CategoryProductsDisplay({
  categories = [],
  products = [],
  onProductToggle = () => {},
  onCategoryToggle = () => {}
}) {
  // Track which categories are expanded (default: all expanded)
  const [expandedCategories, setExpandedCategories] = useState(
    Object.fromEntries(categories.map(cat => [cat.name, true]))
  );

  /**
   * Toggle category collapse/expand state
   * Preserves state of other categories
   */
  const handleCategoryClick = (categoryName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  /**
   * Handle category checkbox change
   * Toggles all products in the category
   */
  const handleCategoryToggle = (categoryName, newState) => {
    onCategoryToggle(categoryName, newState);
  };

  /**
   * Handle individual product checkbox change
   */
  const handleProductToggle = (productIndex) => {
    onProductToggle(productIndex);
  };

  // No categories to display
  if (!categories || categories.length === 0) {
    return (
      <NoCategoriesMessage>
        No categories detected. Products will be displayed in a flat list.
      </NoCategoriesMessage>
    );
  }

  return (
    <Container>
      {/* Render each category with its products */}
      {categories.map((category) => {
        // Get all products in this category, preserving order
        const categoryProducts = products.filter(p => p.category === category.name);
        const isExpanded = expandedCategories[category.name] !== false; // Default to expanded

        // Calculate how many products are selected in this category
        const selectedInCategory = categoryProducts.filter(p => p.selected).length;
        const hasPartialSelection = selectedInCategory > 0 && selectedInCategory < categoryProducts.length;
        const isFullySelected = selectedInCategory === categoryProducts.length && categoryProducts.length > 0;

        return (
          <div key={category.name}>
            {/* Category Header with Checkbox */}
            <CategoryHeader
              onClick={() => handleCategoryClick(category.name)}
            >
              {/* Collapse/Expand Triangle Icon */}
              <CollapseIcon collapsed={!isExpanded}>▶</CollapseIcon>

              {/* Category Checkbox with Partial State Support */}
              <ProductCheckbox onClick={(e) => e.stopPropagation()}>
                <PartialStateCheckbox
                  checked={isFullySelected}
                  partial={hasPartialSelection}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleCategoryToggle(category.name, !isFullySelected);
                  }}
                />
              </ProductCheckbox>

              {/* Category Label with Name and Item Count */}
              <CategoryLabel>
                <span className="category-name">{category.name}</span>
                <span className="category-meta">
                  ({categoryProducts.length} items)
                  {category.ignoredCount > 0 && ` • ${category.ignoredCount} ignored`}
                  {category.subtotal && ` • £${category.subtotal.toFixed(2)}`}
                </span>
              </CategoryLabel>
            </CategoryHeader>

            {/* Products in Category (Collapsible) */}
            <ProductsContainer expanded={isExpanded}>
              {categoryProducts.map((product, productIndex) => (
                <ProductRow key={`${category.name}-${product.sku}`}>
                  {/* Product Checkbox */}
                  <ProductCheckbox>
                    <PartialStateCheckbox
                      checked={product.selected}
                      onChange={() => handleProductToggle(productIndex)}
                    />
                  </ProductCheckbox>

                  {/* Product Information */}
                  <ProductInfo>
                    <div className="sku">{product.sku}</div>
                    <div className="name">{product.name}</div>
                    <div className="size">{product.packSize || '-'}</div>
                    <div className="size">{product.unitSize || '-'}</div>
                    <div className="price">£{parseFloat(product.unitCost || 0).toFixed(2)}</div>
                    <div className="case-size">{product.caseSize || 1}</div>
                  </ProductInfo>
                </ProductRow>
              ))}
            </ProductsContainer>
          </div>
        );
      })}
    </Container>
  );
}

export default CategoryProductsDisplay;
