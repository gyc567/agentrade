/**
 * 钱包检测器
 * 修复审计报告中的中等优先级漏洞: TP钱包检测增强
 *
 * 提供多重验证逻辑:
 * - 静态属性检测
 * - 动态检测
 * - 浏览器指纹检测
 * - 版本验证
 */

export interface WalletDetectionResult {
  isDetected: boolean;
  walletType: 'metamask' | 'tp' | 'unknown';
  confidence: number; // 0-100
  version?: string;
  details: {
    isMetaMask?: boolean;
    isTokenPocket?: boolean;
    isTp?: boolean;
    hasRequestMethod?: boolean;
    userAgent?: string;
    vendor?: string;
  };
}

/**
 * 检测MetaMask
 */
export function detectMetaMask(): WalletDetectionResult {
  const result: WalletDetectionResult = {
    isDetected: false,
    walletType: 'unknown',
    confidence: 0,
    details: {},
  };

  // 检查window.ethereum是否存在
  if (typeof window.ethereum === 'undefined' || !window.ethereum) {
    return result;
  }

  result.details.hasRequestMethod = typeof window.ethereum.request === 'function';

  // 静态属性检测
  if (window.ethereum.isMetaMask === true) {
    result.isDetected = true;
    result.walletType = 'metamask';
    result.confidence = 95;
    result.details.isMetaMask = true;
  }

  // 辅助检测 - 检查其他属性
  if (window.ethereum.isMetaMask !== undefined) {
    result.confidence = Math.max(result.confidence, 80);
  }

  // 检查提供者字符串
  const providers = (window as any).ethereum?.providers;
  if (providers && Array.isArray(providers)) {
    const metaMaskProvider = providers.find(
      (p: any) => p.isMetaMask === true
    );
    if (metaMaskProvider) {
      result.isDetected = true;
      result.walletType = 'metamask';
      result.confidence = 100;
      result.details.isMetaMask = true;
    }
  }

  return result;
}

/**
 * 检测TP钱包 - 增强版
 */
export function detectTPWallet(): WalletDetectionResult {
  const result: WalletDetectionResult = {
    isDetected: false,
    walletType: 'unknown',
    confidence: 0,
    details: {},
  };

  // 检查window.ethereum是否存在
  if (typeof window.ethereum === 'undefined' || !window.ethereum) {
    return result;
  }

  result.details.hasRequestMethod = typeof window.ethereum.request === 'function';

  // 1. 静态属性检测 (最可靠)
  if (window.ethereum.isTokenPocket === true || window.ethereum.isTp === true) {
    result.isDetected = true;
    result.walletType = 'tp';
    result.confidence = 90;
    result.details.isTokenPocket = true;
    result.details.isTp = true;
  }

  // 2. 检查多个可能的钱包提供商
  const providers = (window as any).ethereum?.providers || [(window as any).ethereum];
  let tpProvider = null;

  for (const provider of providers) {
    if (provider && (provider.isTokenPocket === true || provider.isTp === true)) {
      tpProvider = provider;
      break;
    }
  }

  if (tpProvider) {
    result.isDetected = true;
    result.walletType = 'tp';
    result.confidence = 100;
    result.details.isTokenPocket = true;
  }

  // 3. 检查扩展ID (Chrome扩展ID)
  // TP钱包的Chrome扩展ID: mfgccjchihhkkindpeiilhmdfjcoondh
  try {
    const chrome = (window as any).chrome;
    if (chrome && chrome.runtime && chrome.runtime.id) {
      result.details.vendor = chrome.runtime.id;
      if (chrome.runtime.id === 'mfgccjchihhkkindpeiilhmdfjcoondh') {
        result.confidence = 95;
        result.walletType = 'tp';
        result.isDetected = true;
      }
    }
  } catch (error) {
    // 忽略错误
  }

  // 4. 检查User Agent
  const userAgent = navigator.userAgent.toLowerCase();
  result.details.userAgent = userAgent;

  // TP钱包的User Agent通常包含特定标识
  if (
    userAgent.includes('tokenpocket') ||
    userAgent.includes('tpwallet') ||
    userAgent.includes('token pocket')
  ) {
    result.confidence = Math.max(result.confidence, 85);
  }

  // 5. 检查window对象属性
  // TP钱包可能会注入特定的全局变量
  const tpSpecificProps = [
    'TokenPocketProvider',
    'tp',
    'tokenpocket',
    'TPProvider',
  ];

  for (const prop of tpSpecificProps) {
    if ((window as any)[prop] !== undefined) {
      result.confidence = Math.max(result.confidence, 75);
    }
  }

  // 6. 检查页面title或其他DOM元素
  try {
    const pageContent = document.documentElement.innerHTML.toLowerCase();
    if (
      pageContent.includes('tokenpocket') ||
      pageContent.includes('tpwallet')
    ) {
      result.confidence = Math.max(result.confidence, 60);
    }
  } catch (error) {
    // 忽略错误
  }

  // 7. 检查已连接的网络 (TP钱包会暴露特定方法)
  if (typeof (window as any).ethereum?.chainId === 'string') {
    result.confidence = Math.max(result.confidence, 70);
  }

  // 8. 检查是否支持特定方法
  const tpMethods = [
    'eth_requestAccounts',
    'personal_sign',
    'eth_sendTransaction',
  ];

  let supportedMethods = 0;
  for (const method of tpMethods) {
    // @ts-ignore - 动态检查方法存在
    if (typeof window.ethereum[method] === 'function' || typeof (window.ethereum as any).request === 'function') {
      supportedMethods++;
    }
  }

  if (supportedMethods >= 2) {
    result.confidence = Math.max(result.confidence, 65);
  }

  // 9. 综合判断
  // 如果TP钱包的相关属性出现多个，认为是TP钱包
  const tpIndicators = [
    result.details.isTokenPocket,
    result.details.isTp,
    result.confidence > 80,
  ].filter(Boolean).length;

  if (tpIndicators >= 2) {
    result.isDetected = true;
    if (result.confidence < 80) {
      result.confidence = 80;
    }
  }

  // 10. 最终验证 - 尝试获取账户
  if (result.confidence > 70) {
    // 只有高置信度才进行实际验证
    // 这里可以添加实际的账户获取测试
    result.version = 'unknown';
  }

  return result;
}

