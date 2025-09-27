import styled, { css } from 'styled-components';

export const FormSection = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: ${props => props.theme.spacing.xl};
  box-shadow: 0 4px 6px -1px ${props => props.theme.colors.shadow};
  border: 1px solid ${props => props.theme.colors.border};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

export const FormGrid = styled.div`
  display: grid;
  gap: ${props => props.theme.spacing.lg};
  grid-template-columns: 1fr;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    grid-template-columns: ${props => props.columns || '1fr 1fr'};
  }
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};

  &.full-width {
    @media (min-width: ${props => props.theme.breakpoints.tablet}) {
      grid-column: 1 / -1;
    }
  }

  &.half-width {
    @media (min-width: ${props => props.theme.breakpoints.tablet}) {
      grid-column: span 1;
    }
  }
`;

export const Label = styled.label`
  font-weight: ${props => props.theme.fontWeight.semibold};
  color: ${props => props.theme.colors.text};
  font-size: ${props => props.theme.fontSize.sm};

  ${props => props.required && `
    &::after {
      content: ' *';
      color: ${props.theme.colors.danger};
    }
  `}

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: ${props => props.theme.fontSize.base};
  }
`;

const inputStyles = css`
  padding: ${props => props.theme.spacing.md};
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  font-size: ${props => props.theme.fontSize.base};
  min-height: ${props => props.theme.tablet.minTouchTarget};
  font-family: inherit;
  transition: all ${props => props.theme.animation.fast} ${props => props.theme.animation.easing};

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    outline: none;
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primaryLight};
  }

  &::placeholder {
    color: ${props => props.theme.colors.textMuted};
  }

  &:disabled {
    background: ${props => props.theme.colors.backgroundAlt};
    color: ${props => props.theme.colors.textMuted};
    cursor: not-allowed;
  }

  ${props => props.error && `
    border-color: ${props.theme.colors.danger};

    &:focus {
      border-color: ${props.theme.colors.danger};
      box-shadow: 0 0 0 3px ${props.theme.colors.dangerLight};
    }
  `}

  ${props => props.success && `
    border-color: ${props.theme.colors.success};

    &:focus {
      border-color: ${props.theme.colors.success};
      box-shadow: 0 0 0 3px ${props.theme.colors.successLight};
    }
  `}

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: ${props => props.theme.fontSize.lg};
    padding: ${props => props.theme.spacing.lg};
  }
`;

export const Input = styled.input`
  ${inputStyles}
`;

export const TextArea = styled.textarea`
  ${inputStyles}
  min-height: 100px;
  resize: vertical;
`;

export const Select = styled.select`
  ${inputStyles}
  cursor: pointer;
`;

export const FieldError = styled.div`
  color: ${props => props.theme.colors.danger};
  font-size: ${props => props.theme.fontSize.sm};
  margin-top: ${props => props.theme.spacing.xs};
`;

export const FieldHelp = styled.div`
  color: ${props => props.theme.colors.textSecondary};
  font-size: ${props => props.theme.fontSize.sm};
  margin-top: ${props => props.theme.spacing.xs};
`;

export const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.xl};

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    flex-direction: row;
    justify-content: ${props => props.align || 'flex-end'};
    gap: ${props => props.theme.spacing.lg};
  }
`;

export const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  width: 20px;
  height: 20px;
  accent-color: ${props => props.theme.colors.primary};
  cursor: pointer;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    width: 24px;
    height: 24px;
  }
`;

export const Radio = styled.input.attrs({ type: 'radio' })`
  width: 20px;
  height: 20px;
  accent-color: ${props => props.theme.colors.primary};
  cursor: pointer;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    width: 24px;
    height: 24px;
  }
`;

export const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`;

export const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.fontSize.base};
  color: ${props => props.theme.colors.text};
  cursor: pointer;
  min-height: ${props => props.theme.tablet.minTouchTarget};
`;

export const RadioGroup = styled(CheckboxGroup)``;
export const RadioLabel = styled(CheckboxLabel)``;