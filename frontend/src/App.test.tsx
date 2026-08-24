import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App Component', () => {
  it('renders calculator container and brand', () => {
    render(<App />);

    expect(screen.getByTestId('calculator')).toBeInTheDocument();
    expect(screen.getByText('goldoni')).toBeInTheDocument();
  });
});
