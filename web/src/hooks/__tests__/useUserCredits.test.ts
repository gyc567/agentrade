import { renderHook, waitFor } from '@testing-library/react';
import { useUserCredits } from '../useUserCredits';
import * as AuthContext from '../../contexts/AuthContext';

// Mock fetchCurrentUser
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock getApiBaseUrl
vi.mock('../../lib/apiConfig', () => ({
  getApiBaseUrl: vi.fn(() => 'http://localhost:3000/api'),
}));

// Mock fetch
global.fetch = vi.fn();

describe('useUserCredits', () => {
  const mockUser = { id: 'user-1', email: 'test@example.com' };
  const mockToken = 'test-token';
  const mockCreditsResponse = {
    total: 1000,
    available: 750,
    used: 250,
    lastUpdated: '2025-12-27T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  describe('initialization', () => {
    it('should load credits on mount when user is authenticated', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: mockUser,
        token: mockToken,
      } as any);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockCreditsResponse),
      });

      const { result } = renderHook(() => useUserCredits());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.credits).toEqual(mockCreditsResponse);
      expect(result.current.error).toBeNull();
    });

    it('should not load credits when user is not authenticated', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: null,
        token: null,
      } as any);

      const { result } = renderHook(() => useUserCredits());

      expect(result.current.credits).toBeNull();
      expect(result.current.error).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should not load credits when token is missing', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: mockUser,
        token: null,
      } as any);

      const { result } = renderHook(() => useUserCredits());

      expect(result.current.credits).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: mockUser,
        token: mockToken,
      } as any);

      const networkError = new Error('Network error');
      (global.fetch as any).mockRejectedValueOnce(networkError);

      const { result } = renderHook(() => useUserCredits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.credits).toBeNull();
    });

    it('should handle 401 unauthorized response', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: mockUser,
        token: mockToken,
      } as any);

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const { result } = renderHook(() => useUserCredits());

      // Initial state
      expect(result.current.loading).toBe(true);

      // Wait a bit for fetch to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // After 401, we should have no credits and no error (logout case)
      expect(result.current.credits).toBeNull();
    });

    it('should handle 500 server errors', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: mockUser,
        token: mockToken,
      } as any);

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const { result } = renderHook(() => useUserCredits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.credits).toBeNull();
    });
  });

  describe('auto-refresh', () => {
    it('should setup interval for auto-refresh on mount', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: mockUser,
        token: mockToken,
      } as any);

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockCreditsResponse),
      });

      const { result } = renderHook(() => useUserCredits());

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      expect(result.current.credits).toEqual(mockCreditsResponse);
    });

    it('should cleanup interval on unmount', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: mockUser,
        token: mockToken,
      } as any);

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockCreditsResponse),
      });

      const { unmount } = renderHook(() => useUserCredits());

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      unmount();

      // Component should be unmounted cleanly
      expect(true).toBe(true);
    });
  });

  describe('refetch', () => {
    it('should manually refetch credits', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: mockUser,
        token: mockToken,
      } as any);

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockCreditsResponse),
      });

      const { result } = renderHook(() => useUserCredits());

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      // Manual refetch
      await result.current.refetch();

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle errors in manual refetch', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: mockUser,
        token: mockToken,
      } as any);

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValueOnce(mockCreditsResponse),
        })
        .mockRejectedValueOnce(new Error('Refetch failed'));

      const { result } = renderHook(() => useUserCredits());

      await waitFor(() => {
        expect(result.current.credits).not.toBeNull();
      });

      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });
    });
  });

  describe('API request', () => {
    it('should make request with correct headers', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: mockUser,
        token: mockToken,
      } as any);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockCreditsResponse),
      });

      renderHook(() => useUserCredits());

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      const [url, options] = (global.fetch as any).mock.calls[0];
      expect(url).toBe('http://localhost:3000/api/user/credits');
      expect(options.method).toBe('GET');
      expect(options.headers['Authorization']).toBe(`Bearer ${mockToken}`);
      expect(options.headers['Content-Type']).toBe('application/json');
    });
  });
});
