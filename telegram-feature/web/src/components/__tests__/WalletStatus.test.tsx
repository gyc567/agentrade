/**
 * WalletStatus 单元测试
 * 测试已连接钱包的状态显示和操作功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WalletStatus } from '../WalletStatus';

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
        'web3.walletStatus': 'Wallet Status',
        'web3.connectedSuccessfully': 'Connected Successfully',
        'web3.walletConnected': 'Your {name} wallet is successfully connected',
        'web3.unknownWallet': 'Unknown Wallet',
        'web3.secure': 'Secure',
        'web3.walletAddress': 'Wallet Address',
        'web3.copyAddress': 'Copy Address',
        'web3.viewOnExplorer': 'View on Explorer',
        'web3.addressCopied': 'Address copied to clipboard',
        'web3.moreDetails': 'More Details',
        'web3.connectionTime': 'Connection Time',
        'web3.network': 'Network',
        'web3.ethereumMainnet': 'Ethereum Mainnet',
        'web3.securityNotice': 'Your private key will never be sent to our servers',
        'web3.disconnectWallet': 'Disconnect Wallet',
        'web3.visitWebsite': 'Visit Website',
        'common.close': 'Close',
      },
      zh: {
        'web3.walletStatus': '钱包状态',
        'web3.connectedSuccessfully': '连接成功',
        'web3.walletConnected': '您的{name}钱包已成功连接',
        'web3.unknownWallet': '未知钱包',
        'web3.secure': '安全连接',
        'web3.walletAddress': '钱包地址',
        'web3.copyAddress': '复制地址',
        'web3.viewOnExplorer': '在浏览器中查看',
        'web3.addressCopied': '地址已复制到剪贴板',
        'web3.moreDetails': '详细信息',
        'web3.connectionTime': '连接时间',
        'web3.network': '网络',
        'web3.ethereumMainnet': '以太坊主网',
        'web3.securityNotice': '您的私钥永远不会被发送到我们的服务器',
        'web3.disconnectWallet': '断开钱包连接',
        'web3.visitWebsite': '访问官网',
        'common.close': '关闭',
      },
    };
    return translations[lang]?.[key] || key;
  }),
}));

// Mock navigator.clipboard
const mockWriteText = vi.fn();
vi.stubGlobal('navigator', {
  clipboard: {
    writeText: mockWriteText,
  },
});

// Mock window.open
const mockOpen = vi.fn();
vi.stubGlobal('open', mockOpen);

describe('WalletStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteText.mockClear();
  });

  describe('渲染测试', () => {
    it('应该渲染标题', () => {
      render(
        <WalletStatus
          address="0x1234567890123456789012345678901234567890"
          walletType="metamask"
          onDisconnect={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('钱包状态')).toBeInTheDocument();
    });

    it('应该显示连接成功信息', () => {
      render(
        <WalletStatus
          address="0x1234567890123456789012345678901234567890"
          walletType="metamask"
          onDisconnect={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('连接成功')).toBeInTheDocument();
      expect(screen.getByText('您的 MetaMask 钱包已成功连接')).toBeInTheDocument();
    });

    it('应该显示钱包类型和图标', () => {
      render(
        <WalletStatus
          address="0x1234567890123456789012345678901234567890"
          walletType="metamask"
          onDisconnect={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('MetaMask')).toBeInTheDocument();
      expect(screen.getByText('🦊')).toBeInTheDocument();
    });

    it('应该格式化显示地址', () => {
      render(
        <WalletStatus
          address="0x1234567890123456789012345678901234567890"
          walletType="metamask"
          onDisconnect={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('0x1234...7890')).toBeInTheDocument();
    });

    it('应该显示安全连接标识', () => {
      render(
        <WalletStatus
          address="0x1234567890123456789012345678901234567890"
          walletType="metamask"
          onDisconnect={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('安全连接')).toBeInTheDocument();
    });

    it('应该显示断开按钮', () => {
      render(
        <WalletStatus
          address="0x1234567890123456789012345678901234567890"
          walletType="metamask"
          onDisconnect={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('断开钱包连接')).toBeInTheDocument();
    });

    it('应该显示官网链接（对于支持的钱包）', () => {
      render(
        <WalletStatus
          address="0x1234567890123456789012345678901234567890"
          walletType="metamask"
          onDisconnect={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('访问官网')).toBeInTheDocument();
    });

    it('不应该显示官网链接（对于未知钱包）', () => {
      render(
        <WalletStatus
          address="0x1234567890123456789012345678901234567890"
          walletType="unknown"
          onDisconnect={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(screen.queryByText('访问官网')).not.toBeInTheDocument();
    });
  });

  describe('交互测试', () => {
    it('点击复制地址应该调用Clipboard API', async () => {
      mockWriteText.mockResolvedValue(undefined);

      render(
        <WalletStatus
          address="0x1234567890123456789012345678901234567890"
          walletType="metamask"
          onDisconnect={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const copyButton = screen.getByLabelText('复制地址');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(
          '0x1234567890123456789012345678901234567890'
        );
      });

      expect(screen.getByText('地址已复制到剪贴板')).toBeInTheDocument();
    });

    it('复制后应该显示成功提示，2秒后消失', async () => {
      mockWriteText.mockResolvedValue(undefined);
      vi.useFakeTimers();

      render(
        <WalletStatus
          address="0x1234567890123456789012345678901234567890"
          walletType="metamask"
          onDisconnect={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const copyButton = screen.getByLabelText('复制地址');
      fireEvent.click(copyButton);

      expect(screen.getByText('地址已复制到剪贴板')).toBeInTheDocument();

      vi.advanceTimersByTime(2000);

      expect(screen.queryByText('地址已复制到剪贴板')).not.toBeInTheDocument();

      vi.useRealTimers();
    });

    it('点击在浏览器中查看应该打开区块链浏览器', () => {
      render(
        <WalletStatus
          address="0x1234567890123456789012345678901234567890"
          walletType="metamask"
          onDisconnect={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const explorerButton = screen.getByLabelText('在浏览器中查看');
      fireEvent.click(explorerButton);

      expect(mockOpen).toHaveBeenCalledWith(
        'https://etherscan.io/address/0x1234567890123456789012345678901234567890',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('点击断开连接应该调用onDisconnect', () => {
      const mockOnDisconnect = vi.fn();

      render(
        <WalletStatus
          address="0x1234567890123456789012345678901234567890"
          walletType="metamask"
          onDisconnect={mockOnDisconnect}
          onClose={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText('断开钱包连接'));

      expect(mockOnDisconnect).toHaveBeenCalled();
    });

    it('点击关闭按钮应该调用onClose', () => {
      const mockOnClose = vi.fn();

      render(
        <WalletStatus
          address="0x1234567890123456789012345678901234567890"
          walletType="metamask"
          onDisconnect={vi.fn()}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByLabelText('关闭'));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('点击访问官网应该打开钱包官网', () => {
      render(
        <WalletStatus
          address="0x1234567890123456789012345678901234567890"
          walletType="metamask"
          onDisconnect={vi.fn()}
          onClose={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText('访问官网'));

      expect(mockOpen).toHaveBeenCalledWith(
        'https://metamask.io',
        '_blank',
        'noopener,noreferrer'
      );
    });
  });

  describe('详细信息测试', () => {
    it('默认不显示详细信息', () => {
      render(
        <WalletStatus
          address="0x1234567890123456789012345678901234567890"
          walletType="metamask"
          onDisconnect={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(screen.queryByText('连接时间')).not.toBeInTheDocument();
    });

    it('点击"详细信息"应该展开更多内容', async () => {
      render(
        <WalletStatus
          address="0x1234567890123456789012345678901234567890"
          walletType="metamask"
          onDisconnect={vi.fn()}
          onClose={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText('详细信息'));

      await waitFor(() => {
        expect(screen.getByText('连接时间')).toBeInTheDocument();
        expect(screen.getByText('网络')).toBeInTheDocument();
        expect(screen.getByText('以太坊主网')).toBeInTheDocument();
      });
    });

    it('展开后应该显示安全提示', async () => {
      render(
        <WalletStatus
          address="0x1234567890123456789012345678901234567890"
          walletType="metamask"
          onDisconnect={vi.fn()}
          onClose={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText('详细信息'));

      await waitFor(() => {
        expect(
          screen.getByText('您的私钥永远不会被发送到我们的服务器')
        ).toBeInTheDocument();
      });
    });

    it('再次点击"详细信息"应该收起内容', async () => {
      render(
        <WalletStatus
          address="0x1234567890123456789012345678901234567890"
          walletType="metamask"
          onDisconnect={vi.fn()}
          onClose={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText('详细信息'));
      await waitFor(() => {
        expect(screen.getByText('连接时间')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('详细信息'));

      await waitFor(() => {
        expect(screen.queryByText('连接时间')).not.toBeInTheDocument();
      });
    });
  });

  describe('不同钱包类型测试', () => {
    it('应该正确显示TP钱包信息', () => {
      render(
        <WalletStatus
          address="0x1234567890123456789012345678901234567890"
          walletType="tp"
          onDisconnect={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('TP钱包')).toBeInTheDocument();
      expect(screen.getByText('🔵')).toBeInTheDocument();
      expect(screen.getByText('您的 TP钱包 钱包已成功连接')).toBeInTheDocument();
    });

    it('应该正确显示未知钱包信息', () => {
      render(
        <WalletStatus
          address="0x1234567890123456789012345678901234567890"
          walletType="unknown"
          onDisconnect={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('未知钱包')).toBeInTheDocument();
      expect(screen.getByText('❓')).toBeInTheDocument();
      expect(screen.getByText('您的 未知钱包 钱包已成功连接')).toBeInTheDocument();
    });
  });

  describe('无障碍测试', () => {
    it('应该有正确的aria-label', () => {
      render(
        <WalletStatus
          address="0x1234567890123456789012345678901234567890"
          walletType="metamask"
          onDisconnect={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByRole('dialog')).toHaveAttribute(
        'aria-labelledby',
        'wallet-status-title'
      );
    });

    it('按钮应该有aria-label', () => {
      render(
        <WalletStatus
          address="0x1234567890123456789012345678901234567890"
          walletType="metamask"
          onDisconnect={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByLabelText('复制地址')).toBeInTheDocument();
      expect(screen.getByLabelText('在浏览器中查看')).toBeInTheDocument();
      expect(screen.getByLabelText('关闭')).toBeInTheDocument();
    });
  });
});
