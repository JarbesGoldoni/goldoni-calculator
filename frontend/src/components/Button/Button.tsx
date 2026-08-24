import React from 'react';
import { ButtonVariant } from '../../types';

export interface ButtonProps {
  label: string;
  variant?: ButtonVariant;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  variant = 'numeric',
  onClick,
  disabled = false,
  className = '',
  ariaLabel,
}) => {
  return (
    <button
      type="button"
      className={`calc-btn calc-btn-${variant} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || label}
      data-testid={`btn-${label}`}
    >
      {label}
    </button>
  );
};
