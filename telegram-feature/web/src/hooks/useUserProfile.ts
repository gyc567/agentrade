import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../lib/apiConfig';

/**
 * 用户资料数据结构
 * 聚合用户基本信息、账户信息和交易员统计
 */
export interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  is_admin: boolean;
  trader_count: number;
  total_equity: number;
  total_pnl: number;
  active_traders: number;
  daily_pnl: number;
  position_count: number;
  last_login_at?: string;
}

/**
 * 用户资料Hook的状态管理
 */
interface UserProfileState {
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * 用户资料数据聚合Hook
 *
 * 架构设计原则：
 * 1. 单一职责 - 只负责用户资料数据的获取和管理
 * 2. 关注点分离 - 数据逻辑与UI逻辑分离
 * 3. 错误边界 - 完善的错误处理和重试机制
 * 4. 性能优化 - 智能缓存和数据聚合
 *
 * 实现特点：
 * - 使用SWR进行数据缓存和自动重验证
 * - 聚合多个API端点的数据
 * - 提供骨架屏加载状态
 * - 支持错误重试和数据刷新
 */
export function useUserProfile(): UserProfileState {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  /**
   * 数据获取函数
   * 聚合用户基本信息、账户信息和交易员数据
   */
  const fetchUserProfile = useCallback(async () => {
    if (!user || !token) {
      throw new Error('用户未登录');
    }

    try {
      // 并行获取用户账户信息和交易员列表
      const [accountData, tradersData] = await Promise.all([
        api.getAccount(),
        api.getTraders()
      ]);

      // 数据聚合和转换
      const profile: UserProfile = {
        id: user.id || 'unknown',
        email: user.email,
        created_at: new Date().toISOString(), // 这里应该从用户API获取，暂时使用当前时间
        is_admin: false,
        trader_count: tradersData?.length || 0,
        total_equity: accountData?.total_equity || 0,
        total_pnl: accountData?.total_pnl || 0,
        active_traders: tradersData?.filter((t: any) => t.is_running).length || 0,
        daily_pnl: accountData?.daily_pnl || 0,
        position_count: accountData?.position_count || 0,
        last_login_at: localStorage.getItem('last_login_time') || undefined
      };

      return profile;
    } catch (error) {
      console.error('获取用户资料失败:', error);
      throw error;
    }
  }, [user, token]);

  /**
   * 使用SWR进行数据管理
   * 配置智能缓存和重验证策略
   */
  const { data, mutate, error: swrError } = useSWR(
    // 只有当用户登录时才获取数据
    user && token ? 'user-profile' : null,
    fetchUserProfile,
    {
      // 缓存策略：15秒刷新间隔，减少频繁请求
      refreshInterval: 15000,
      // 窗口聚焦时不重验证，避免不必要的请求
      revalidateOnFocus: false,
      // 去重间隔：10秒内相同请求只发送一次
      dedupingInterval: 10000,
      // 错误重试策略
      onError: (error) => {
        console.error('用户资料数据获取失败:', error);
        setError(error.message || '获取用户资料失败');
      },
      onSuccess: (data) => {
        setUserProfile(data);
        setError(null);
      }
    }
  );

  // 同步SWR状态到组件状态
  useEffect(() => {
    if (swrError) {
      setError(swrError.message || '获取用户资料失败');
      setLoading(false);
    } else if (data) {
      setUserProfile(data);
      setLoading(false);
      setError(null);
    } else if (!user || !token) {
      setLoading(false);
      setError(null);
      setUserProfile(null);
    }
  }, [data, swrError, user, token]);

  /**
   * 数据刷新函数
   * 手动触发数据重新获取
   */
  const refetch = useCallback(() => {
    mutate();
  }, [mutate]);

  return {
    userProfile,
    loading: loading && !data && !error,
    error,
    refetch
  };
}

/**
 * 用户积分数据Hook
 * 从 user_credits 表获取用户积分真实数据
 *
 * 遵循Linus Torvalds的"好品味"原则：
 * - 消除边界情况：所有场景使用真实API
 * - 简洁执念：只返回必要字段
 * - 实用主义：显示真实数据而非假数据
 *
 * Bug修复: API路径不匹配问题
 * 原问题: 前端调用 /api/v1/user/credits (404)
 * 解决方案: 适配后端路由 /api/user/credits
 */
/**
 * 用户积分数据Hook
 * 从 user_credits 表获取用户积分真实数据
 *
 * 遵循Linus Torvalds的"好品味"原则：
 * - 消除边界情况：所有场景使用真实API
 * - 简洁执念：只返回必要字段
 * - 实用主义：显示真实数据而非假数据
 *
 * Bug修复: API路径不匹配问题
 * 原问题: 前端调用 /api/v1/user/credits (404)
 * 解决方案: 适配后端路由 /api/user/credits
 *
 * Bug修复: 认证Token过期导致401错误
 * 原问题: Token验证不严格，导致401 Unauthorized
 * 解决方案: 严格检查token有效性，友好错误提示
 */
export function useUserCredits() {
  const { token } = useAuth();

  const { data, error, mutate } = useSWR(
    // 严格的token检查：非空字符串且长度大于0
    // 避免token为null、undefined或空字符串时发起无效请求
    token && typeof token === 'string' && token.length > 0 && token !== 'undefined' && token !== 'null'
      ? 'user-credits'
      : null,
    async () => {
      try {
        // 防御性检查：确保token有效
        if (!token || typeof token !== 'string' || token.length === 0) {
          throw new Error('用户未登录或登录已过期，请重新登录');
        }

        // 调用真实的积分系统API
        // Bug修复: 使用统一的API配置模块
        // 使用 getApiUrl() 确保在所有环境下都指向正确的后端地址
        // 开发环境: http://localhost:8080/api/user/credits
        // 生产环境: https://nofx-gyc567.replit.app/api/user/credits
        // API: GET /api/user/credits
        // 返回: { available_credits, total_credits, used_credits }
        const response = await fetch(getApiUrl('user/credits'), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          // 改进错误处理，针对401错误提供友好提示
          if (response.status === 401) {
            // 401错误通常意味着token无效或已过期
            console.error('Token无效或已过期:', response.statusText);
            throw new Error('登录已过期，请重新登录');
          }

          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.error || `HTTP ${response.status}`;
          console.error('获取积分数据失败:', errorMsg);
          throw new Error(`获取积分数据失败: ${errorMsg}`);
        }

        const result = await response.json();

        // 验证API响应格式
        if (!result.data || typeof result.data !== 'object') {
          throw new Error('API响应格式错误');
        }

        // 验证数据完整性
        const credits = result.data;
        if (typeof credits.available_credits !== 'number' ||
            typeof credits.total_credits !== 'number' ||
            typeof credits.used_credits !== 'number') {
          throw new Error('积分数据格式错误');
        }

        // 返回真实数据（只返回必要字段，遵循简洁原则）
        return {
          available_credits: credits.available_credits,
          total_credits: credits.total_credits,
          used_credits: credits.used_credits
          // 注意：不返回 transaction_count 字段（用户不需要此信息）
        };
      } catch (error) {
        console.error('获取积分数据失败:', error);

        // 改进错误处理：不返回假数据0，而是抛出错误
        // 让UI可以显示"加载失败"而不是"0积分"
        // 这遵循实用主义原则：显示真实状态
        throw error;
      }
    },
    {
      refreshInterval: 30000, // 30秒刷新
      revalidateOnFocus: false,
      // 禁用自动重试，避免401错误循环请求
      // 401错误通常意味着认证问题，重试无意义
      errorRetryCount: 0,
      onError: (err) => {
        console.error('用户积分数据加载失败:', err);
        // 可以在这里添加错误上报逻辑
      }
    }
  );

  return {
    credits: data,
    loading: !data && !error,
    error,
    refetch: mutate
  };
}

export default useUserProfile;