import { useEffect } from 'react';
import { Operator } from '../types';

export interface UseKeyboardOptions {
  inputDigit: (digit: string) => void;
  inputDecimal: () => void;
  setOperator: (op: Operator) => void;
  calculate: () => void;
  clearAll: () => void;
  deleteLast: () => void;
  disabled?: boolean;
}

export function useKeyboard({
  inputDigit,
  inputDecimal,
  setOperator,
  calculate,
  clearAll,
  deleteLast,
  disabled = false,
}: UseKeyboardOptions): void {
  useEffect(() => {
    if (disabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const { key } = event;

      if (key >= '0' && key <= '9') {
        inputDigit(key);
        return;
      }

      if (key === '.') {
        inputDecimal();
        return;
      }

      if (key === '+' || key === '-' || key === '^' || key === '%') {
        setOperator(key as Operator);
        return;
      }

      if (key === '*') {
        setOperator('×');
        return;
      }

      if (key === '/') {
        event.preventDefault();
        setOperator('÷');
        return;
      }

      if (key === 'Enter' || key === '=') {
        event.preventDefault();
        calculate();
        return;
      }

      if (key === 'Escape' || key === 'c' || key === 'C') {
        clearAll();
        return;
      }

      if (key === 'Backspace') {
        event.preventDefault();
        deleteLast();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [inputDigit, inputDecimal, setOperator, calculate, clearAll, deleteLast, disabled]);
}
