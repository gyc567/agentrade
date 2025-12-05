/**
 * Web3ConnectButton组件
 * 实现连接Web3钱包按钮，支持MetaMask和TP钱包
 * 遵循OpenSpec设计规范: connect-web3-wallet-button
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useWeb3 } from '../hooks/useWeb3';
import { WalletSelector } from './WalletSelector';
import { WalletStatus } from './WalletStatus';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../i18n/translations';

interface Web3ConnectButtonProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary';
  className?: string;
}

export function Web3ConnectButton({
  size = 'medium',
  variant = 'secondary',
  className = '',
}: Web3ConnectButtonProps) {
  const { language } = useLanguage();
  const [showSelector, setShowSelector] = useState(false);
  const { address, isConnected, isConnecting, error, walletType, connect, disconnect } = useWeb3();

  // 格式化地址显示
  const formatAddress = (addr: string): string => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // 获取按钮样式
  const getButtonStyles = () => {
    const baseStyles = 'flex items-center gap-2 font-semibold rounded transition-all duration-200 focus:outline-2 focus:outline-offset-2';

    const sizeStyles = {
      small: 'px-3 py-1.5 text-xs',
      medium: 'px-4 py-2 text-sm',
      large: 'px-6 py-3 text-base',
    };

    const variantStyles = {
      primary: {
        default: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-600 hover:to-yellow-700',
        connected: 'bg-green-600 text-white hover:bg-green-700',
        connecting: 'bg-blue-600 text-white',
        error: 'bg-red-600 text-white',
      },
      secondary: {
        default: 'border border-yellow-500 text-yellow-500 hover:bg-yellow-500/10',
        connected: 'border border-green-600 text-green-600 hover:bg-green-600/10',
        connecting: 'border border-blue-600 text-blue-600',
        error: 'border border-red-600 text-red-600',
      },
    };

    const state = error ? 'error' : isConnecting ? 'connecting' : isConnected ? 'connected' : 'default';

    return `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant][state]} ${className}`;
  };

  // 获取按钮图标
  const getButtonIcon = () => {
    if (isConnecting) {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }
    if (isConnected) {
      return <CheckCircle className="w-4 h-4" />;
    }
    if (error) {
      return <XCircle className="w-4 h-4" />;
    }
    return <Link className="w-4 h-4" />;
  };

  // 获取按钮文字
  const getButtonText = () => {
    if (error) {
      return t('web3.error', language) || '连接失败';
    }
    if (isConnecting) {
      return t('web3.connecting', language) || '连接中...';
    }
    if (isConnected && address) {
      return `${t('web3.connected', language) || '已连接'}: ${formatAddress(address)}`;
    }
    return t('web3.connectWallet', language) || '连接Web3钱包';
  };

  // 处理按钮点击
  const handleButtonClick = () => {
    if (isConnected) {
      // 已连接状态显示下拉菜单
      setShowSelector(!showSelector);
    } else if (!isConnecting) {
      // 未连接且不在连接中，显示钱包选择器
      setShowSelector(true);
    }
  };

  // 处理钱包选择
  const handleWalletSelect = async (selectedWalletType: 'metamask' | 'tp') => {
    try {
      await connect(selectedWalletType);
      setShowSelector(false);
    } catch (err) {
      console.error('钱包连接失败:', err);
      // 错误状态会通过useWeb3 hook自动显示
    }
  };

  // 处理断开连接
  const handleDisconnect = () => {
    disconnect();
    setShowSelector(false);
  };

  // 处理错误清除
  const handleErrorClear = () => {
    // 错误由useWeb3 hook的clearError处理（如果需要的话）
  };

  return (
    <div className="relative">
      {/* 主按钮 */}
      <button
        onClick={handleButtonClick}
        disabled={isConnecting}
        className={getButtonStyles()}
        aria-label={t('web3.connectWallet', language) || '连接Web3钱包'}
        aria-expanded={showSelector}
        aria-haspopup="dialog"
        aria-describedby={error ? 'web3-error-message' : undefined}
      >
        {getButtonIcon()}
        <span className="truncate max-w-[200px]">{getButtonText()}</span>
        {isConnected && (
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              handleDisconnect();
            }}
            className="ml-1 text-xs opacity-70 hover:opacity-100 transition-opacity"
            aria-label={t('web3.disconnect', language) || '断开连接'}
          >
            <XCircle className="w-3 h-3" />
          </motion.button>
        )}
      </button>

      {/* 错误提示 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 left-0 right-0 z-50"
          >
            <div className="bg-red-600 text-white text-xs px-3 py-2 rounded shadow-lg">
              <div className="flex items-center justify-between">
                <span id="web3-error-message">{error}</span>
                <button
                  onClick={handleErrorClear}
                  className="ml-2 hover:opacity-80"
                  aria-label={t('common.close', language) || '关闭'}
                >
                  <XCircle className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 钱包选择器 / 状态显示 */}
      <AnimatePresence>
        {showSelector && (
          <>
            {/* 遮罩层 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setShowSelector(false)}
            />

            {/* 弹窗内容 */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="absolute top-full mt-2 left-0 z-50"
              style={{ minWidth: '320px' }}
            >
              {isConnected && address ? (
                <WalletStatus
                  address={address}
                  walletType={walletType || 'unknown'}
                  onDisconnect={handleDisconnect}
                  onClose={() => setShowSelector(false)}
                />
              ) : (
                <WalletSelector
                  onSelect={handleWalletSelect}
                  onClose={() => setShowSelector(false)}
                />
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Web3ConnectButton;
