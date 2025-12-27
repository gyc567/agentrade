import useSWR from 'swr';
import { useAuth } from '../contexts/AuthContext';
import { getApiBaseUrl } from '../lib/apiConfig';

/**
 * 用户积分数据接口
 */
export interface UserCredits {
  total: number;
  available: number;
  used: number;
  // 兼容性字段 (Snake Case)
  total_credits: number;
  available_credits: number;
  used_credits: number;
  lastUpdated: string;
}

/**
 * useUserCredits Hook返回值
 */
export interface UseUserCreditsReturn {
  credits: UserCredits | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const API_BASE = getApiBaseUrl();

/**
 * useUserCredits Hook
 * 使用 SWR 获取并管理用户积分数据
 */
export function useUserCredits(): UseUserCreditsReturn {
  const { user, token } = useAuth();

  const { data, error, mutate, isValidating } = useSWR<UserCredits>(
    user?.id && token ? [`${API_BASE}/user/credits`, token] : null,
    async ([url, authToken]: [string, string]) => {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('认证失败，请重新登录');
        }
        throw new Error(`获取积分失败: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.data || typeof result.data !== 'object') {
        throw new Error('API响应格式错误');
      }

      const apiData = result.data;
      const available = typeof apiData.available_credits === 'number' ? apiData.available_credits : 0;
      const total = typeof apiData.total_credits === 'number' ? apiData.total_credits : 0;
      const used = typeof apiData.used_credits === 'number' ? apiData.used_credits : 0;

      return {
        available,
        total,
        used,
        available_credits: available,
        total_credits: total,
        used_credits: used,
        lastUpdated: new Date().toISOString(),
      };
    },
    {
      refreshInterval: 30000, // 30秒刷新
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  return {
    credits: data || null,
    loading: !data && !error && isValidating,
    error: error || null,
    refetch: async () => {
      await mutate();
    },
  };
}