import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../i18n/translations';
import { getSystemConfig } from '../lib/config';
import HeaderBar from './landing/HeaderBar';
import { NetworkErrorBoundary, NetworkStatusPrompt, useNetworkStatus } from './NetworkErrorBoundary';

export function RegisterPage() {
  const { language } = useLanguage();
  const { register } = useAuth();
  const { isOnline, isConnected } = useNetworkStatus();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [betaCode, setBetaCode] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [betaMode, setBetaMode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState('');

  useEffect(() => {
    // 获取系统配置，检查是否开启内测模式
    getSystemConfig().then(config => {
      setBetaMode(config.beta_mode || false);
    }).catch(err => {
      console.error('Failed to fetch system config:', err);
    });

    // 从URL读取邀请码
    const params = new URLSearchParams(window.location.search);
    const code = params.get('inviteCode');
    if (code) {
      setInviteCode(code);
    }
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setNetworkError('');

    // 网络状态检查
    if (!isOnline) {
      setError('网络未连接，请检查网络设置后重试');
      return;
    }

    if (!isConnected) {
      setNetworkError('无法连接到服务器，请检查：\n1. 浏览器是否启用了广告拦截器\n2. 网络代理或防火墙设置\n3. 尝试使用无痕模式访问');
      return;
    }

    // 前端验证
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致，请检查后重试');
      return;
    }

    if (password.length < 8) {
      setError('密码长度至少需要8个字符');
      return;
    }

    if (betaMode && !betaCode.trim()) {
      setError('内测期间，注册需要提供有效的内测码');
      return;
    }

    setLoading(true);

    try {
      // 添加超时控制
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('请求超时，请检查网络连接')), 10000);
      });

      const registerPromise = register(email, password, betaCode.trim() || undefined, inviteCode.trim() || undefined);

      const result = await Promise.race([registerPromise, timeoutPromise]) as any;

      if (result.success) {
        // 注册成功
        setSuccess(result.message || '注册成功！即将跳转到应用...');
        // 2秒后跳转到主页
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        // 注册失败，显示详细错误信息
        let errorMsg = result.message || '注册失败，请检查输入信息后重试';
        let errorDetails = (result as any).details;

        // 根据错误类型提供针对性建议
        if (errorMsg.includes('邮箱已被注册')) {
          errorDetails = '该邮箱已经注册，建议直接登录或使用其他邮箱';
        } else if (errorMsg.includes('内测码无效')) {
          errorDetails = '内测码无效或已被使用，请检查后重试';
        } else if (errorMsg.includes('密码强度不够')) {
          errorDetails = '密码必须至少8个字符，建议使用大小写字母+数字+特殊字符组合';
        }

        setError(errorDetails || errorMsg);
      }
    } catch (err: any) {
      console.error('注册错误:', err);

      // 分类处理不同类型的错误
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setNetworkError(
          '网络连接失败！\n\n可能原因：\n' +
          '1. 浏览器扩展（广告拦截器）阻止了请求\n' +
          '2. 网络代理或防火墙配置问题\n' +
          '3. 当前URL被Vercel SSO拦截\n\n' +
          '解决方案：\n' +
          '• 尝试在无痕模式下访问\n' +
          '• 暂时禁用浏览器扩展\n' +
          `• 使用推荐地址：https://web-pink-omega-40.vercel.app`
        );
      } else if (err.message.includes('超时')) {
        setNetworkError('请求超时，请检查网络连接后重试');
      } else {
        setError(err.message || '未知错误，请重试');
      }
    }

    setLoading(false);
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthColors = ['#FF5252', '#FF9800', '#FFC107', '#4CAF50', '#2E7D32'];

  return (
    <NetworkErrorBoundary>
      <div className="min-h-screen" style={{ background: 'var(--brand-black)' }}>
        <NetworkStatusPrompt />
        <HeaderBar
          isLoggedIn={false}
          isHomePage={false}
          currentPage="register"
          language={language}
          onLanguageChange={() => {}}
          onPageChange={(page) => {
            console.log('RegisterPage onPageChange called with:', page);
            if (page === 'competition') {
              window.location.href = '/competition';
            }
          }}
        />

        <div className="flex items-center justify-center pt-20" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <img src="/icons/Monnaire_Logo.svg" alt="Monnaire Logo" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#EAECEF' }}>
            {t('appTitle', language)}
          </h1>
          <p className="text-sm mt-2" style={{ color: '#848E9C' }}>
            创建您的账户
          </p>
        </div>

        {/* Registration Form */}
        <div className="rounded-lg p-6" style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)' }}>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--brand-light-gray)' }}>
                邮箱地址
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded"
                style={{ background: 'var(--brand-black)', border: '1px solid var(--panel-border)', color: 'var(--brand-light-gray)' }}
                placeholder="请输入您的邮箱"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--brand-light-gray)' }}>
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded"
                style={{ background: 'var(--brand-black)', border: '1px solid var(--panel-border)', color: 'var(--brand-light-gray)' }}
                placeholder="请输入密码（至少8位）"
                required
              />
              {password && (
                <div className="mt-2 space-y-2">
                  {/* 密码强度条 */}
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map((index) => (
                      <div
                        key={index}
                        className="h-1 flex-1 rounded"
                        style={{
                          background: index < passwordStrength ? strengthColors[passwordStrength - 1] : '#2B3139',
                        }}
                      />
                    ))}
                  </div>
                  {/* 密码规则提示 */}
                  <div className="text-xs space-y-1" style={{ color: '#848E9C' }}>
                    <div className={`flex items-center gap-2 ${password.length >= 8 ? 'text-green-500' : ''}`}>
                      <span>✓</span>
                      <span>至少8个字符</span>
                    </div>
                    <div className={`flex items-center gap-2 ${/[A-Z]/.test(password) ? 'text-green-500' : ''}`}>
                      <span>✓</span>
                      <span>包含大写字母（推荐）</span>
                    </div>
                    <div className={`flex items-center gap-2 ${/[0-9]/.test(password) ? 'text-green-500' : ''}`}>
                      <span>✓</span>
                      <span>包含数字（推荐）</span>
                    </div>
                    <div className={`flex items-center gap-2 ${/[^A-Za-z0-9]/.test(password) ? 'text-green-500' : ''}`}>
                      <span>✓</span>
                      <span>包含特殊字符（推荐）</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--brand-light-gray)' }}>
                确认密码
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded"
                style={{ background: 'var(--brand-black)', border: '1px solid var(--panel-border)', color: 'var(--brand-light-gray)' }}
                placeholder="请再次输入密码"
                required
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs mt-1" style={{ color: '#FF5252' }}>
                  两次输入的密码不一致
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--brand-light-gray)' }}>
                邀请码 (可选)
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full px-3 py-2 rounded"
                style={{ background: 'var(--brand-black)', border: '1px solid var(--panel-border)', color: 'var(--brand-light-gray)' }}
                placeholder="请输入邀请码"
              />
            </div>

            {betaMode && (
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#EAECEF' }}>
                  内测码 *
                </label>
                <input
                  type="text"
                  value={betaCode}
                  onChange={(e) => setBetaCode(e.target.value.replace(/[^a-z0-9]/gi, '').toLowerCase())}
                  className="w-full px-3 py-2 rounded font-mono"
                  style={{ background: '#0B0E11', border: '1px solid #2B3139', color: '#EAECEF' }}
                  placeholder="请输入6位内测码"
                  maxLength={6}
                  required={betaMode}
                />
                <p className="text-xs mt-1" style={{ color: '#848E9C' }}>
                  内测码由6位字母数字组成，区分大小写
                </p>
              </div>
            )}

            {/* 网络错误消息 */}
            {networkError && (
              <div className="px-4 py-4 rounded-lg" style={{ background: 'var(--binance-red-bg)', border: '1px solid var(--binance-red)' }}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🌐</span>
                  <div className="flex-1">
                    <p className="font-semibold mb-2" style={{ color: 'var(--binance-red)' }}>网络连接失败</p>
                    <pre className="text-sm whitespace-pre-wrap" style={{ color: 'var(--binance-red)' }}>{networkError}</pre>
                    <button
                      onClick={() => window.location.href = 'https://web-pink-omega-40.vercel.app/register'}
                      className="mt-3 px-3 py-1 text-xs rounded transition-all hover:scale-105"
                      style={{ background: 'var(--brand-yellow)', color: 'var(--brand-black)' }}
                    >
                      使用推荐地址访问
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 错误消息 */}
            {error && !networkError && (
              <div className="px-4 py-3 rounded-lg" style={{ background: 'var(--binance-red-bg)', border: '1px solid var(--binance-red)' }}>
                <div className="flex items-start gap-3">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <p className="font-semibold mb-1" style={{ color: 'var(--binance-red)' }}>注册失败</p>
                    <p className="text-sm" style={{ color: 'var(--binance-red)' }}>{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 成功消息 */}
            {success && (
              <div className="px-4 py-3 rounded-lg" style={{ background: 'rgba(76, 175, 80, 0.1)', border: '1px solid #4CAF50' }}>
                <div className="flex items-start gap-3">
                  <span className="text-xl">✓</span>
                  <div>
                    <p className="font-semibold mb-1" style={{ color: '#4CAF50' }}>注册成功</p>
                    <p className="text-sm" style={{ color: '#4CAF50' }}>{success}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (betaMode && !betaCode.trim()) || password !== confirmPassword}
              className="w-full px-4 py-3 rounded text-sm font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              style={{ background: 'var(--brand-yellow)', color: 'var(--brand-black)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  注册中...
                </span>
              ) : (
                '立即注册'
              )}
            </button>
          </form>
        </div>

        {/* Login Link */}
        <div className="text-center mt-6">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            已有账户？{' '}
            <button
              onClick={() => {
                window.history.pushState({}, '', '/login');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="font-semibold hover:underline transition-colors"
              style={{ color: 'var(--brand-yellow)' }}
            >
              立即登录
            </button>
          </p>
        </div>

        {/* 网络状态指示器 */}
        {!isConnected && (
          <div className="text-center mt-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs"
                 style={{ background: 'var(--binance-red-bg)', color: 'var(--binance-red)' }}>
              <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
              <span>网络连接异常</span>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
    </NetworkErrorBoundary>
  );
}
