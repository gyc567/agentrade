import { render, screen } from '@testing-library/react';
import { CreditsValue } from '../CreditsValue';

describe('CreditsValue', () => {
  describe('number format (default)', () => {
    it('should render value as complete number by default', () => {
      render(<CreditsValue value={750} />);

      const valueElement = screen.getByTestId('credits-value');
      expect(valueElement).toHaveTextContent('750');
    });

    it('should render single digit numbers', () => {
      render(<CreditsValue value={5} />);

      const valueElement = screen.getByTestId('credits-value');
      expect(valueElement).toHaveTextContent('5');
    });

    it('should render zero', () => {
      render(<CreditsValue value={0} />);

      const valueElement = screen.getByTestId('credits-value');
      expect(valueElement).toHaveTextContent('0');
    });

    it('should render large numbers without abbreviation', () => {
      render(<CreditsValue value={9999999} />);

      const valueElement = screen.getByTestId('credits-value');
      expect(valueElement).toHaveTextContent('9999999');
    });

    it('should explicitly handle format="number"', () => {
      render(<CreditsValue value={1000} format="number" />);

      const valueElement = screen.getByTestId('credits-value');
      expect(valueElement).toHaveTextContent('1000');
    });
  });

  describe('short format', () => {
    it('should abbreviate thousands to k', () => {
      render(<CreditsValue value={1000} format="short" />);

      const valueElement = screen.getByTestId('credits-value');
      expect(valueElement).toHaveTextContent('1k');
    });

    it('should abbreviate 1500 to 1.5k', () => {
      render(<CreditsValue value={1500} format="short" />);

      const valueElement = screen.getByTestId('credits-value');
      expect(valueElement).toHaveTextContent('1.5k');
    });

    it('should abbreviate 2200 to 2.2k', () => {
      render(<CreditsValue value={2200} format="short" />);

      const valueElement = screen.getByTestId('credits-value');
      expect(valueElement).toHaveTextContent('2.2k');
    });

    it('should remove decimal when it is .0 in short format', () => {
      render(<CreditsValue value={5000} format="short" />);

      const valueElement = screen.getByTestId('credits-value');
      expect(valueElement).toHaveTextContent('5k');
      expect(valueElement).not.toHaveTextContent('5.0k');
    });

    it('should abbreviate millions to M', () => {
      render(<CreditsValue value={1000000} format="short" />);

      const valueElement = screen.getByTestId('credits-value');
      expect(valueElement).toHaveTextContent('1M');
    });

    it('should abbreviate 1500000 to 1.5M', () => {
      render(<CreditsValue value={1500000} format="short" />);

      const valueElement = screen.getByTestId('credits-value');
      expect(valueElement).toHaveTextContent('1.5M');
    });

    it('should abbreviate 2200000 to 2.2M', () => {
      render(<CreditsValue value={2200000} format="short" />);

      const valueElement = screen.getByTestId('credits-value');
      expect(valueElement).toHaveTextContent('2.2M');
    });

    it('should remove decimal when it is .0 in million format', () => {
      render(<CreditsValue value={5000000} format="short" />);

      const valueElement = screen.getByTestId('credits-value');
      expect(valueElement).toHaveTextContent('5M');
      expect(valueElement).not.toHaveTextContent('5.0M');
    });

    it('should not abbreviate numbers less than 1000', () => {
      render(<CreditsValue value={999} format="short" />);

      const valueElement = screen.getByTestId('credits-value');
      expect(valueElement).toHaveTextContent('999');
    });

    it('should handle zero in short format', () => {
      render(<CreditsValue value={0} format="short" />);

      const valueElement = screen.getByTestId('credits-value');
      expect(valueElement).toHaveTextContent('0');
    });

    it('should handle very large numbers in short format', () => {
      render(<CreditsValue value={9999999999} format="short" />);

      const valueElement = screen.getByTestId('credits-value');
      expect(valueElement).toHaveTextContent('10000M');
    });
  });

  describe('HTML element structure', () => {
    it('should render span element', () => {
      render(<CreditsValue value={750} />);

      const valueElement = screen.getByTestId('credits-value');
      expect(valueElement.tagName).toBe('SPAN');
    });

    it('should have correct CSS class', () => {
      render(<CreditsValue value={750} />);

      const valueElement = screen.getByTestId('credits-value');
      expect(valueElement).toHaveClass('credits-value');
    });
  });

  describe('data attributes', () => {
    it('should have data-testid attribute', () => {
      render(<CreditsValue value={750} />);

      const valueElement = screen.getByTestId('credits-value');
      expect(valueElement).toHaveAttribute('data-testid', 'credits-value');
    });

    it('should have data-value attribute with numeric value', () => {
      render(<CreditsValue value={750} />);

      const valueElement = screen.getByTestId('credits-value');
      expect(valueElement).toHaveAttribute('data-value', '750');
    });

    it('should update data-value when value prop changes', () => {
      const { rerender } = render(<CreditsValue value={100} />);

      let valueElement = screen.getByTestId('credits-value');
      expect(valueElement).toHaveAttribute('data-value', '100');

      rerender(<CreditsValue value={200} />);

      valueElement = screen.getByTestId('credits-value');
      expect(valueElement).toHaveAttribute('data-value', '200');
    });

    it('should preserve data-value in short format', () => {
      render(<CreditsValue value={1500} format="short" />);

      const valueElement = screen.getByTestId('credits-value');
      expect(valueElement).toHaveAttribute('data-value', '1500');
      expect(valueElement).toHaveTextContent('1.5k');
    });
  });

  describe('prop changes', () => {
    it('should update display when value prop changes', () => {
      const { rerender } = render(<CreditsValue value={100} />);

      expect(screen.getByTestId('credits-value')).toHaveTextContent('100');

      rerender(<CreditsValue value={200} />);

      expect(screen.getByTestId('credits-value')).toHaveTextContent('200');
    });

    it('should update display when format prop changes', () => {
      const { rerender } = render(<CreditsValue value={1000} format="number" />);

      expect(screen.getByTestId('credits-value')).toHaveTextContent('1000');

      rerender(<CreditsValue value={1000} format="short" />);

      expect(screen.getByTestId('credits-value')).toHaveTextContent('1k');
    });

    it('should handle switching between number and short formats', () => {
      const { rerender } = render(<CreditsValue value={5500} format="short" />);

      expect(screen.getByTestId('credits-value')).toHaveTextContent('5.5k');

      rerender(<CreditsValue value={5500} format="number" />);

      expect(screen.getByTestId('credits-value')).toHaveTextContent('5500');
    });
  });

  describe('edge cases', () => {
    it('should handle boundary value 999', () => {
      render(<CreditsValue value={999} format="short" />);

      const valueElement = screen.getByTestId('credits-value');
      expect(valueElement).toHaveTextContent('999');
    });

    it('should handle boundary value 1000', () => {
      render(<CreditsValue value={1000} format="short" />);

      const valueElement = screen.getByTestId('credits-value');
      expect(valueElement).toHaveTextContent('1k');
    });

    it('should handle boundary value 999999', () => {
      render(<CreditsValue value={999999} format="short" />);

      const valueElement = screen.getByTestId('credits-value');
      expect(valueElement).toHaveTextContent('1000k');
    });

    it('should handle boundary value 1000000', () => {
      render(<CreditsValue value={1000000} format="short" />);

      const valueElement = screen.getByTestId('credits-value');
      expect(valueElement).toHaveTextContent('1M');
    });
  });

  describe('rendering consistency', () => {
    it('should render consistently across multiple renders', () => {
      const { rerender } = render(<CreditsValue value={750} />);

      expect(screen.getByTestId('credits-value')).toHaveTextContent('750');

      rerender(<CreditsValue value={750} />);

      expect(screen.getByTestId('credits-value')).toHaveTextContent('750');
    });

    it('should handle rapid format changes', () => {
      const { rerender } = render(<CreditsValue value={1500} format="short" />);

      expect(screen.getByTestId('credits-value')).toHaveTextContent('1.5k');

      rerender(<CreditsValue value={1500} format="number" />);
      expect(screen.getByTestId('credits-value')).toHaveTextContent('1500');

      rerender(<CreditsValue value={1500} format="short" />);
      expect(screen.getByTestId('credits-value')).toHaveTextContent('1.5k');
    });
  });
});
