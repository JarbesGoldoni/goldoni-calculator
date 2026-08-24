import React from 'react';

export interface DisplayProps {
  upperDisplay: string;
  lowerDisplay: string;
  isError?: boolean;
  error?: string | null;
}

const formatDisplayValue = (text: string): string => {
  return text.replace(/(\d+\.\d{3})\d+/g, '$1...');
};

export const Display: React.FC<DisplayProps> = ({
  upperDisplay,
  lowerDisplay,
  isError = false,
  error = null,
}) => {
  const rawValue = isError && error ? error : lowerDisplay;
  const displayValue = isError ? rawValue : formatDisplayValue(rawValue);

  return (
    <div className="calculator-display" data-testid="calculator-display">
      <div
        className="display-upper"
        data-testid="upper-display"
        aria-label="Previous expression"
      >
        {formatDisplayValue(upperDisplay)}
      </div>
      <div
        className={`display-lower ${isError ? 'display-error' : ''}`}
        data-testid="lower-display"
        aria-label="Current value"
        role="status"
        aria-live="polite"
      >
        {displayValue}
      </div>
    </div>
  );
};
