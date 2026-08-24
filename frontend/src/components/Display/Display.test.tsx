import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Display } from './Display';

describe('Display Component', () => {
  it('renders upper and lower display values correctly', () => {
    render(<Display upperDisplay="1 + 2 = 3" lowerDisplay="3" />);

    const upper = screen.getByTestId('upper-display');
    const lower = screen.getByTestId('lower-display');

    expect(upper).toHaveTextContent('1 + 2 = 3');
    expect(lower).toHaveTextContent('3');
  });

  it('formats long decimal values to max 3 decimal digits with ellipsis', () => {
    render(
      <Display
        upperDisplay="89 ÷ 6 = 14.833333333333334"
        lowerDisplay="14.833333333333334"
      />
    );

    const upper = screen.getByTestId('upper-display');
    const lower = screen.getByTestId('lower-display');

    expect(upper).toHaveTextContent('89 ÷ 6 = 14.833...');
    expect(lower).toHaveTextContent('14.833...');
  });

  it('keeps exact decimals with 3 or fewer digits as-is without ellipsis', () => {
    render(<Display upperDisplay="0.5 + 1.25" lowerDisplay="1.75" />);

    const upper = screen.getByTestId('upper-display');
    const lower = screen.getByTestId('lower-display');

    expect(upper).toHaveTextContent('0.5 + 1.25');
    expect(lower).toHaveTextContent('1.75');
  });

  it('renders mathematical symbols properly', () => {
    render(<Display upperDisplay="8 × 4 ÷ 2" lowerDisplay="16" />);

    expect(screen.getByTestId('upper-display')).toHaveTextContent('8 × 4 ÷ 2');
    expect(screen.getByTestId('lower-display')).toHaveTextContent('16');
  });

  it('renders error state when isError is true', () => {
    render(
      <Display
        upperDisplay="10 ÷ 0"
        lowerDisplay="Error"
        isError={true}
        error="division by zero"
      />
    );

    const lower = screen.getByTestId('lower-display');
    expect(lower).toHaveTextContent('division by zero');
    expect(lower).toHaveClass('display-error');
  });

  it('renders default lowerDisplay when isError is true without error message', () => {
    render(
      <Display
        upperDisplay="10 ÷ 0"
        lowerDisplay="Error"
        isError={true}
        error={null}
      />
    );

    const lower = screen.getByTestId('lower-display');
    expect(lower).toHaveTextContent('Error');
    expect(lower).toHaveClass('display-error');
  });

  it('has accessible roles and aria labels', () => {
    render(<Display upperDisplay="5 +" lowerDisplay="5" />);

    expect(screen.getByLabelText('Previous expression')).toHaveTextContent('5 +');
    expect(screen.getByLabelText('Current value')).toHaveTextContent('5');
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