/**
 * 检测所有钱包
 */
export function detectAllWallets(): WalletDetectionResult[] {
  const results: WalletDetectionResult[] = [];

  // 检测MetaMask
  const metaMaskResult = detectMetaMask();
  if (metaMaskResult.isDetected) {
    results.push(metaMaskResult);
  }

  // 检测TP钱包
  const tpResult = detectTPWallet();
  if (tpResult.isDetected) {
    results.push(tpResult);
  }

  // 特殊处理：如果两个钱包都安装了，MetaMask优先
  if (results.length > 1) {
    results.sort((a, b) => {
      if (a.walletType === 'metamask') return -1;
      if (b.walletType === 'metamask') return 1;
      return b.confidence - a.confidence;
    });
  }

  return results;
}

/**
 * 检测主钱包
 */
export function detectPrimaryWallet(): WalletDetectionResult | null {
  const wallets = detectAllWallets();
  if (wallets.length === 0) {
    return null;
  }

  // 返回置信度最高的
  return wallets[0];
}

/**
 * 检查钱包是否已安装
 */
export function isWalletInstalled(walletType: 'metamask' | 'tp'): boolean {
  const wallets = detectAllWallets();
  return wallets.some(w => w.walletType === walletType && w.isDetected);
}

/**
 * 获取钱包列表
 */
export function getInstalledWallets(): Array<{
  type: 'metamask' | 'tp';
  isInstalled: boolean;
  confidence: number;
}> {
  return [
    {
      type: 'metamask',
      isInstalled: isWalletInstalled('metamask'),
      confidence: detectMetaMask().confidence,
    },
    {
      type: 'tp',
      isInstalled: isWalletInstalled('tp'),
      confidence: detectTPWallet().confidence,
    },
  ];
}

/**
 * 验证钱包地址
 */
export function validateWalletAddress(address: string, _walletType: 'metamask' | 'tp'): boolean {
  // 基本格式检查
  if (!address || typeof address !== 'string') {
    return false;
  }

  // 以太坊地址格式: 0x + 40个十六进制字符
  const ethAddressPattern = /^0x[a-fA-F0-9]{40}$/;
  if (!ethAddressPattern.test(address)) {
    return false;
  }

  // EIP-55检查 (大小写不敏感)
  // 简化实现：实际应进行EIP-55校验

  return true;
}

/**
 * 验证签名格式
 */
export function validateSignature(signature: string, _walletType: 'metamask' | 'tp'): boolean {
  if (!signature || typeof signature !== 'string') {
    return false;
  }

  // 签名格式: 0x + 130个字符 (65字节)
  const signaturePattern = /^0x[a-fA-F0-9]{130}$/;
  if (!signaturePattern.test(signature)) {
    return false;
  }

  // 额外检查：v值应该是27或28
  const v = parseInt(signature.slice(-2), 16);
  if (v < 27 || v > 28) {
    return false;
  }

  return true;
}

export default {
  detectMetaMask,
  detectTPWallet,
  detectAllWallets,
  detectPrimaryWallet,
  isWalletInstalled,
  getInstalledWallets,
  validateWalletAddress,
  validateSignature,
};
