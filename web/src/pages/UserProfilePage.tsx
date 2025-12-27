import React, { useState } from 'react';
import { useUserProfile } from '../hooks/useUserProfile';
import { useUserCredits } from '../hooks/useUserCredits';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../i18n/translations';

/**
 * 用户详情页面组件
 *
 * 设计理念：
 * 1. 单一职责 - 只负责用户信息的展示
 * 2. 关注点分离 - 数据获取由Hook处理，组件专注渲染
 * 3. 渐进增强 - 从基础信息开始，支持未来扩展
 * 4. 响应式设计 - 移动优先，自适应各种屏幕
 *
 * 架构思考：
 * 就像内核的VFS层，这个组件提供了一个统一的抽象界面，
 * 隐藏了底层数据获取的复杂性，让UI逻辑保持纯粹和优雅。
 */
const UserProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { userProfile, loading, error, refetch } = useUserProfile();
  const { language } = useLanguage();
  const { credits, loading: creditsLoading, error: creditsError } = useUserCredits();
  const [copySuccess, setCopySuccess] = useState<string>('');

  const handleCopy = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const inviteLink = user?.invite_code ? `${window.location.origin}/register?inviteCode=${user.invite_code}` : '';

  // 渲染加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <UserProfileSkeleton />
        </div>
      </div>
    );
  }

  // 渲染错误状态
  if (error) {
    return (
      <div className="min-h-screen bg-[#000000] py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="binance-card-no-hover p-6 text-center">
            <div className="text-[var(--binance-red)] mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">{t('profile.profile_error', language)}</h3>
            <p className="text-[var(--text-secondary)] mb-4">{error}</p>
            <button
              onClick={refetch}
              className="btn-binance"
            >
              {t('profile.retry', language)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 渲染用户资料
  return (
    <div className="min-h-screen bg-[#000000] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">
              {t('profile.userInfo', language)}
            </h1>
            <p className="mt-2 text-[var(--text-secondary)]">
              {t('profile.userProfileSubtitle', language)}
            </p>
          </div>
          <button
            onClick={() => window.history.back()}
            className="flex items-center text-[var(--text-secondary)] hover:text-[var(--binance-yellow)] transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('profile.profile_back', language)}
          </button>
        </div>

        {/* 用户信息卡片 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 基本信息卡片 */}
          <div className="lg:col-span-1">
            <div className="binance-card-no-hover p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                {t('profile.basicInfo', language)}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-tertiary)]">
                    {t('profile.profile_email', language)}
                  </label>
                  <p className="mt-1 text-[var(--text-primary)]">{user?.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-tertiary)]">
                    {t('profile.memberSince', language)}
                  </label>
                  <p className="mt-1 text-[var(--text-primary)]">
                    {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : '-'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-tertiary)]">
                    {t('profile.lastLogin', language)}
                  </label>
                  <p className="mt-1 text-[var(--text-primary)]">
                    {userProfile?.last_login_at ? new Date(userProfile.last_login_at).toLocaleString() : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 统计信息卡片 */}
          <div className="lg:col-span-2 space-y-6">
            <div className="binance-card-no-hover p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                {t('profile.accountOverview', language)}
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--text-primary)] mono">
                    {userProfile?.total_equity ? `$${userProfile.total_equity.toFixed(2)}` : '$0.00'}
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">
                    {t('totalEquity', language)}
                  </div>
                  <div className={`text-xs mt-1 ${
                    (userProfile?.daily_pnl || 0) >= 0 ? 'text-[var(--binance-green)]' : 'text-[var(--binance-red)]'
                  }`}>
                    {(userProfile?.daily_pnl || 0) >= 0 ? '+' : ''}{userProfile?.daily_pnl?.toFixed(2) || 0} {t('profile.dailyPnl', language)}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--text-primary)] mono">
                    {userProfile?.total_pnl ? `$${userProfile.total_pnl.toFixed(2)}` : '$0.00'}
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">
                    {t('totalPnL', language)}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--text-primary)]">
                    {userProfile?.active_traders || 0}
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">
                    {t('profile.activeTraders', language)}
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)]">
                    /{userProfile?.trader_count || 0} {t('profile.totalTraders', language)}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--text-primary)]">
                    {userProfile?.position_count || 0}
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">
                    {t('profile.totalPositions', language)}
                  </div>
                </div>
              </div>
            </div>

            <div className="binance-card-no-hover p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                {t('profile.creditSystem', language)}
              </h3>

              {creditsLoading ? (
                <div className="text-center py-8">
                  <div className="spinner mx-auto mb-2"></div>
                  <p className="text-[var(--text-secondary)]">
                    {t('loadingCreditData', language)}
                  </p>
                </div>
              ) : creditsError ? (
                <div className="text-center py-8">
                  <div className="text-4xl font-bold text-[var(--binance-red)] mb-2">
                    ⚠️
                  </div>
                  <p className="text-[var(--binance-red)]">
                    {t('creditDataLoadFailed', language)}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--binance-yellow)]">
                      {credits?.total_credits || 0}
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">
                      {t('totalCredits', language)}
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)] mt-1">
                      {t('accountTotalBalance', language)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--binance-green)]">
                      {credits?.available_credits || 0}
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">
                      {t('availableCredits', language)}
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)] mt-1">
                      {t('availableForUse', language)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--binance-red)]">
                      {credits?.used_credits || 0}
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">
                      {t('usedCredits', language)}
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)] mt-1">
                      {t('historicallyConsumed', language)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 邀请中心 */}
        {user?.invite_code && (
          <div className="mt-8">
            <div className="binance-card-no-hover p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                {language === 'zh' ? '邀请中心' : 'Invitation Center'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 邀请码 */}
                <div className="p-4 rounded bg-[#1E2329] border border-[#2B3139]">
                  <div className="text-sm text-[var(--text-secondary)] mb-2">
                    {language === 'zh' ? '我的邀请码' : 'My Invite Code'}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xl font-mono font-bold text-[var(--binance-yellow)]">
                      {user.invite_code}
                    </div>
                    <button 
                      onClick={() => handleCopy(user.invite_code!, 'code')}
                      className="text-sm px-3 py-1 rounded bg-[#2B3139] hover:bg-[#474D57] text-[var(--text-primary)] transition-colors"
                    >
                      {copySuccess === 'code' 
                        ? (language === 'zh' ? '已复制' : 'Copied') 
                        : (language === 'zh' ? '复制' : 'Copy')}
                    </button>
                  </div>
                </div>

                {/* 邀请链接 */}
                <div className="p-4 rounded bg-[#1E2329] border border-[#2B3139]">
                  <div className="text-sm text-[var(--text-secondary)] mb-2">
                    {language === 'zh' ? '邀请链接' : 'Invitation Link'}
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm text-[var(--text-tertiary)] truncate flex-1 font-mono">
                      {inviteLink}
                    </div>
                    <button 
                      onClick={() => handleCopy(inviteLink, 'link')}
                      className="text-sm px-3 py-1 rounded bg-[#2B3139] hover:bg-[#474D57] text-[var(--text-primary)] transition-colors shrink-0"
                    >
                      {copySuccess === 'link' 
                        ? (language === 'zh' ? '已复制' : 'Copied') 
                        : (language === 'zh' ? '复制链接' : 'Copy Link')}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 text-sm text-[var(--text-secondary)]">
                💡 {language === 'zh' 
                  ? '邀请好友注册，每成功邀请一人，您将获得 ' 
                  : 'Invite friends to register, and for every successful invitation, you will get '}
                <span className="text-[var(--binance-yellow)]">10 {language === 'zh' ? '积分' : 'Credits'}</span> 
                {language === 'zh' ? ' 奖励！' : ' reward!'}
              </div>
            </div>
          </div>
        )}

        {/* 交易员概览 */}
        {(userProfile?.trader_count || 0) > 0 && (
          <div className="mt-8">
            <div className="binance-card-no-hover p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                {t('profile.traderOverview', language)}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="stat-card text-center">
                  <div className="text-2xl font-bold text-[var(--text-primary)]">
                    {userProfile?.trader_count || 0}
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">
                    {t('profile.totalTraders', language)}
                  </div>
                </div>

                <div className="stat-card text-center" style={{ borderColor: 'var(--binance-green-border)' }}>
                  <div className="text-2xl font-bold text-[var(--binance-green)]">
                    {userProfile?.active_traders || 0}
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">
                    {t('profile.activeTraders', language)}
                  </div>
                </div>

                <div className="stat-card text-center" style={{ borderColor: 'rgba(240, 185, 11, 0.3)' }}>
                  <div className="text-2xl font-bold text-[var(--binance-yellow)]">
                    {userProfile?.position_count || 0}
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">
                    {t('profile.totalPositions', language)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 骨架屏组件
 * 提升感知性能，遵循渐进式增强原则
 */
const UserProfileSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* 标题骨架 */}
      <div className="space-y-2">
        <div className="h-8 w-48 skeleton"></div>
        <div className="h-4 w-64 skeleton"></div>
      </div>

      {/* 卡片骨架 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="binance-card-no-hover p-6">
            <div className="h-6 w-32 skeleton mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="h-4 w-20 skeleton mb-1"></div>
                  <div className="h-5 w-32 skeleton"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="binance-card-no-hover p-6">
              <div className="h-6 w-32 skeleton mb-4"></div>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="text-center">
                    <div className="h-8 w-20 skeleton mx-auto mb-1"></div>
                    <div className="h-4 w-16 skeleton mx-auto"></div>
                    <div className="h-3 w-12 skeleton mx-auto mt-1"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
