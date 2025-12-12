import { render, screen } from '@testing-library/react';
import App from '../App';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

// Mock contexts
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: any) => <div>{children}</div>
}));

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: vi.fn(),
  LanguageProvider: ({ children }: any) => <div>{children}</div>
}));

// Mock components to simplify testing
vi.mock('../pages/UserProfilePage', () => ({
  default: () => <div>UserProfile Page</div>
}));

vi.mock('../pages/LandingPage', () => ({
  LandingPage: () => <div>Landing Page</div>
}));

// Mock complex hooks used in App
vi.mock('swr', () => ({
  default: () => ({ data: undefined, error: undefined })
}));

describe('App Routing Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useLanguage as any).mockReturnValue({ language: 'en', setLanguage: vi.fn() });
    
    // Mock window.location for routing
    // Note: App.tsx uses window.location.pathname directly
    delete (window as any).location;
    (window as any).location = { pathname: '/profile', hash: '', search: '', assign: vi.fn(), replace: vi.fn() };
  });

  it('redirects to Landing Page when user is not logged in accessing /profile', () => {
    (useAuth as any).mockReturnValue({
      user: null,
      token: null,
      isLoading: false,
      logout: vi.fn()
    });

    render(<App />);
    
    // Should render LandingPage because user is null
    expect(screen.getByText('Landing Page')).toBeInTheDocument();
    expect(screen.queryByText('UserProfile Page')).not.toBeInTheDocument();
  });

  it('renders Profile Page when user is logged in accessing /profile', async () => {
    (useAuth as any).mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      token: 'valid-token',
      isLoading: false,
      logout: vi.fn()
    });

    render(<App />);
    
    // Should render UserProfilePage because user is logged in
    expect(await screen.findByText('UserProfile Page')).toBeInTheDocument();
    expect(screen.queryByText('Landing Page')).not.toBeInTheDocument();
  });
});
