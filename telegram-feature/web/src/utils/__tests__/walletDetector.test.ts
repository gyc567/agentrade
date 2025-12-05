/**
 * walletDetector 单元测试
 * 测试钱包检测功能的准确性和可靠性
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  detectMetaMask,
  detectTPWallet,
  detectAllWallets,
  detectPrimaryWallet,
  isWalletInstalled,
  getInstalledWallets,
  validateWalletAddress,
  validateSignature,
} from '../walletDetector';

describe('walletDetector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('MetaMask检测', () => {
    it('应该检测到已安装的MetaMask', () => {
      // 模拟MetaMask存在
      Object.defineProperty(window, 'ethereum', {
        value: {
          isMetaMask: true,
          request: vi.fn(),
        },
        writable: true,
      });

      const result = detectMetaMask();

      expect(result.isDetected).toBe(true);
      expect(result.walletType).toBe('metamask');
      expect(result.confidence).toBe(95);
      expect(result.details.isMetaMask).toBe(true);
    });

    it('应该检测到多个提供商中的MetaMask', () => {
      Object.defineProperty(window, 'ethereum', {
        value: {
          providers: [
            { isMetaMask: false },
            { isMetaMask: true },
            { isMetaMask: false },
          ],
          request: vi.fn(),
        },
        writable: true,
      });

      const result = detectMetaMask();

      expect(result.isDetected).toBe(true);
      expect(result.confidence).toBe(100);
    });

    it('不应该检测未安装的MetaMask', () => {
      Object.defineProperty(window, 'ethereum', {
        value: {
          isMetaMask: false,
          request: vi.fn(),
        },
        writable: true,
      });

      const result = detectMetaMask();

      expect(result.isDetected).toBe(false);
      expect(result.walletType).toBe('unknown');
      expect(result.confidence).toBe(0);
    });

    it('当window.ethereum不存在时应该返回未检测', () => {
      Object.defineProperty(window, 'ethereum', {
        value: undefined,
        writable: true,
      });

      const result = detectMetaMask();

      expect(result.isDetected).toBe(false);
      expect(result.walletType).toBe('unknown');
    });
  });

  describe('TP钱包检测', () => {
    it('应该检测到已安装的TP钱包', () => {
      Object.defineProperty(window, 'ethereum', {
        value: {
          isTokenPocket: true,
          isTp: true,
          request: vi.fn(),
        },
        writable: true,
      });

      const result = detectTPWallet();

      expect(result.isDetected).toBe(true);
      expect(result.walletType).toBe('tp');
      expect(result.confidence).toBe(90);
      expect(result.details.isTokenPocket).toBe(true);
      expect(result.details.isTp).toBe(true);
    });

    it('应该通过扩展ID检测TP钱包', () => {
      Object.defineProperty(window, 'ethereum', {
        value: {
          request: vi.fn(),
        },
        writable: true,
      });

      Object.defineProperty(window, 'chrome', {
        value: {
          runtime: {
            id: 'mfgccjchihhkkindpeiilhmdfjcoondh',
          },
        },
        writable: true,
      });

      const result = detectTPWallet();

      expect(result.isDetected).toBe(true);
      expect(result.confidence).toBe(95);
    });

    it('应该通过User Agent检测TP钱包', () => {
      Object.defineProperty(window, 'ethereum', {
        value: {
          request: vi.fn(),
        },
        writable: true,
      });

      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 TokenPocket',
        writable: true,
      });

      const result = detectTPWallet();

      expect(result.confidence).toBeGreaterThan(80);
    });

    it('应该检测多个提供商中的TP钱包', () => {
      Object.defineProperty(window, 'ethereum', {
        value: {
          providers: [
            { isTokenPocket: false },
            { isTokenPocket: true },
            { isMetaMask: true },
          ],
          request: vi.fn(),
        },
        writable: true,
      });

      const result = detectTPWallet();

      expect(result.isDetected).toBe(true);
      expect(result.confidence).toBe(100);
    });

    it('不应该检测未安装的TP钱包', () => {
      Object.defineProperty(window, 'ethereum', {
        value: {
          request: vi.fn(),
        },
        writable: true,
      });

      const result = detectTPWallet();

      expect(result.isDetected).toBe(false);
      expect(result.walletType).toBe('unknown');
    });

    it('当window.ethereum不存在时应该返回未检测', () => {
      Object.defineProperty(window, 'ethereum', {
        value: undefined,
        writable: true,
      });

      const result = detectTPWallet();

      expect(result.isDetected).toBe(false);
      expect(result.walletType).toBe('unknown');
    });
  });

  describe('detectAllWallets', () => {
    it('应该检测所有已安装的钱包', () => {
      Object.defineProperty(window, 'ethereum', {
        value: {
          isMetaMask: true,
          request: vi.fn(),
        },
        writable: true,
      });

      const results = detectAllWallets();

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].walletType).toBe('metamask');
    });

    it('应该按优先级排序钱包', () => {
      Object.defineProperty(window, 'ethereum', {
        value: {
          providers: [
            { isMetaMask: true },
            { isTokenPocket: true },
          ],
          request: vi.fn(),
        },
        writable: true,
      });

      const results = detectAllWallets();

      expect(results[0].walletType).toBe('metamask');
    });
  });

  describe('detectPrimaryWallet', () => {
    it('应该返回主钱包', () => {
      Object.defineProperty(window, 'ethereum', {
        value: {
          isMetaMask: true,
          request: vi.fn(),
        },
        writable: true,
      });

      const primaryWallet = detectPrimaryWallet();

      expect(primaryWallet).not.toBeNull();
      expect(primaryWallet?.walletType).toBe('metamask');
    });

    it('当没有钱包时应该返回null', () => {
      Object.defineProperty(window, 'ethereum', {
        value: undefined,
        writable: true,
      });

      const primaryWallet = detectPrimaryWallet();

      expect(primaryWallet).toBeNull();
    });
  });

  describe('isWalletInstalled', () => {
    it('应该正确检查MetaMask是否安装', () => {
      Object.defineProperty(window, 'ethereum', {
        value: {
          isMetaMask: true,
          request: vi.fn(),
        },
        writable: true,
      });

      expect(isWalletInstalled('metamask')).toBe(true);
      expect(isWalletInstalled('tp')).toBe(false);
    });

    it('应该正确检查TP钱包是否安装', () => {
      Object.defineProperty(window, 'ethereum', {
        value: {
          isTokenPocket: true,
          request: vi.fn(),
        },
        writable: true,
      });

      expect(isWalletInstalled('tp')).toBe(true);
      expect(isWalletInstalled('metamask')).toBe(false);
    });
  });

  describe('getInstalledWallets', () => {
    it('应该返回已安装钱包列表', () => {
      Object.defineProperty(window, 'ethereum', {
        value: {
          isMetaMask: true,
          request: vi.fn(),
        },
        writable: true,
      });

      const wallets = getInstalledWallets();

      expect(wallets).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'metamask',
            isInstalled: true,
          }),
        ])
      );
    });
  });

  describe('validateWalletAddress', () => {
    it('应该验证有效的以太坊地址', () => {
      const validAddress = '0x1234567890123456789012345678901234567890';
      expect(validateWalletAddress(validAddress, 'metamask')).toBe(true);
      expect(validateWalletAddress(validAddress, 'tp')).toBe(true);
    });

    it('应该拒绝无效的地址', () => {
      expect(validateWalletAddress('invalid', 'metamask')).toBe(false);
      expect(validateWalletAddress('', 'metamask')).toBe(false);
      expect(validateWalletAddress(null as any, 'metamask')).toBe(false);
      expect(validateWalletAddress('0x123', 'metamask')).toBe(false);
    });

    it('应该拒绝非字符串输入', () => {
      expect(validateWalletAddress(123 as any, 'metamask')).toBe(false);
      expect(validateWalletAddress({} as any, 'metamask')).toBe(false);
    });
  });

  describe('validateSignature', () => {
    it('应该验证有效的签名', () => {
      const validSignature =
        '0x1234567890123456789012345678901234567890' + '0'.repeat(130);
      expect(validateSignature(validSignature, 'metamask')).toBe(true);
      expect(validateSignature(validSignature, 'tp')).toBe(true);
    });

    it('应该拒绝无效的签名', () => {
      expect(validateSignature('invalid', 'metamask')).toBe(false);
      expect(validateSignature('', 'metamask')).toBe(false);
      expect(validateSignature(null as any, 'metamask')).toBe(false);
      expect(validateSignature('0x123', 'metamask')).toBe(false);
    });

    it('应该验证签名的v值', () => {
      // v值太小 (<27)
      const invalidSignatureV = '0x' + '0'.repeat(130);
      expect(validateSignature(invalidSignatureV, 'metamask')).toBe(false);

      // v值太大 (>28)
      const invalidSignatureV2 =
        '0x' + 'f'.repeat(130);
      expect(validateSignature(invalidSignatureV2, 'metamask')).toBe(false);
    });

    it('应该拒绝非字符串输入', () => {
      expect(validateSignature(123 as any, 'metamask')).toBe(false);
      expect(validateSignature({} as any, 'metamask')).toBe(false);
    });
  });

  describe('置信度评分', () => {
    it('MetaMask应该有高置信度评分', () => {
      Object.defineProperty(window, 'ethereum', {
        value: {
          isMetaMask: true,
          request: vi.fn(),
        },
        writable: true,
      });

      const result = detectMetaMask();

      expect(result.confidence).toBeGreaterThanOrEqual(95);
    });

    it('TP钱包应该有高置信度评分', () => {
      Object.defineProperty(window, 'ethereum', {
        value: {
          isTokenPocket: true,
          request: vi.fn(),
        },
        writable: true,
      });

      const result = detectTPWallet();

      expect(result.confidence).toBeGreaterThanOrEqual(90);
    });

    it('多个指标应该提高置信度', () => {
      Object.defineProperty(window, 'ethereum', {
        value: {
          isTokenPocket: true,
          providers: [{ isTokenPocket: true }],
          chainId: '0x1',
          request: vi.fn(),
        },
        writable: true,
      });

      Object.defineProperty(navigator, 'userAgent', {
        value: 'TokenPocket Browser',
        writable: true,
      });

      const result = detectTPWallet();

      expect(result.confidence).toBeGreaterThan(90);
    });
  });

  describe('Edge Cases', () => {
    it('应该处理window对象不存在的情况', () => {
      const originalWindow = globalThis.window;
      delete (globalThis as any).window;

      const result = detectMetaMask();

      expect(result.isDetected).toBe(false);

      globalThis.window = originalWindow;
    });

    it('应该处理异常而不崩溃', () => {
      Object.defineProperty(window, 'ethereum', {
        value: {
          isMetaMask: true,
          request: () => {
            throw new Error('Error');
          },
        },
        writable: true,
      });

      const result = detectMetaMask();

      expect(result.isDetected).toBe(true);
    });

    it('应该处理循环引用', () => {
      Object.defineProperty(window, 'ethereum', {
        value: {
          isMetaMask: true,
          request: vi.fn(),
          toString() {
            return '[object Window]';
          },
        },
        writable: true,
      });

      const result = detectMetaMask();

      expect(result.isDetected).toBe(true);
    });
  });
});
