import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserProfilePage from '../../pages/UserProfilePage';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useUserProfile, useUserCredits } from '../../hooks/useUserProfile';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../contexts/LanguageContext', () => ({
  useLanguage: vi.fn(),
}));

vi.mock('../../hooks/useUserProfile', () => ({
  useUserProfile: vi.fn(),
  useUserCredits: vi.fn(),
}));

vi.mock('../../i18n/translations', () => ({
  t: (key: string) => key,
}));

describe('UserProfilePage Invitation', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Default mocks
    (useAuth as any).mockReturnValue({
      user: {
        id: 'user123',
        email: 'test@example.com',
        invite_code: 'TESTCODE'
      }
    });
    
    (useLanguage as any).mockReturnValue({
      language: 'en'
    });

    (useUserProfile as any).mockReturnValue({
      userProfile: {
        total_equity: 1000,
        trader_count: 1
      },
      loading: false,
      error: null
    });

    (useUserCredits as any).mockReturnValue({
      credits: {
        total_credits: 100,
        available_credits: 100
      },
      loading: false,
      error: null
    });

    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders invitation center with code and link', () => {
    render(<UserProfilePage />);
    
    // Depending on translation mock, key might be returned
    // But our component code has hardcoded 'Invitation Center' for English
    // if language === 'zh' ? ... : ...
    // Since we mocked useLanguage to return 'en'
    expect(screen.getByText('Invitation Center')).toBeInTheDocument();
    expect(screen.getByText('TESTCODE')).toBeInTheDocument();
    
    // Check link construction
    const link = screen.getByText((content) => content.includes('/register?inviteCode=TESTCODE'));
    expect(link).toBeInTheDocument();
  });

  it('copies code when button clicked', async () => {
    render(<UserProfilePage />);
    
    const copyButtons = screen.getAllByText('Copy');
    // First button should be for code
    fireEvent.click(copyButtons[0]);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('TESTCODE');
    
    await waitFor(() => {
      // It should change to Copied
      expect(screen.getByText('Copied')).toBeInTheDocument();
    });
  });

  it('does not render invitation center if no invite code', () => {
    (useAuth as any).mockReturnValue({
      user: {
        id: 'user123',
        email: 'test@example.com',
        invite_code: undefined // No code
      }
    });

    render(<UserProfilePage />);
    expect(screen.queryByText('Invitation Center')).not.toBeInTheDocument();
  });
});
