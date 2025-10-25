import React from 'react';
import styled from 'styled-components';

/**
 * PartialStateCheckbox Component
 *
 * Custom checkbox component with three states:
 * - UNCHECKED: white box with no fill
 * - CHECKED: blue box with white checkmark
 * - PARTIAL: diagonal split (top-right white, bottom-left blue) indicating some children are selected
 *
 * STYLING DETAILS:
 * - Uses SVG for partial state to achieve exact diagonal split visual
 * - Diagonal line goes from top-left to bottom-right
 * - Blue area represents "some items selected" state
 * - Maintains accessibility with proper input element
 *
 * USAGE:
 * <PartialStateCheckbox
 *   checked={isFullyChecked}       // true if all items selected
 *   partial={hasSomeSelected}      // true if some but not all items selected
 *   onChange={handleChange}        // called when user clicks
 * />
 */

const CheckboxContainer = styled.label`
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  margin: 0;
  padding: 0;
`;

const HiddenCheckbox = styled.input`
  display: none;
`;

/**
 * Visual checkbox box that displays three states:
 * 1. Unchecked: white background with gray border
 * 2. Partial: diagonal split (white top-right, blue bottom-left)
 * 3. Checked: solid blue background with white checkmark
 */
const CheckboxBox = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid #ccc;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  transition: all 0.2s ease;
  position: relative;

  /* Checked state: solid blue with checkmark */
  ${props => props.checked && !props.partial && `
    background: #2196F3;
    border-color: #2196F3;
    color: white;
    font-size: 12px;
    font-weight: bold;
  `}

  /* Partial state: diagonal split visual */
  ${props => props.partial && `
    background: white;
    border-color: #2196F3;
  `}

  /* Hover effect for unchecked state */
  ${props => !props.checked && !props.partial && `
    &:hover {
      border-color: #999;
    }
  `}

  /* Hover effect for checked/partial state */
  ${props => (props.checked || props.partial) && `
    &:hover {
      box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
    }
  `}
`;

/**
 * SVG overlay for partial state diagonal split
 * Creates the visual effect of:
 * - Top-right corner: white (unselected items)
 * - Bottom-left corner: blue (selected items)
 * - Diagonal line from top-left to bottom-right separates the areas
 */
const PartialStateSVG = styled.svg`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
`;

function PartialStateCheckbox({ checked = false, partial = false, onChange = () => {} }) {
  const handleChange = (e) => {
    onChange(e);
  };

  return (
    <CheckboxContainer>
      <HiddenCheckbox
        type="checkbox"
        checked={checked || partial}
        onChange={handleChange}
        aria-label="Select item or category"
      />
      <CheckboxBox checked={checked} partial={partial}>
        {/* Show checkmark when fully checked */}
        {checked && !partial && '✓'}

        {/* Show diagonal split SVG when partial */}
        {partial && (
          <PartialStateSVG viewBox="0 0 18 18" preserveAspectRatio="none">
            {/* Blue triangle for bottom-left (selected items) */}
            <polygon points="0,0 18,0 0,18" fill="#2196F3" />
            {/* White triangle for top-right (unselected items) - already white background */}
            {/* Diagonal line border */}
            <line x1="0" y1="18" x2="18" y2="0" stroke="#2196F3" strokeWidth="1" />
          </PartialStateSVG>
        )}
      </CheckboxBox>
    </CheckboxContainer>
  );
}

export default PartialStateCheckbox;
