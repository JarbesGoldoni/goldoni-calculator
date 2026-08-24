import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders numeric button variant with correct label and class', () => {
    const handleClick = vi.fn();
    render(<Button label="7" variant="numeric" onClick={handleClick} />);

    const button = screen.getByRole('button', { name: '7' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('calc-btn', 'calc-btn-numeric');

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders operator button variant with correct styling', () => {
    const handleClick = vi.fn();
    render(<Button label="+" variant="operator" onClick={handleClick} />);

    const button = screen.getByRole('button', { name: '+' });
    expect(button).toHaveClass('calc-btn', 'calc-btn-operator');

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders decimal button variant', () => {
    const handleClick = vi.fn();
    render(<Button label="." variant="decimal" onClick={handleClick} />);

    const button = screen.getByRole('button', { name: '.' });
    expect(button).toHaveClass('calc-btn', 'calc-btn-decimal');
  });

  it('renders control button variant', () => {
    const handleClick = vi.fn();
    render(<Button label="AC" variant="control" onClick={handleClick} />);

    const button = screen.getByRole('button', { name: 'AC' });
    expect(button).toHaveClass('calc-btn', 'calc-btn-control');
  });

  it('renders action button variant with custom className', () => {
    const handleClick = vi.fn();
    render(
      <Button
        label="="
        variant="action"
        className="calc-btn-equals"
        onClick={handleClick}
      />
    );

    const button = screen.getByRole('button', { name: '=' });
    expect(button).toHaveClass('calc-btn', 'calc-btn-action', 'calc-btn-equals');
  });

  it('respects disabled state and does not trigger onClick', () => {
    const handleClick = vi.fn();
    render(
      <Button label="+" variant="operator" onClick={handleClick} disabled={true} />
    );

    const button = screen.getByRole('button', { name: '+' });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('supports custom aria-label', () => {
    render(
      <Button
        label="DEL"
        variant="control"
        onClick={vi.fn()}
        ariaLabel="Delete last digit"
      />
    );

    expect(screen.getByLabelText('Delete last digit')).toBeInTheDocument();
  });
});
