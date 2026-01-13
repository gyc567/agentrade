import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import HeaderBar from './landing/HeaderBar';

export function ResetPasswordPage() {
  const { language } = useLanguage();
  const { requestPasswordReset, resetPassword } = useAuth();

  // 从URL获取token
  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get('token');

  const [step] = resetToken ? useState<'confirm'>('confirm') : useState<'request'>('request');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const result = await requestPasswordReset(email);

    if (result.success) {
      setSuccess(result.message || '请求成功，请检查邮箱');
    } else {
      setError(result.message || '请求失败，请重试');
    }

    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('密码不匹配');
      return;
    }

    if (password.length < 8) {
      setError('密码长度至少8位');
      return;
    }

    setLoading(true);

    const result = await resetPassword(resetToken!, password, otpCode);

    if (result.success) {
      setSuccess(result.message || '密码重置成功，即将跳转到登录页');

      // 3秒后跳转到登录页
      setTimeout(() => {
        window.history.pushState({}, '', '/login');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, 3000);
    } else {
      setError(result.message || '重置失败，请重试');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-black)' }}>
      <HeaderBar
        onLoginClick={() => {}}
        isLoggedIn={false}
        isHomePage={false}
        currentPage="reset-password"
        language={language}
        onLanguageChange={() => {}}
        onPageChange={(page) => {
          console.log('ResetPasswordPage onPageChange called with:', page);
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
              <img src="/icons/PumpStrategy_Logo_Simple.svg" alt="PumpStrategy Logo" className="w-16 h-16 object-contain" />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--brand-light-gray)' }}>
              {step === 'request' ? '重置密码' : '确认重置'}
            </h1>
            <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
              {step === 'request'
                ? '请输入您的邮箱'
                : '请输入新密码和OTP验证码'}
            </p>
          </div>

          {/* Reset Request Form */}
          <div
            className="rounded-lg p-6"
            style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)' }}
          >
            {step === 'request' ? (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--brand-light-gray)' }}>
                    邮箱地址
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded"
                    style={{
                      background: 'var(--brand-black)',
                      border: '1px solid var(--panel-border)',
                      color: 'var(--brand-light-gray)',
                    }}
                    placeholder="请输入邮箱"
                    required
                  />
                </div>

                {error && (
                  <div
                    className="text-sm px-3 py-2 rounded"
                    style={{ background: 'var(--binance-red-bg)', color: 'var(--binance-red)' }}
                  >
                    {error}
                  </div>
                )}

                {success && (
                  <div
                    className="text-sm px-3 py-2 rounded"
                    style={{ background: 'var(--binance-green-bg)', color: 'var(--binance-green)' }}
                  >
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 rounded text-sm font-semibold transition-all hover:scale-105 disabled:opacity-50"
                  style={{ background: 'var(--brand-yellow)', color: 'var(--brand-black)' }}
                >
                  {loading ? '发送中...' : '发送重置邮件'}
                </button>
              </form>
            ) : (
              /* Reset Confirm Form */
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">🔐</div>
                  <p className="text-sm" style={{ color: '#848E9C' }}>
                    请输入新密码和OTP验证码
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--brand-light-gray)' }}>
                    新密码
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded"
                    style={{
                      background: 'var(--brand-black)',
                      border: '1px solid var(--panel-border)',
                      color: 'var(--brand-light-gray)',
                    }}
                    placeholder="至少8位密码"
                    minLength={8}
                    required
                  />
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
                    style={{
                      background: 'var(--brand-black)',
                      border: '1px solid var(--panel-border)',
                      color: 'var(--brand-light-gray)',
                    }}
                    placeholder="再次输入密码"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--brand-light-gray)' }}>
                    OTP验证码
                  </label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-3 py-2 rounded text-center text-2xl font-mono"
                    style={{
                      background: 'var(--brand-black)',
                      border: '1px solid var(--panel-border)',
                      color: 'var(--brand-light-gray)',
                    }}
                    placeholder="6位验证码"
                    maxLength={6}
                    required
                  />
                </div>

                {error && (
                  <div
                    className="text-sm px-3 py-2 rounded"
                    style={{ background: 'var(--binance-red-bg)', color: 'var(--binance-red)' }}
                  >
                    {error}
                  </div>
                )}

                {success && (
                  <div
                    className="text-sm px-3 py-2 rounded"
                    style={{ background: 'var(--binance-green-bg)', color: 'var(--binance-green)' }}
                  >
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || password.length < 8 || otpCode.length !== 6}
                  className="w-full px-4 py-2 rounded text-sm font-semibold transition-all hover:scale-105 disabled:opacity-50"
                  style={{ background: '#F0B90B', color: '#000' }}
                >
                  {loading ? '重置中...' : '确认重置'}
                </button>
              </form>
            )}
          </div>

          {/* Back to Login Link */}
          <div className="text-center mt-6">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              记起密码了？{' '}
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
