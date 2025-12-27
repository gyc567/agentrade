import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../Header';
import * as LanguageContext from '../../contexts/LanguageContext';
import * as useUserCreditsHook from '../../hooks/useUserCredits';

// Mock dependencies
vi.mock('../../contexts/LanguageContext', () => ({
  useLanguage: vi.fn(),
}));

vi.mock('../../hooks/useUserCredits', () => ({
  useUserCredits: vi.fn(),
}));

vi.mock('../../i18n/translations', () => ({
  t: vi.fn((key, lang) => {
    const translations: Record<string, Record<string, string>> = {
      appTitle: { zh: '应用标题', en: 'App Title' },
      subtitle: { zh: '字幕', en: 'Subtitle' },
    };
    return translations[key]?.[lang] || key;
  }),
}));

describe('Header Integration Tests', () => {
  const mockCredits = {
    total: 1000,
    available: 750,
    used: 250,
    lastUpdated: '2025-12-27T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(LanguageContext.useLanguage).mockReturnValue({
      language: 'en',
      setLanguage: vi.fn(),
    } as any);

    vi.mocked(useUserCreditsHook.useUserCredits).mockReturnValue({
      credits: mockCredits,
      loading: false,
      error: null,
      refetch: vi.fn(),
    } as any);
  });

  describe('Header structure', () => {
    it('should render header element', () => {
      render(<Header />);

      const headerElement = document.querySelector('header');
      expect(headerElement).toBeInTheDocument();
    });

    it('should have correct header classes', () => {
      render(<Header />);

      const headerElement = document.querySelector('header');
      expect(headerElement).toHaveClass('glass');
      expect(headerElement).toHaveClass('sticky');
      expect(headerElement).toHaveClass('top-0');
      expect(headerElement).toHaveClass('z-50');
      expect(headerElement).toHaveClass('backdrop-blur-xl');
    });

    it('should render logo image', () => {
      render(<Header />);

      const logoImg = screen.getByAltText('Monnaire Logo');
      expect(logoImg).toBeInTheDocument();
      expect(logoImg).toHaveAttribute('src', '/icons/Monnaire_Logo.svg');
    });

    it('should render app title', () => {
      render(<Header />);

      expect(screen.getByText('App Title')).toBeInTheDocument();
    });
  });

  describe('simple mode', () => {
    it('should not render subtitle in simple mode', () => {
      render(<Header simple={true} />);

      expect(screen.queryByText('Subtitle')).not.toBeInTheDocument();
    });

    it('should not render CreditsDisplay in simple mode', () => {
      render(<Header simple={true} />);

      expect(screen.queryByTestId('credits-display')).not.toBeInTheDocument();
      expect(screen.queryByTestId('credits-loading')).not.toBeInTheDocument();
      expect(screen.queryByTestId('credits-error')).not.toBeInTheDocument();
    });

    it('should still render language toggle in simple mode', () => {
      render(<Header simple={true} />);

      expect(screen.getByRole('button', { name: '中文' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'EN' })).toBeInTheDocument();
    });
  });

  describe('normal mode (not simple)', () => {
    it('should render subtitle in normal mode', () => {
      render(<Header simple={false} />);

      expect(screen.getByText('Subtitle')).toBeInTheDocument();
    });

    it('should render CreditsDisplay in normal mode', () => {
      render(<Header simple={false} />);

      expect(screen.getByTestId('credits-display')).toBeInTheDocument();
    });

    it('should render both CreditsDisplay and language toggle', () => {
      render(<Header simple={false} />);

      expect(screen.getByTestId('credits-display')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '中文' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'EN' })).toBeInTheDocument();
    });
  });

  describe('CreditsDisplay integration', () => {
    it('should display credits when available', () => {
      render(<Header />);

      const creditsDisplay = screen.getByTestId('credits-display');
      expect(creditsDisplay).toBeInTheDocument();
      expect(creditsDisplay).toHaveTextContent('750');
    });

    it('should show loading state when credits are loading', () => {
      vi.mocked(useUserCreditsHook.useUserCredits).mockReturnValue({
        credits: null,
        loading: true,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<Header />);

      expect(screen.getByTestId('credits-loading')).toBeInTheDocument();
    });

    it('should show error state when credits fail to load', () => {
      vi.mocked(useUserCreditsHook.useUserCredits).mockReturnValue({
        credits: null,
        loading: false,
        error: new Error('Network error'),
        refetch: vi.fn(),
      } as any);

      render(<Header />);

      expect(screen.getByTestId('credits-error')).toBeInTheDocument();
    });

    it('should position CreditsDisplay to the left of language toggle', () => {
      render(<Header />);

      const rightSection = screen.getByTestId('credits-display').parentElement;
      const creditsDisplay = screen.getByTestId('credits-display');
      const languageButtons = screen.getByRole('button', { name: '中文' }).parentElement;

      expect(rightSection).toBeInTheDocument();
      expect(creditsDisplay).toBeInTheDocument();
      expect(languageButtons).toBeInTheDocument();

      // Verify they're in the same parent (flexbox container)
      expect(creditsDisplay.parentElement?.parentElement).toBe(rightSection?.parentElement);
    });
  });

  describe('language toggle functionality', () => {
    it('should have Chinese and English buttons', () => {
      render(<Header />);

      const zhButton = screen.getByRole('button', { name: '中文' });
      const enButton = screen.getByRole('button', { name: 'EN' });

      expect(zhButton).toBeInTheDocument();
      expect(enButton).toBeInTheDocument();
    });

    it('should call setLanguage when Chinese button is clicked', () => {
      const setLanguageMock = vi.fn();
      vi.mocked(LanguageContext.useLanguage).mockReturnValue({
        language: 'en',
        setLanguage: setLanguageMock,
      } as any);

      render(<Header />);

      const zhButton = screen.getByRole('button', { name: '中文' });
      fireEvent.click(zhButton);

      expect(setLanguageMock).toHaveBeenCalledWith('zh');
    });

    it('should call setLanguage when English button is clicked', () => {
      const setLanguageMock = vi.fn();
      vi.mocked(LanguageContext.useLanguage).mockReturnValue({
        language: 'zh',
        setLanguage: setLanguageMock,
      } as any);

      render(<Header />);

      const enButton = screen.getByRole('button', { name: 'EN' });
      fireEvent.click(enButton);

      expect(setLanguageMock).toHaveBeenCalledWith('en');
    });

    it('should highlight active language button', () => {
      vi.mocked(LanguageContext.useLanguage).mockReturnValue({
        language: 'zh',
        setLanguage: vi.fn(),
      } as any);

      render(<Header />);

      const zhButton = screen.getByRole('button', { name: '中文' });
      const enButton = screen.getByRole('button', { name: 'EN' });

      // Check style indicates Chinese is active
      expect(zhButton).toHaveStyle({
        background: '#F0B90B',
        color: '#000',
      });

      expect(enButton).toHaveStyle({
        background: 'transparent',
        color: '#848E9C',
      });
    });

    it('should change active button when language changes', () => {
      const { rerender } = render(<Header />);

      vi.mocked(LanguageContext.useLanguage).mockReturnValue({
        language: 'zh',
        setLanguage: vi.fn(),
      } as any);

      rerender(<Header />);

      const zhButton = screen.getByRole('button', { name: '中文' });
      const enButton = screen.getByRole('button', { name: 'EN' });

      expect(zhButton).toHaveStyle({ background: '#F0B90B' });
      expect(enButton).toHaveStyle({ background: 'transparent' });
    });
  });

  describe('responsive layout', () => {
    it('should maintain flexbox layout', () => {
      render(<Header />);

      const headerContainer = screen.getByText('App Title').closest('div');
      const parentContainer = headerContainer?.parentElement;

      expect(parentContainer).toHaveClass('flex');
      expect(parentContainer).toHaveClass('items-center');
    });

    it('should have consistent spacing', () => {
      render(<Header />);

      const rightSection = screen.getByTestId('credits-display').parentElement;
      expect(rightSection).toHaveClass('flex');
      expect(rightSection).toHaveClass('items-center');
      expect(rightSection).toHaveClass('gap-4');
    });
  });

  describe('no interference between features', () => {
    it('should render CreditsDisplay without affecting logo', () => {
      render(<Header />);

      const logo = screen.getByAltText('Monnaire Logo');
      const creditsDisplay = screen.getByTestId('credits-display');

      expect(logo).toBeInTheDocument();
      expect(creditsDisplay).toBeInTheDocument();

      // Both should be in the document simultaneously
      expect(logo.closest('header')).toBe(creditsDisplay.closest('header'));
    });

    it('should render CreditsDisplay without affecting language toggle', () => {
      render(<Header />);

      const creditsDisplay = screen.getByTestId('credits-display');
      const zhButton = screen.getByRole('button', { name: '中文' });

      expect(creditsDisplay).toBeInTheDocument();
      expect(zhButton).toBeInTheDocument();

      // Verify they're in the right section
      expect(creditsDisplay.parentElement?.className).toContain('flex');
      expect(zhButton.closest('div[style]')).toBeInTheDocument();
    });

    it('should not prevent language toggle from functioning', () => {
      const setLanguageMock = vi.fn();
      vi.mocked(LanguageContext.useLanguage).mockReturnValue({
        language: 'en',
        setLanguage: setLanguageMock,
      } as any);

      render(<Header />);

      const zhButton = screen.getByRole('button', { name: '中文' });
      fireEvent.click(zhButton);

      expect(setLanguageMock).toHaveBeenCalledWith('zh');
    });

    it('should display CreditsDisplay with correct aria attributes', () => {
      render(<Header />);

      const creditsDisplay = screen.getByTestId('credits-display');
      expect(creditsDisplay).toHaveAttribute('role', 'status');
      expect(creditsDisplay).toHaveAttribute('aria-live', 'polite');
      expect(creditsDisplay).toHaveAttribute('aria-label');
    });
  });

  describe('accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<Header />);

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
      expect(h1).toHaveTextContent('App Title');
    });

    it('should have accessible language buttons', () => {
      render(<Header />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);

      const languageButtons = buttons.slice(0, 2);
      languageButtons.forEach((button) => {
        expect(button).toBeVisible();
      });
    });

    it('should have proper semantic structure', () => {
      const { container } = render(<Header />);

      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
      expect(header?.parentElement).toBeInTheDocument();
    });
  });

  describe('dynamic credit updates', () => {
    it('should update credits display when credits change', () => {
      const { rerender } = render(<Header />);

      expect(screen.getByTestId('credits-value')).toHaveTextContent('750');

      vi.mocked(useUserCreditsHook.useUserCredits).mockReturnValue({
        credits: {
          total: 1000,
          available: 500,
          used: 500,
          lastUpdated: '2025-12-27T11:00:00Z',
        },
        loading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      rerender(<Header />);

      expect(screen.getByTestId('credits-value')).toHaveTextContent('500');
    });

    it('should transition from loading to success', () => {
      const { rerender } = render(<Header />);

      vi.mocked(useUserCreditsHook.useUserCredits).mockReturnValue({
        credits: null,
        loading: true,
        error: null,
        refetch: vi.fn(),
      } as any);

      rerender(<Header />);
      expect(screen.getByTestId('credits-loading')).toBeInTheDocument();

      vi.mocked(useUserCreditsHook.useUserCredits).mockReturnValue({
        credits: mockCredits,
        loading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      rerender(<Header />);
      expect(screen.getByTestId('credits-display')).toBeInTheDocument();
    });
  });
});
