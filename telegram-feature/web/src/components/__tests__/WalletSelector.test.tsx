/**
 * WalletSelector 单元测试
 * 测试钱包选择弹窗的渲染、检测和选择功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WalletSelector } from '../WalletSelector';

// Mock wallet detection
vi.mock('../../utils/walletDetector', () => ({
  detectMetaMask: vi.fn(),
  detectTPWallet: vi.fn(),
}));

// Mock language context
vi.mock('../../contexts/LanguageContext', () => ({
  useLanguage: vi.fn(() => ({
    language: 'en',
  })),
}));

// Mock translations
vi.mock('../../i18n/translations', () => ({
  t: vi.fn((key: string, lang: string) => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        'web3.selectWallet': 'Select Your Wallet',
        'web3.metamask.description': 'Popular Ethereum browser wallet',
        'web3.tp.description': 'Secure and reliable digital wallet',
        'web3.installed': 'Installed',
        'web3.notInstalled': 'Not Installed',
        'web3.install': 'Install',
        'web3.installPrompt': 'Please install {name} wallet extension first',
        'web3.connectingWallet': 'Connecting wallet...',
        'web3.confidence': 'Confidence',
        'web3.secureConnection': 'All connections are encrypted securely',
        'web3.securityInfo': 'Security Info',
        'web3.help': 'Help',
        'common.close': 'Close',
      },
      zh: {
        'web3.selectWallet': '选择您的钱包类型',
        'web3.metamask.description': '最流行的以太坊浏览器钱包',
        'web3.tp.description': '安全可靠的数字钱包',
        'web3.installed': '已安装',
        'web3.notInstalled': '未安装',
        'web3.install': '安装',
        'web3.installPrompt': '请先安装{name}钱包插件，然后刷新页面重试',
        'web3.connectingWallet': '正在连接钱包...',
        'web3.confidence': '置信度',
        'web3.secureConnection': '所有连接都是安全加密的，我们不会存储您的私钥',
        'web3.securityInfo': '安全信息',
        'web3.help': '帮助文档',
        'common.close': '关闭',
      },
    };
    return translations[lang]?.[key] || key;
  }),
}));

// Mock window.open
const mockOpen = vi.fn();
vi.stubGlobal('open', mockOpen);

describe('WalletSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('渲染测试', () => {
    it('应该渲染标题', () => {
      const mockDetectMetaMask = vi.mocked(
        require('../../utils/walletDetector').detectMetaMask
      );
      const mockDetectTPWallet = vi.mocked(
        require('../../utils/walletDetector').detectTPWallet
      );

      mockDetectMetaMask.mockReturnValue({
        isDetected: false,
        walletType: 'unknown',
        confidence: 0,
        details: {},
      });

      mockDetectTPWallet.mockReturnValue({
        isDetected: false,
        walletType: 'unknown',
        confidence: 0,
        details: {},
      });

      render(<WalletSelector onSelect={vi.fn()} onClose={vi.fn()} />);

      expect(screen.getByText('选择您的钱包类型')).toBeInTheDocument();
    });

    it('应该渲染MetaMask选项', () => {
      const mockDetectMetaMask = vi.mocked(
        require('../../utils/walletDetector').detectMetaMask
      );
      const mockDetectTPWallet = vi.mocked(
        require('../../utils/walletDetector').detectTPWallet
      );

      mockDetectMetaMask.mockReturnValue({
        isDetected: true,
        walletType: 'metamask',
        confidence: 100,
        details: { isMetaMask: true },
      });

      mockDetectTPWallet.mockReturnValue({
        isDetected: false,
        walletType: 'unknown',
        confidence: 0,
        details: {},
      });

      render(<WalletSelector onSelect={vi.fn()} onClose={vi.fn()} />);

      expect(screen.getByText('MetaMask')).toBeInTheDocument();
      expect(screen.getByText('最流行的以太坊浏览器钱包')).toBeInTheDocument();
    });

    it('应该渲染TP钱包选项', () => {
      const mockDetectMetaMask = vi.mocked(
        require('../../utils/walletDetector').detectMetaMask
      );
      const mockDetectTPWallet = vi.mocked(
        require('../../utils/walletDetector').detectTPWallet
      );

      mockDetectMetaMask.mockReturnValue({
        isDetected: false,
        walletType: 'unknown',
        confidence: 0,
        details: {},
      });

      mockDetectTPWallet.mockReturnValue({
        isDetected: true,
        walletType: 'tp',
        confidence: 100,
        details: { isTokenPocket: true },
      });

      render(<WalletSelector onSelect={vi.fn()} onClose={vi.fn()} />);

      expect(screen.getByText('TP钱包')).toBeInTheDocument();
      expect(screen.getByText('安全可靠的数字钱包')).toBeInTheDocument();
    });

    it('应该显示安装状态', () => {
      const mockDetectMetaMask = vi.mocked(
        require('../../utils/walletDetector').detectMetaMask
      );
      const mockDetectTPWallet = vi.mocked(
        require('../../utils/walletDetector').detectTPWallet
      );

      mockDetectMetaMask.mockReturnValue({
        isDetected: true,
        walletType: 'metamask',
        confidence: 100,
        details: { isMetaMask: true },
      });

      mockDetectTPWallet.mockReturnValue({
        isDetected: false,
        walletType: 'unknown',
        confidence: 0,
        details: {},
      });

      render(<WalletSelector onSelect={vi.fn()} onClose={vi.fn()} />);

      // MetaMask显示已安装
      expect(screen.getAllByText('已安装')[0]).toBeInTheDocument();

      // TP钱包显示未安装
      expect(screen.getAllByText('未安装')[0]).toBeInTheDocument();
    });

    it('应该显示置信度', () => {
      const mockDetectMetaMask = vi.mocked(
        require('../../utils/walletDetector').detectMetaMask
      );
      const mockDetectTPWallet = vi.mocked(
        require('../../utils/walletDetector').detectTPWallet
      );

      mockDetectMetaMask.mockReturnValue({
        isDetected: true,
        walletType: 'metamask',
        confidence: 95,
        details: { isMetaMask: true },
      });

      mockDetectTPWallet.mockReturnValue({
        isDetected: false,
        walletType: 'unknown',
        confidence: 0,
        details: {},
      });

      render(<WalletSelector onSelect={vi.fn()} onClose={vi.fn()} />);

      expect(screen.getByText(/置信度: 95%/)).toBeInTheDocument();
    });
  });

  describe('交互测试', () => {
    it('点击已安装的钱包应该调用onSelect', async () => {
      const mockDetectMetaMask = vi.mocked(
        require('../../utils/walletDetector').detectMetaMask
      );
      const mockDetectTPWallet = vi.mocked(
        require('../../utils/walletDetector').detectTPWallet
      );
      const mockOnSelect = vi.fn().mockResolvedValue(undefined);

      mockDetectMetaMask.mockReturnValue({
        isDetected: true,
        walletType: 'metamask',
        confidence: 100,
        details: { isMetaMask: true },
      });

      mockDetectTPWallet.mockReturnValue({
        isDetected: false,
        walletType: 'unknown',
        confidence: 0,
        details: {},
      });

      render(<WalletSelector onSelect={mockOnSelect} onClose={vi.fn()} />);

      fireEvent.click(screen.getByText('MetaMask'));

      await waitFor(() => {
        expect(mockOnSelect).toHaveBeenCalledWith('metamask');
      });
    });

    it('点击未安装的钱包不应该调用onSelect', async () => {
      const mockDetectMetaMask = vi.mocked(
        require('../../utils/walletDetector').detectMetaMask
      );
      const mockDetectTPWallet = vi.mocked(
        require('../../utils/walletDetector').detectTPWallet
      );
      const mockOnSelect = vi.fn();

      mockDetectMetaMask.mockReturnValue({
        isDetected: true,
        walletType: 'metamask',
        confidence: 100,
        details: { isMetaMask: true },
      });

      mockDetectTPWallet.mockReturnValue({
        isDetected: false,
        walletType: 'unknown',
        confidence: 0,
        details: {},
      });

      render(<WalletSelector onSelect={mockOnSelect} onClose={vi.fn()} />);

      fireEvent.click(screen.getByText('TP钱包'));

      await waitFor(() => {
        expect(mockOnSelect).not.toHaveBeenCalled();
      });
    });

    it('点击安装链接应该打开新窗口', async () => {
      const mockDetectMetaMask = vi.mocked(
        require('../../utils/walletDetector').detectMetaMask
      );
      const mockDetectTPWallet = vi.mocked(
        require('../../utils/walletDetector').detectTPWallet
      );

      mockDetectMetaMask.mockReturnValue({
        isDetected: true,
        walletType: 'metamask',
        confidence: 100,
        details: { isMetaMask: true },
      });

      mockDetectTPWallet.mockReturnValue({
        isDetected: false,
        walletType: 'unknown',
        confidence: 0,
        details: {},
      });

      render(<WalletSelector onSelect={vi.fn()} onClose={vi.fn()} />);

      fireEvent.click(screen.getByText('安装'));

      await waitFor(() => {
        expect(mockOpen).toHaveBeenCalled();
      });
    });

    it('点击关闭按钮应该调用onClose', () => {
      const mockDetectMetaMask = vi.mocked(
        require('../../utils/walletDetector').detectMetaMask
      );
      const mockDetectTPWallet = vi.mocked(
        require('../../utils/walletDetector').detectTPWallet
      );
      const mockOnClose = vi.fn();

      mockDetectMetaMask.mockReturnValue({
        isDetected: true,
        walletType: 'metamask',
        confidence: 100,
        details: { isMetaMask: true },
      });

      mockDetectTPWallet.mockReturnValue({
        isDetected: false,
        walletType: 'unknown',
        confidence: 0,
        details: {},
      });

      render(<WalletSelector onSelect={vi.fn()} onClose={mockOnClose} />);

      fireEvent.click(screen.getByLabelText('关闭'));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('连接中状态应该显示加载动画', async () => {
      const mockDetectMetaMask = vi.mocked(
        require('../../utils/walletDetector').detectMetaMask
      );
      const mockDetectTPWallet = vi.mocked(
        require('../../utils/walletDetector').detectTPWallet
      );
      const mockOnSelect = vi.fn().mockImplementation(() => {
        return new Promise((resolve) => setTimeout(resolve, 1000));
      });

      mockDetectMetaMask.mockReturnValue({
        isDetected: true,
        walletType: 'metamask',
        confidence: 100,
        details: { isMetaMask: true },
      });

      mockDetectTPWallet.mockReturnValue({
        isDetected: false,
        walletType: 'unknown',
        confidence: 0,
        details: {},
      });

      render(<WalletSelector onSelect={mockOnSelect} onClose={vi.fn()} />);

      fireEvent.click(screen.getByText('MetaMask'));

      await waitFor(() => {
        expect(screen.getByText('正在连接钱包...')).toBeInTheDocument();
      });
    });
  });

  describe('安装提示测试', () => {
    it('未安装的钱包应该显示安装提示', () => {
      const mockDetectMetaMask = vi.mocked(
        require('../../utils/walletDetector').detectMetaMask
      );
      const mockDetectTPWallet = vi.mocked(
        require('../../utils/walletDetector').detectTPWallet
      );

      mockDetectMetaMask.mockReturnValue({
        isDetected: true,
        walletType: 'metamask',
        confidence: 100,
        details: { isMetaMask: true },
      });

      mockDetectTPWallet.mockReturnValue({
        isDetected: false,
        walletType: 'unknown',
        confidence: 0,
        details: {},
      });

      render(<WalletSelector onSelect={vi.fn()} onClose={vi.fn()} />);

      const tpWalletSection = screen.getAllByRole('button')[1];
      fireEvent.mouseEnter(tpWalletSection);

      // 应该显示安装提示
      expect(
        screen.getByText(/请先安装 TP钱包 钱包插件/)
      ).toBeInTheDocument();
    });
  });

  describe('安全信息测试', () => {
    it('应该显示安全连接信息', () => {
      const mockDetectMetaMask = vi.mocked(
        require('../../utils/walletDetector').detectMetaMask
      );
      const mockDetectTPWallet = vi.mocked(
        require('../../utils/walletDetector').detectTPWallet
      );

      mockDetectMetaMask.mockReturnValue({
        isDetected: true,
        walletType: 'metamask',
        confidence: 100,
        details: { isMetaMask: true },
      });

      mockDetectTPWallet.mockReturnValue({
        isDetected: false,
        walletType: 'unknown',
        confidence: 0,
        details: {},
      });

      render(<WalletSelector onSelect={vi.fn()} onClose={vi.fn()} />);

      expect(
        screen.getByText('所有连接都是安全加密的')
      ).toBeInTheDocument();
    });

    it('应该显示帮助链接', () => {
      const mockDetectMetaMask = vi.mocked(
        require('../../utils/walletDetector').detectMetaMask
      );
      const mockDetectTPWallet = vi.mocked(
        require('../../utils/walletDetector').detectTPWallet
      );

      mockDetectMetaMask.mockReturnValue({
        isDetected: true,
        walletType: 'metamask',
        confidence: 100,
        details: { isMetaMask: true },
      });

      mockDetectTPWallet.mockReturnValue({
        isDetected: false,
        walletType: 'unknown',
        confidence: 0,
        details: {},
      });

      render(<WalletSelector onSelect={vi.fn()} onClose={vi.fn()} />);

      expect(screen.getByText('安全信息')).toBeInTheDocument();
      expect(screen.getByText('帮助文档')).toBeInTheDocument();
    });
  });
});
