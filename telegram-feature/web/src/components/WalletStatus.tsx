/**
 * WalletStatus组件
 * 显示已连接钱包的状态信息
 * 支持地址显示、断开连接等功能
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, X, Copy, ExternalLink, Shield, ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../i18n/translations';

interface WalletStatusProps {
  address: string;
  walletType: 'metamask' | 'tp' | 'unknown';
  onDisconnect: () => void;
  onClose: () => void;
}

export function WalletStatus({ address, walletType, onDisconnect, onClose }: WalletStatusProps) {
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // 格式化地址显示
  const formatAddress = (addr: string): string => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // 获取完整地址
  const getFullAddress = (): string => {
    return address;
  };

  // 获取钱包信息
  const getWalletInfo = () => {
    const walletInfo = {
      metamask: {
        name: 'MetaMask',
        icon: '🦊',
        color: 'var(--brand-orange)',
        website: 'https://metamask.io',
      },
      tp: {
        name: 'TP钱包',
        icon: '🔵',
        color: 'var(--brand-blue)',
        website: 'https://www.tokenpocket.pro',
      },
      unknown: {
        name: t('web3.unknownWallet', language) || '未知钱包',
        icon: '❓',
        color: 'var(--text-secondary)',
        website: '',
      },
    };

    return walletInfo[walletType] || walletInfo.unknown;
  };

  // 复制地址到剪贴板
  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(getFullAddress());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  // 在区块浏览器中查看
  const handleViewOnExplorer = () => {
    const baseUrl = 'https://etherscan.io/address/';
    window.open(baseUrl + getFullAddress(), '_blank', 'noopener,noreferrer');
  };

  const walletInfo = getWalletInfo();

  return (
    <div
      className="rounded-xl shadow-2xl overflow-hidden"
      style={{
        background: 'var(--brand-dark-gray)',
        border: '1px solid var(--panel-border)',
        minWidth: '360px',
        maxWidth: '90vw',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-status-title"
    >
      {/* 标题栏 */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid var(--panel-border)' }}
      >
        <h2 id="wallet-status-title" className="text-lg font-semibold" style={{ color: 'var(--brand-light-gray)' }}>
          {t('web3.walletStatus', language) || '钱包状态'}
        </h2>
        <button
          onClick={onClose}
          className="p-1 rounded hover:opacity-80 transition-opacity"
          style={{ color: 'var(--brand-light-gray)' }}
          aria-label={t('common.close', language) || '关闭'}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 状态内容 */}
      <div className="p-6 space-y-4">
        {/* 连接成功提示 */}
        <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(72, 187, 120, 0.1)' }}>
          <CheckCircle className="w-6 h-6 text-green-500" />
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--brand-green)' }}>
              {t('web3.connectedSuccessfully', language) || '连接成功'}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {t('web3.walletConnected', language) || `您的 ${walletInfo.name} 钱包已成功连接`}
            </p>
          </div>
        </div>

        {/* 钱包信息卡片 */}
        <div
          className="p-4 rounded-lg border"
          style={{ background: 'var(--panel-bg)', borderColor: 'var(--panel-border)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
              style={{ background: 'rgba(255, 255, 255, 0.05)' }}
            >
              {walletInfo.icon}
            </div>
            <div>
              <h3 className="font-semibold" style={{ color: 'var(--brand-light-gray)' }}>
                {walletInfo.name}
              </h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3" style={{ color: walletInfo.color }} />
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {t('web3.secure', language) || '安全连接'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 钱包地址 */}
          <div className="space-y-2">
            <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              {t('web3.walletAddress', language) || '钱包地址'}
            </label>
            <div
              className="flex items-center gap-2 p-3 rounded border"
              style={{ background: 'rgba(255, 255, 255, 0.02)', borderColor: 'var(--panel-border)' }}
            >
              <code
                className="flex-1 text-sm font-mono truncate"
                style={{ color: 'var(--brand-light-gray)' }}
                title={getFullAddress()}
              >
                {formatAddress(getFullAddress())}
              </code>
              <button
                onClick={handleCopyAddress}
                className="p-1 rounded hover:opacity-80 transition-opacity"
                style={{ color: 'var(--text-secondary)' }}
                aria-label={t('web3.copyAddress', language) || '复制地址'}
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handleViewOnExplorer}
                className="p-1 rounded hover:opacity-80 transition-opacity"
                style={{ color: 'var(--text-secondary)' }}
                aria-label={t('web3.viewOnExplorer', language) || '在浏览器中查看'}
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
            {copied && (
              <p className="text-xs" style={{ color: 'var(--brand-green)' }}>
                {t('web3.addressCopied', language) || '地址已复制到剪贴板'}
              </p>
            )}
          </div>
        </div>

        {/* 详细信息展开 */}
        <div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full p-2 rounded hover:opacity-80 transition-opacity"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span className="text-sm">
              {t('web3.moreDetails', language) || '详细信息'}
            </span>
            <motion.div
              animate={{ rotate: showDetails ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </button>

          <motion.div
            initial={false}
            animate={{ height: showDetails ? 'auto' : 0, opacity: showDetails ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {showDetails && (
              <div className="pt-2 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {t('web3.connectionTime', language) || '连接时间'}:
                    </span>
                    <p style={{ color: 'var(--brand-light-gray)' }}>{new Date().toLocaleTimeString(language)}</p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {t('web3.network', language) || '网络'}:
                    </span>
                    <p style={{ color: 'var(--brand-light-gray)' }}>
                      {t('web3.ethereumMainnet', language) || '以太坊主网'}
                    </p>
                  </div>
                </div>

                {/* 安全提示 */}
                <div
                  className="flex items-start gap-2 p-2 rounded"
                  style={{ background: 'rgba(255, 255, 255, 0.02)' }}
                >
                  <Shield className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {t('web3.securityNotice', language) ||
                      '您的私钥永远不会被发送到我们的服务器。我们仅验证您的钱包所有权以建立安全连接。'}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* 底部操作 */}
      <div
        className="px-6 py-4 border-t flex gap-3"
        style={{ borderColor: 'var(--panel-border)' }}
      >
        <button
          onClick={() => {
            onDisconnect();
            onClose();
          }}
          className="flex-1 px-4 py-2 rounded font-semibold text-sm transition-colors hover:opacity-90"
          style={{ background: 'var(--binance-red-bg)', color: 'var(--binance-red)' }}
        >
          {t('web3.disconnectWallet', language) || '断开钱包连接'}
        </button>
        {walletInfo.website && (
          <button
            onClick={() => window.open(walletInfo.website, '_blank', 'noopener,noreferrer')}
            className="px-4 py-2 rounded font-semibold text-sm transition-colors hover:opacity-90"
            style={{ background: 'var(--panel-bg)', color: 'var(--brand-light-gray)' }}
          >
            {t('web3.visitWebsite', language) || '访问官网'}
          </button>
        )}
      </div>
    </div>
  );
}

export default WalletStatus;
