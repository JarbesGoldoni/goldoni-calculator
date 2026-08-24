import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCalculator } from './useCalculator';
import * as api from '../api/calculator';

vi.mock('../api/calculator', () => ({
  calculate: vi.fn(),
  ENDPOINT_MAP: {
    '+': '/api/add',
    '-': '/api/subtract',
    '×': '/api/multiply',
    '÷': '/api/divide',
    '^': '/api/power',
    '√': '/api/sqrt',
    '%': '/api/percentage',
  },
}));

describe('useCalculator Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Scenario 1: Basic operation (5 + 3 = 8)', async () => {
    vi.mocked(api.calculate).mockResolvedValueOnce({
      result: 8,
      expression: '5 + 3',
    });

    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('5');
    });
    expect(result.current.lowerDisplay).toBe('5');
    expect(result.current.state).toBe('FIRST_OPERAND');

    act(() => {
      result.current.setOperator('+');
    });
    expect(result.current.upperDisplay).toBe('5 +');
    expect(result.current.state).toBe('WAIT_SECOND');

    act(() => {
      result.current.inputDigit('3');
    });
    expect(result.current.lowerDisplay).toBe('3');
    expect(result.current.state).toBe('SECOND_OPERAND');

    await act(async () => {
      await result.current.calculate();
    });

    expect(api.calculate).toHaveBeenCalledWith('+', [5, 3]);
    expect(result.current.lowerDisplay).toBe('8');
    expect(result.current.upperDisplay).toBe('5 + 3 = 8');
    expect(result.current.state).toBe('RESULT');
  });

  it('Scenario 2: Operator chaining (5 + 3 × 4 = 32)', async () => {
    vi.mocked(api.calculate)
      .mockResolvedValueOnce({ result: 8, expression: '5 + 3' })
      .mockResolvedValueOnce({ result: 32, expression: '8 * 4' });

    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('5');
    });
    act(() => {
      result.current.setOperator('+');
    });
    act(() => {
      result.current.inputDigit('3');
    });

    await act(async () => {
      await result.current.setOperator('×');
    });

    expect(api.calculate).toHaveBeenCalledWith('+', [5, 3]);
    expect(result.current.lowerDisplay).toBe('8');
    expect(result.current.upperDisplay).toBe('8 ×');
    expect(result.current.state).toBe('WAIT_SECOND');

    act(() => {
      result.current.inputDigit('4');
    });
    expect(result.current.lowerDisplay).toBe('4');
    expect(result.current.state).toBe('SECOND_OPERAND');

    await act(async () => {
      await result.current.calculate();
    });

    expect(api.calculate).toHaveBeenCalledWith('×', [8, 4]);
    expect(result.current.lowerDisplay).toBe('32');
    expect(result.current.upperDisplay).toBe('8 × 4 = 32');
    expect(result.current.state).toBe('RESULT');
  });

  it('Scenario 3: Operator replacement (5 + × 4 = 20)', async () => {
    vi.mocked(api.calculate).mockResolvedValueOnce({
      result: 20,
      expression: '5 * 4',
    });

    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('5');
    });
    act(() => {
      result.current.setOperator('+');
    });
    expect(result.current.upperDisplay).toBe('5 +');

    act(() => {
      result.current.setOperator('×');
    });
    expect(result.current.upperDisplay).toBe('5 ×');
    expect(result.current.state).toBe('WAIT_SECOND');

    act(() => {
      result.current.inputDigit('4');
    });
    expect(result.current.lowerDisplay).toBe('4');
    expect(result.current.state).toBe('SECOND_OPERAND');

    await act(async () => {
      await result.current.calculate();
    });

    expect(api.calculate).toHaveBeenCalledWith('×', [5, 4]);
    expect(result.current.lowerDisplay).toBe('20');
    expect(result.current.upperDisplay).toBe('5 × 4 = 20');
    expect(result.current.state).toBe('RESULT');
  });

  it('Scenario 4: Unary operations (25 √ -> 5 and 15 % -> 0.15)', async () => {
    vi.mocked(api.calculate)
      .mockResolvedValueOnce({ result: 5, expression: 'sqrt(25)' })
      .mockResolvedValueOnce({ result: 0.15, expression: '15%' });

    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('2');
      result.current.inputDigit('5');
    });

    await act(async () => {
      await result.current.setOperator('√');
    });

    expect(api.calculate).toHaveBeenCalledWith('√', [25]);
    expect(result.current.lowerDisplay).toBe('5');
    expect(result.current.upperDisplay).toBe('sqrt(25) = 5');
    expect(result.current.state).toBe('RESULT');

    act(() => {
      result.current.inputDigit('1');
      result.current.inputDigit('5');
    });
    expect(result.current.lowerDisplay).toBe('15');
    expect(result.current.upperDisplay).toBe('');
    expect(result.current.state).toBe('FIRST_OPERAND');

    await act(async () => {
      await result.current.setOperator('%');
    });

    expect(api.calculate).toHaveBeenCalledWith('%', [15]);
    expect(result.current.lowerDisplay).toBe('0.15');
    expect(result.current.upperDisplay).toBe('15% = 0.15');
    expect(result.current.state).toBe('RESULT');
  });

  it('Scenario 5: Result then operator (5 + 3 = 8, then × 2 = 16)', async () => {
    vi.mocked(api.calculate)
      .mockResolvedValueOnce({ result: 8, expression: '5 + 3' })
      .mockResolvedValueOnce({ result: 16, expression: '8 * 2' });

    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('5');
      result.current.setOperator('+');
      result.current.inputDigit('3');
    });

    await act(async () => {
      await result.current.calculate();
    });
    expect(result.current.lowerDisplay).toBe('8');

    act(() => {
      result.current.setOperator('×');
    });
    expect(result.current.upperDisplay).toBe('8 ×');
    expect(result.current.state).toBe('WAIT_SECOND');

    act(() => {
      result.current.inputDigit('2');
    });
    expect(result.current.lowerDisplay).toBe('2');
    expect(result.current.state).toBe('SECOND_OPERAND');

    await act(async () => {
      await result.current.calculate();
    });

    expect(api.calculate).toHaveBeenLastCalledWith('×', [8, 2]);
    expect(result.current.lowerDisplay).toBe('16');
    expect(result.current.upperDisplay).toBe('8 × 2 = 16');
    expect(result.current.state).toBe('RESULT');
  });

  it('Scenario 6: Result then digit (fresh start)', async () => {
    vi.mocked(api.calculate).mockResolvedValueOnce({
      result: 8,
      expression: '5 + 3',
    });

    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('5');
      result.current.setOperator('+');
      result.current.inputDigit('3');
    });

    await act(async () => {
      await result.current.calculate();
    });
    expect(result.current.lowerDisplay).toBe('8');
    expect(result.current.state).toBe('RESULT');

    act(() => {
      result.current.inputDigit('9');
    });

    expect(result.current.lowerDisplay).toBe('9');
    expect(result.current.upperDisplay).toBe('');
    expect(result.current.state).toBe('FIRST_OPERAND');
  });

  it('Scenario 7: Decimal input validation (.5 + 1.2.3 = 1.73)', async () => {
    vi.mocked(api.calculate).mockResolvedValueOnce({
      result: 1.73,
      expression: '0.5 + 1.23',
    });

    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDecimal();
    });
    expect(result.current.lowerDisplay).toBe('0.');

    act(() => {
      result.current.inputDigit('5');
    });
    expect(result.current.lowerDisplay).toBe('0.5');

    act(() => {
      result.current.setOperator('+');
    });
    expect(result.current.upperDisplay).toBe('0.5 +');

    act(() => {
      result.current.inputDigit('1');
      result.current.inputDecimal();
      result.current.inputDigit('2');
      result.current.inputDecimal();
      result.current.inputDigit('3');
    });
    expect(result.current.lowerDisplay).toBe('1.23');

    await act(async () => {
      await result.current.calculate();
    });

    expect(api.calculate).toHaveBeenCalledWith('+', [0.5, 1.23]);
    expect(result.current.lowerDisplay).toBe('1.73');
  });

  it('Scenario 8: Backspace behavior (123 -> 12 -> 0)', () => {
    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('1');
      result.current.inputDigit('2');
      result.current.inputDigit('3');
    });
    expect(result.current.lowerDisplay).toBe('123');
    expect(result.current.state).toBe('FIRST_OPERAND');

    act(() => {
      result.current.deleteLast();
    });
    expect(result.current.lowerDisplay).toBe('12');
    expect(result.current.state).toBe('FIRST_OPERAND');

    act(() => {
      result.current.deleteLast();
    });
    expect(result.current.lowerDisplay).toBe('1');
    expect(result.current.state).toBe('FIRST_OPERAND');

    act(() => {
      result.current.deleteLast();
    });
    expect(result.current.lowerDisplay).toBe('0');
    expect(result.current.state).toBe('IDLE');
  });

  it('Scenario 9: Error recovery (5 ÷ 0 = -> error -> AC -> idle)', async () => {
    vi.mocked(api.calculate).mockRejectedValueOnce(
      new Error('division by zero')
    );

    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('5');
      result.current.setOperator('÷');
      result.current.inputDigit('0');
    });

    await act(async () => {
      await result.current.calculate();
    });

    expect(result.current.state).toBe('ERROR');
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe('division by zero');
    expect(result.current.lowerDisplay).toBe('Error');

    act(() => {
      result.current.inputDigit('5');
      result.current.inputDecimal();
      result.current.deleteLast();
      result.current.setOperator('+');
    });
    expect(result.current.lowerDisplay).toBe('Error');

    await act(async () => {
      await result.current.calculate();
    });
    expect(result.current.lowerDisplay).toBe('Error');

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.state).toBe('IDLE');
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.lowerDisplay).toBe('0');
    expect(result.current.upperDisplay).toBe('');
  });

  it('Scenario 10: AC during expression (5 + -> AC -> idle)', () => {
    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('5');
      result.current.setOperator('+');
    });
    expect(result.current.upperDisplay).toBe('5 +');
    expect(result.current.state).toBe('WAIT_SECOND');

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.state).toBe('IDLE');
    expect(result.current.lowerDisplay).toBe('0');
    expect(result.current.upperDisplay).toBe('');
  });

  it('handles unary operator in WAIT_SECOND state', async () => {
    vi.mocked(api.calculate).mockResolvedValueOnce({
      result: 5,
      expression: 'sqrt(25)',
    });

    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('2');
      result.current.inputDigit('5');
      result.current.setOperator('+');
    });
    expect(result.current.state).toBe('WAIT_SECOND');

    await act(async () => {
      await result.current.setOperator('√');
    });

    expect(api.calculate).toHaveBeenCalledWith('√', [25]);
    expect(result.current.upperDisplay).toBe('5 +');
    expect(result.current.lowerDisplay).toBe('5');
    expect(result.current.state).toBe('WAIT_SECOND');
  });

  it('handles unary operator error in WAIT_SECOND state', async () => {
    vi.mocked(api.calculate).mockRejectedValueOnce(
      new Error('square root of negative number')
    );

    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('2');
      result.current.setOperator('+');
    });

    await act(async () => {
      await result.current.setOperator('√');
    });

    expect(result.current.state).toBe('ERROR');
    expect(result.current.lowerDisplay).toBe('Error');
  });

  it('handles unary operator in SECOND_OPERAND state', async () => {
    vi.mocked(api.calculate).mockResolvedValueOnce({
      result: 4,
      expression: 'sqrt(16)',
    });

    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('5');
      result.current.setOperator('+');
      result.current.inputDigit('1');
      result.current.inputDigit('6');
    });
    expect(result.current.state).toBe('SECOND_OPERAND');

    await act(async () => {
      await result.current.setOperator('√');
    });

    expect(api.calculate).toHaveBeenCalledWith('√', [16]);
    expect(result.current.lowerDisplay).toBe('4');
    expect(result.current.state).toBe('SECOND_OPERAND');
  });

  it('handles unary operator error in SECOND_OPERAND state', async () => {
    vi.mocked(api.calculate).mockRejectedValueOnce(
      new Error('negative sqrt')
    );

    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('5');
      result.current.setOperator('+');
      result.current.inputDigit('4');
    });

    await act(async () => {
      await result.current.setOperator('√');
    });

    expect(result.current.state).toBe('ERROR');
    expect(result.current.lowerDisplay).toBe('Error');
  });

  it('handles unary operator in RESULT state', async () => {
    vi.mocked(api.calculate)
      .mockResolvedValueOnce({ result: 25, expression: '20 + 5' })
      .mockResolvedValueOnce({ result: 5, expression: 'sqrt(25)' });

    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('2');
      result.current.inputDigit('0');
      result.current.setOperator('+');
      result.current.inputDigit('5');
    });

    await act(async () => {
      await result.current.calculate();
    });

    expect(result.current.state).toBe('RESULT');
    expect(result.current.lowerDisplay).toBe('25');

    await act(async () => {
      await result.current.setOperator('√');
    });

    expect(api.calculate).toHaveBeenLastCalledWith('√', [25]);
    expect(result.current.lowerDisplay).toBe('5');
    expect(result.current.upperDisplay).toBe('sqrt(25) = 5');
    expect(result.current.state).toBe('RESULT');
  });

  it('handles backspace in SECOND_OPERAND state', () => {
    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('5');
      result.current.setOperator('+');
      result.current.inputDigit('1');
      result.current.inputDigit('2');
    });

    expect(result.current.lowerDisplay).toBe('12');

    act(() => {
      result.current.deleteLast();
    });
    expect(result.current.lowerDisplay).toBe('1');
    expect(result.current.state).toBe('SECOND_OPERAND');

    act(() => {
      result.current.deleteLast();
    });
    expect(result.current.lowerDisplay).toBe('0');
    expect(result.current.state).toBe('SECOND_OPERAND');
  });

  it('handles backspace in IDLE and WAIT_SECOND state without mutation', () => {
    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.deleteLast();
    });
    expect(result.current.lowerDisplay).toBe('0');

    act(() => {
      result.current.inputDigit('5');
      result.current.setOperator('+');
      result.current.deleteLast();
    });
    expect(result.current.lowerDisplay).toBe('5');
    expect(result.current.state).toBe('WAIT_SECOND');
  });

  it('handles decimal input in RESULT state', () => {
    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('5');
      result.current.setOperator('+');
      result.current.inputDigit('5');
    });

    act(() => {
      result.current.inputDecimal();
    });
    expect(result.current.lowerDisplay).toBe('5.');

    act(() => {
      result.current.inputDecimal();
    });
    expect(result.current.lowerDisplay).toBe('5.');
  });

  it('handles consecutive 0 digits in FIRST_OPERAND and SECOND_OPERAND', () => {
    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('0');
      result.current.inputDigit('0');
    });
    expect(result.current.lowerDisplay).toBe('0');

    act(() => {
      result.current.inputDigit('7');
    });
    expect(result.current.lowerDisplay).toBe('7');

    act(() => {
      result.current.setOperator('+');
      result.current.inputDigit('0');
      result.current.inputDigit('0');
    });
    expect(result.current.lowerDisplay).toBe('0');

    act(() => {
      result.current.inputDigit('9');
    });
    expect(result.current.lowerDisplay).toBe('9');
  });

  it('handles calculate in non-SECOND_OPERAND states as no-op', async () => {
    const { result } = renderHook(() => useCalculator());

    await act(async () => {
      await result.current.calculate();
    });
    expect(api.calculate).not.toHaveBeenCalled();

    act(() => {
      result.current.inputDigit('5');
    });
    await act(async () => {
      await result.current.calculate();
    });
    expect(api.calculate).not.toHaveBeenCalled();
  });

  it('handles error in chained binary operations', async () => {
    vi.mocked(api.calculate).mockRejectedValueOnce(
      new Error('result overflow')
    );

    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('5');
      result.current.setOperator('+');
      result.current.inputDigit('3');
    });

    await act(async () => {
      await result.current.setOperator('×');
    });

    expect(result.current.state).toBe('ERROR');
    expect(result.current.error).toBe('result overflow');
    expect(result.current.lowerDisplay).toBe('Error');
  });

  it('handles error in unary operations', async () => {
    vi.mocked(api.calculate).mockRejectedValueOnce(
      new Error('square root of negative number')
    );

    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('4');
    });

    await act(async () => {
      await result.current.setOperator('√');
    });

    expect(result.current.state).toBe('ERROR');
    expect(result.current.error).toBe('square root of negative number');
    expect(result.current.lowerDisplay).toBe('Error');
  });

  it('handles decimal input in RESULT state starting fresh operand', async () => {
    vi.mocked(api.calculate).mockResolvedValueOnce({
      result: 42,
      expression: '40 + 2',
    });

    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('4');
      result.current.inputDigit('0');
      result.current.setOperator('+');
      result.current.inputDigit('2');
    });

    await act(async () => {
      await result.current.calculate();
    });

    expect(result.current.state).toBe('RESULT');

    act(() => {
      result.current.inputDecimal();
    });

    expect(result.current.state).toBe('FIRST_OPERAND');
    expect(result.current.lowerDisplay).toBe('0.');
    expect(result.current.upperDisplay).toBe('');
  });
});
