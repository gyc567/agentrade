import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class NetworkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Network error caught:', error, errorInfo);

    // 检测特定的网络错误类型
    if (error.message.includes('Could not establish connection')) {
      console.warn('检测到网络连接问题，可能的原因：');
      console.warn('1. 浏览器扩展拦截了请求');
      console.warn('2. 网络代理或防火墙阻止了请求');
      console.warn('3. 目标服务器无响应');
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--brand-black)' }}>
          <div className="max-w-md w-full mx-4">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center rounded-full" style={{ background: 'var(--binance-red-bg)' }}>
                <span className="text-4xl">⚠️</span>
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#EAECEF' }}>
                网络连接异常
              </h2>
              <p className="text-sm" style={{ color: '#848E9C' }}>
                无法连接到服务器，请检查网络后重试
              </p>
            </div>

            <div className="rounded-lg p-6" style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)' }}>
              <h3 className="font-semibold mb-3" style={{ color: '#EAECEF' }}>
                可能的原因：
              </h3>
              <ol className="text-sm space-y-2" style={{ color: '#848E9C' }}>
                <li className="flex items-start gap-2">
                  <span className="text-brand-yellow font-bold">1.</span>
                  <span>浏览器扩展（如广告拦截器）阻止了请求</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-yellow font-bold">2.</span>
                  <span>网络代理或防火墙配置问题</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-yellow font-bold">3.</span>
                  <span>服务器暂时无响应</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-yellow font-bold">4.</span>
                  <span>使用URL被Vercel SSO认证拦截</span>
                </li>
              </ol>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-3 rounded text-sm font-semibold transition-all hover:scale-105"
                  style={{ background: 'var(--brand-yellow)', color: 'var(--brand-black)' }}
                >
                  刷新页面重试
                </button>
                <button
                  onClick={() => {
                    window.history.pushState({}, '', '/login');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="w-full px-4 py-3 rounded text-sm font-semibold border transition-all hover:scale-105"
                  style={{ borderColor: 'var(--panel-border)', color: '#EAECEF' }}
                >
                  前往登录页
                </button>
              </div>

              <div className="mt-4 p-3 rounded" style={{ background: 'var(--brand-black)' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: '#EAECEF' }}>
                  建议解决方案：
                </p>
                <ul className="text-xs space-y-1" style={{ color: '#848E9C' }}>
                  <li>• 尝试在无痕/隐私模式下访问</li>
                  <li>• 暂时禁用浏览器扩展</li>
                  <li>• 使用推荐地址：
                    <br />
                    <code className="block mt-1 px-2 py-1 rounded font-mono" style={{ background: 'var(--panel-bg-hover)', color: '#EAECEF' }}>
                      https://web-pink-omega-40.vercel.app
                    </code>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 网络状态检查 Hook
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [isConnected, setIsConnected] = React.useState(true);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 检查实际连接
    const checkConnection = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch('https://nofx-gyc567.replit.app/api/health', {
          method: 'GET',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        setIsConnected(response.ok);
      } catch (error) {
        setIsConnected(false);
      }
    };

    checkConnection();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, isConnected };
};

// 网络状态提示组件
export const NetworkStatusPrompt: React.FC = () => {
  const { isOnline, isConnected } = useNetworkStatus();

  if (isOnline && isConnected) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-semibold"
         style={{ background: 'var(--binance-red)', color: '#000' }}>
      {!isOnline ? '⚠️ 网络断开连接' : '⚠️ 无法连接到服务器'}
      <button
        onClick={() => window.location.reload()}
        className="ml-2 underline hover:no-underline"
      >
        刷新
      </button>
    </div>
  );
};
