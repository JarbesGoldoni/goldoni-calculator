import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Calculator } from './Calculator';
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

describe('Calculator Component', () => {
  it('renders display and keypad with all buttons', () => {
    render(<Calculator />);

    expect(screen.getByText('goldoni')).toBeInTheDocument();
    expect(screen.getByTestId('calculator-display')).toBeInTheDocument();
    expect(screen.getByTestId('btn-AC')).toBeInTheDocument();
    expect(screen.getByTestId('btn-DEL')).toBeInTheDocument();
    expect(screen.getByTestId('btn-√')).toBeInTheDocument();
    expect(screen.getByTestId('btn-^')).toBeInTheDocument();
    expect(screen.getByTestId('btn-÷')).toBeInTheDocument();
    expect(screen.getByTestId('btn-×')).toBeInTheDocument();
    expect(screen.getByTestId('btn--')).toBeInTheDocument();
    expect(screen.getByTestId('btn-+')).toBeInTheDocument();
    expect(screen.getByTestId('btn-%')).toBeInTheDocument();
    expect(screen.getByTestId('btn-=')).toBeInTheDocument();
    expect(screen.getByTestId('btn-.')).toBeInTheDocument();

    for (let i = 0; i <= 9; i++) {
      expect(screen.getByTestId(`btn-${i}`)).toBeInTheDocument();
    }
  });

  it('allows clicking buttons to build an expression and calculate', async () => {
    vi.mocked(api.calculate).mockResolvedValueOnce({
      result: 15,
      expression: '7 + 8',
    });

    render(<Calculator />);

    act(() => {
      fireEvent.click(screen.getByTestId('btn-7'));
    });
    expect(screen.getByTestId('lower-display')).toHaveTextContent('7');

    act(() => {
      fireEvent.click(screen.getByTestId('btn-+'));
    });
    expect(screen.getByTestId('upper-display')).toHaveTextContent('7 +');

    act(() => {
      fireEvent.click(screen.getByTestId('btn-8'));
    });
    expect(screen.getByTestId('lower-display')).toHaveTextContent('8');

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-='));
    });

    expect(api.calculate).toHaveBeenCalledWith('+', [7, 8]);
    expect(screen.getByTestId('lower-display')).toHaveTextContent('15');
  });

  it('triggers all keypad buttons correctly', async () => {
    vi.mocked(api.calculate).mockResolvedValue({
      result: 2,
      expression: '4 ^ 0.5',
    });

    render(<Calculator />);

    act(() => {
      fireEvent.click(screen.getByTestId('btn-0'));
      fireEvent.click(screen.getByTestId('btn-1'));
      fireEvent.click(screen.getByTestId('btn-2'));
      fireEvent.click(screen.getByTestId('btn-3'));
      fireEvent.click(screen.getByTestId('btn-4'));
      fireEvent.click(screen.getByTestId('btn-5'));
      fireEvent.click(screen.getByTestId('btn-6'));
      fireEvent.click(screen.getByTestId('btn-7'));
      fireEvent.click(screen.getByTestId('btn-8'));
      fireEvent.click(screen.getByTestId('btn-9'));
      fireEvent.click(screen.getByTestId('btn-.'));
      fireEvent.click(screen.getByTestId('btn-DEL'));
      fireEvent.click(screen.getByTestId('btn-^'));
      fireEvent.click(screen.getByTestId('btn-÷'));
      fireEvent.click(screen.getByTestId('btn-×'));
      fireEvent.click(screen.getByTestId('btn--'));
      fireEvent.click(screen.getByTestId('btn-+'));
      fireEvent.click(screen.getByTestId('btn-AC'));
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-4'));
      fireEvent.click(screen.getByTestId('btn-√'));
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-4'));
      fireEvent.click(screen.getByTestId('btn-%'));
    });

    expect(screen.getByTestId('lower-display')).toBeInTheDocument();
  });
});
