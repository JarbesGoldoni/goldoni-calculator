import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useKeyboard, UseKeyboardOptions } from './useKeyboard';

describe('useKeyboard Hook', () => {
  let callbacks: UseKeyboardOptions;

  beforeEach(() => {
    callbacks = {
      inputDigit: vi.fn(),
      inputDecimal: vi.fn(),
      setOperator: vi.fn(),
      calculate: vi.fn(),
      clearAll: vi.fn(),
      deleteLast: vi.fn(),
    };
  });

  const fireKey = (key: string) => {
    const event = new KeyboardEvent('keydown', { key, cancelable: true });
    window.dispatchEvent(event);
  };

  it('triggers inputDigit for numeric keys 0-9', () => {
    renderHook(() => useKeyboard(callbacks));

    for (let i = 0; i <= 9; i++) {
      fireKey(String(i));
      expect(callbacks.inputDigit).toHaveBeenCalledWith(String(i));
    }
  });

  it('triggers inputDecimal for dot key', () => {
    renderHook(() => useKeyboard(callbacks));

    fireKey('.');
    expect(callbacks.inputDecimal).toHaveBeenCalledTimes(1);
  });

  it('triggers setOperator for direct operator keys', () => {
    renderHook(() => useKeyboard(callbacks));

    fireKey('+');
    expect(callbacks.setOperator).toHaveBeenCalledWith('+');

    fireKey('-');
    expect(callbacks.setOperator).toHaveBeenCalledWith('-');

    fireKey('^');
    expect(callbacks.setOperator).toHaveBeenCalledWith('^');

    fireKey('%');
    expect(callbacks.setOperator).toHaveBeenCalledWith('%');
  });

  it('maps asterisk to multiplication operator', () => {
    renderHook(() => useKeyboard(callbacks));

    fireKey('*');
    expect(callbacks.setOperator).toHaveBeenCalledWith('×');
  });

  it('maps slash to division operator', () => {
    renderHook(() => useKeyboard(callbacks));

    fireKey('/');
    expect(callbacks.setOperator).toHaveBeenCalledWith('÷');
  });

  it('triggers calculate on Enter and Equals keys', () => {
    renderHook(() => useKeyboard(callbacks));

    fireKey('Enter');
    expect(callbacks.calculate).toHaveBeenCalledTimes(1);

    fireKey('=');
    expect(callbacks.calculate).toHaveBeenCalledTimes(2);
  });

  it('triggers clearAll on Escape, c, and C', () => {
    renderHook(() => useKeyboard(callbacks));

    fireKey('Escape');
    expect(callbacks.clearAll).toHaveBeenCalledTimes(1);

    fireKey('c');
    expect(callbacks.clearAll).toHaveBeenCalledTimes(2);

    fireKey('C');
    expect(callbacks.clearAll).toHaveBeenCalledTimes(3);
  });

  it('triggers deleteLast on Backspace', () => {
    renderHook(() => useKeyboard(callbacks));

    fireKey('Backspace');
    expect(callbacks.deleteLast).toHaveBeenCalledTimes(1);
  });

  it('silently ignores unmapped keys', () => {
    renderHook(() => useKeyboard(callbacks));

    fireKey('a');
    fireKey('Tab');
    fireKey('Shift');
    fireKey('ArrowUp');

    expect(callbacks.inputDigit).not.toHaveBeenCalled();
    expect(callbacks.inputDecimal).not.toHaveBeenCalled();
    expect(callbacks.setOperator).not.toHaveBeenCalled();
    expect(callbacks.calculate).not.toHaveBeenCalled();
    expect(callbacks.clearAll).not.toHaveBeenCalled();
    expect(callbacks.deleteLast).not.toHaveBeenCalled();
  });

  it('does not invoke callbacks when disabled is true', () => {
    renderHook(() => useKeyboard({ ...callbacks, disabled: true }));

    fireKey('5');
    fireKey('+');
    fireKey('Enter');

    expect(callbacks.inputDigit).not.toHaveBeenCalled();
    expect(callbacks.setOperator).not.toHaveBeenCalled();
    expect(callbacks.calculate).not.toHaveBeenCalled();
  });
});
