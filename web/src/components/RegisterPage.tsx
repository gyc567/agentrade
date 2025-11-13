import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../i18n/translations';
import { getSystemConfig } from '../lib/config';
import HeaderBar from './landing/HeaderBar';

export function RegisterPage() {
  const { language } = useLanguage();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [betaCode, setBetaCode] = useState('');
  const [betaMode, setBetaMode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 获取系统配置，检查是否开启内测模式
    getSystemConfig().then(config => {
      setBetaMode(config.beta_mode || false);
    }).catch(err => {
      console.error('Failed to fetch system config:', err);
    });
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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
      const result = await register(email, password, betaCode.trim() || undefined);

      if (result.success) {
        // 注册成功
        setSuccess(result.message || '注册成功！即将跳转到应用...');
        // 2秒后跳转到主页
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        // 注册失败，显示详细错误信息
        const errorMsg = (result as any).details || result.message || '注册失败，请检查输入信息后重试';
        setError(errorMsg);
      }
    } catch (err) {
      setError('网络错误，请检查网络连接后重试');
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
    <div className="min-h-screen" style={{ background: 'var(--brand-black)' }}>
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

            {/* 错误消息 */}
            {error && (
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
        </div>
      </div>
    </div>
  );
}
