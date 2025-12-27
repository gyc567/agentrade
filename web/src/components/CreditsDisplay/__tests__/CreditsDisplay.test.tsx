import { renderHook, waitFor } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import { CreditsDisplay } from '../CreditsDisplay';
import * as useUserCreditsHook from '../../../hooks/useUserCredits';

// Mock the useUserCredits hook
vi.mock('../../../hooks/useUserCredits', () => ({
  useUserCredits: vi.fn(),
}));

describe('CreditsDisplay', () => {
  const mockCredits = {
    total: 1000,
    available: 750,
    used: 250,
    lastUpdated: '2025-12-27T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('should render loading skeleton when credits are loading', () => {
      vi.mocked(useUserCreditsHook.useUserCredits).mockReturnValue({
        credits: null,
        loading: true,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<CreditsDisplay />);

      const loadingElement = screen.getByTestId('credits-loading');
      expect(loadingElement).toBeInTheDocument();
      expect(loadingElement).toHaveClass('credits-loading');
    });

    it('should have proper attributes on loading element', () => {
      vi.mocked(useUserCreditsHook.useUserCredits).mockReturnValue({
        credits: null,
        loading: true,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<CreditsDisplay />);

      const loadingElement = screen.getByTestId('credits-loading');
      expect(loadingElement).toBeTruthy();
    });
  });

  describe('error state', () => {
    it('should render error state when error occurs', () => {
      vi.mocked(useUserCreditsHook.useUserCredits).mockReturnValue({
        credits: null,
        loading: false,
        error: new Error('Failed to fetch credits'),
        refetch: vi.fn(),
      } as any);

      render(<CreditsDisplay />);

      const errorElement = screen.getByTestId('credits-error');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveTextContent('-');
    });

    it('should render error state when credits is null', () => {
      vi.mocked(useUserCreditsHook.useUserCredits).mockReturnValue({
        credits: null,
        loading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<CreditsDisplay />);

      const errorElement = screen.getByTestId('credits-error');
      expect(errorElement).toBeInTheDocument();
    });

    it('should have title attribute on error element', () => {
      vi.mocked(useUserCreditsHook.useUserCredits).mockReturnValue({
        credits: null,
        loading: false,
        error: new Error('Network error'),
        refetch: vi.fn(),
      } as any);

      render(<CreditsDisplay />);

      const errorElement = screen.getByTestId('credits-error');
      expect(errorElement).toHaveAttribute('title', 'Failed to load credits');
    });
  });

  describe('success state', () => {
    it('should render credits display when data is available', () => {
      vi.mocked(useUserCreditsHook.useUserCredits).mockReturnValue({
        credits: mockCredits,
        loading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<CreditsDisplay />);

      const displayElement = screen.getByTestId('credits-display');
      expect(displayElement).toBeInTheDocument();
    });

    it('should render icon and value components', () => {
      vi.mocked(useUserCreditsHook.useUserCredits).mockReturnValue({
        credits: mockCredits,
        loading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<CreditsDisplay />);

      const iconElement = screen.getByTestId('credits-icon');
      const valueElement = screen.getByTestId('credits-value');

      expect(iconElement).toBeInTheDocument();
      expect(valueElement).toBeInTheDocument();
    });

    it('should pass available credits to CreditsValue component', () => {
      vi.mocked(useUserCreditsHook.useUserCredits).mockReturnValue({
        credits: mockCredits,
        loading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<CreditsDisplay />);

      const valueElement = screen.getByTestId('credits-value');
      expect(valueElement).toHaveTextContent('750');
      expect(valueElement).toHaveAttribute('data-value', '750');
    });

    it('should have correct CSS classes on display element', () => {
      vi.mocked(useUserCreditsHook.useUserCredits).mockReturnValue({
        credits: mockCredits,
        loading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<CreditsDisplay />);

      const displayElement = screen.getByTestId('credits-display');
      expect(displayElement).toHaveClass('credits-display');
    });

    it('should have correct aria attributes', () => {
      vi.mocked(useUserCreditsHook.useUserCredits).mockReturnValue({
        credits: mockCredits,
        loading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<CreditsDisplay />);

      const displayElement = screen.getByTestId('credits-display');
      expect(displayElement).toHaveAttribute('role', 'status');
      expect(displayElement).toHaveAttribute('aria-live', 'polite');
      expect(displayElement).toHaveAttribute('aria-label', 'Available credits: 750');
    });

    it('should accept and apply custom className', () => {
      vi.mocked(useUserCreditsHook.useUserCredits).mockReturnValue({
        credits: mockCredits,
        loading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<CreditsDisplay className="custom-class" />);

      const displayElement = screen.getByTestId('credits-display');
      expect(displayElement).toHaveClass('credits-display');
      expect(displayElement).toHaveClass('custom-class');
    });
  });

  describe('state transitions', () => {
    it('should transition from loading to success', () => {
      const { rerender } = render(<CreditsDisplay />);

      vi.mocked(useUserCreditsHook.useUserCredits).mockReturnValue({
        credits: null,
        loading: true,
        error: null,
        refetch: vi.fn(),
      } as any);

      rerender(<CreditsDisplay />);
      expect(screen.getByTestId('credits-loading')).toBeInTheDocument();

      vi.mocked(useUserCreditsHook.useUserCredits).mockReturnValue({
        credits: mockCredits,
        loading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      rerender(<CreditsDisplay />);
      expect(screen.getByTestId('credits-display')).toBeInTheDocument();
      expect(screen.queryByTestId('credits-loading')).not.toBeInTheDocument();
    });

    it('should transition from loading to error', () => {
      const { rerender } = render(<CreditsDisplay />);

      vi.mocked(useUserCreditsHook.useUserCredits).mockReturnValue({
        credits: null,
        loading: true,
        error: null,
        refetch: vi.fn(),
      } as any);

      rerender(<CreditsDisplay />);
      expect(screen.getByTestId('credits-loading')).toBeInTheDocument();

      vi.mocked(useUserCreditsHook.useUserCredits).mockReturnValue({
        credits: null,
        loading: false,
        error: new Error('Network error'),
        refetch: vi.fn(),
      } as any);

      rerender(<CreditsDisplay />);
      expect(screen.getByTestId('credits-error')).toBeInTheDocument();
      expect(screen.queryByTestId('credits-loading')).not.toBeInTheDocument();
    });
  });

  describe('different credit values', () => {
    it('should handle zero credits', () => {
      vi.mocked(useUserCreditsHook.useUserCredits).mockReturnValue({
        credits: {
          total: 1000,
          available: 0,
          used: 1000,
          lastUpdated: '2025-12-27T10:00:00Z',
        },
        loading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<CreditsDisplay />);

      const valueElement = screen.getByTestId('credits-value');
      expect(valueElement).toHaveTextContent('0');
    });

    it('should handle large credit values', () => {
      vi.mocked(useUserCreditsHook.useUserCredits).mockReturnValue({
        credits: {
          total: 1000000,
          available: 999999,
          used: 1,
          lastUpdated: '2025-12-27T10:00:00Z',
        },
        loading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<CreditsDisplay />);

      const valueElement = screen.getByTestId('credits-value');
      expect(valueElement).toHaveTextContent('999999');
    });

    it('should display correct available credits value', () => {
      const customCredits = {
        total: 500,
        available: 250,
        used: 250,
        lastUpdated: '2025-12-27T10:00:00Z',
      };

      vi.mocked(useUserCreditsHook.useUserCredits).mockReturnValue({
        credits: customCredits,
        loading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<CreditsDisplay />);

      const valueElement = screen.getByTestId('credits-value');
      expect(valueElement).toHaveTextContent('250');
      expect(valueElement).toHaveAttribute('data-value', '250');
    });
  });
});
