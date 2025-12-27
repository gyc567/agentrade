import { render, screen } from '@testing-library/react';
import { CreditsIcon } from '../CreditsIcon';

describe('CreditsIcon', () => {
  describe('rendering', () => {
    it('should render the icon element', () => {
      render(<CreditsIcon />);

      const iconElement = screen.getByTestId('credits-icon');
      expect(iconElement).toBeInTheDocument();
    });

    it('should render star emoji icon', () => {
      render(<CreditsIcon />);

      const iconElement = screen.getByTestId('credits-icon');
      expect(iconElement).toHaveTextContent('⭐');
    });

    it('should have correct element type', () => {
      render(<CreditsIcon />);

      const iconElement = screen.getByTestId('credits-icon');
      expect(iconElement.tagName).toBe('SPAN');
    });
  });

  describe('accessibility', () => {
    it('should have role attribute set to img', () => {
      render(<CreditsIcon />);

      const iconElement = screen.getByTestId('credits-icon');
      expect(iconElement).toHaveAttribute('role', 'img');
    });

    it('should have aria-label attribute', () => {
      render(<CreditsIcon />);

      const iconElement = screen.getByTestId('credits-icon');
      expect(iconElement).toHaveAttribute('aria-label', 'credits');
    });

    it('should have title attribute for tooltip', () => {
      render(<CreditsIcon />);

      const iconElement = screen.getByTestId('credits-icon');
      expect(iconElement).toHaveAttribute('title', 'User Credits');
    });

    it('should be accessible by role and label query', () => {
      render(<CreditsIcon />);

      const iconElement = screen.getByRole('img', { name: 'credits' });
      expect(iconElement).toBeInTheDocument();
    });
  });

  describe('CSS class', () => {
    it('should have credits-icon class', () => {
      render(<CreditsIcon />);

      const iconElement = screen.getByTestId('credits-icon');
      expect(iconElement).toHaveClass('credits-icon');
    });
  });

  describe('data attributes', () => {
    it('should have data-testid attribute', () => {
      render(<CreditsIcon />);

      const iconElement = screen.getByTestId('credits-icon');
      expect(iconElement).toHaveAttribute('data-testid', 'credits-icon');
    });
  });

  describe('multiple renders', () => {
    it('should consistently render the same icon', () => {
      const { rerender } = render(<CreditsIcon />);

      expect(screen.getByTestId('credits-icon')).toHaveTextContent('⭐');

      rerender(<CreditsIcon />);
      expect(screen.getByTestId('credits-icon')).toHaveTextContent('⭐');
    });

    it('should not have side effects on multiple renders', () => {
      const { rerender } = render(<CreditsIcon />);

      const firstRender = screen.getByTestId('credits-icon');
      const firstHTML = firstRender.innerHTML;

      rerender(<CreditsIcon />);

      const secondRender = screen.getByTestId('credits-icon');
      const secondHTML = secondRender.innerHTML;

      expect(firstHTML).toBe(secondHTML);
    });
  });

  describe('pure component behavior', () => {
    it('should be a pure stateless component', () => {
      const { rerender } = render(<CreditsIcon />);

      const firstContent = screen.getByTestId('credits-icon').textContent;

      rerender(<CreditsIcon />);

      const secondContent = screen.getByTestId('credits-icon').textContent;

      expect(firstContent).toBe(secondContent);
    });
  });
});
