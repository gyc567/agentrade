import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HeaderBar from '../landing/HeaderBar';
import { api } from '../../lib/api';
import type { CreateTraderRequest, AIModel, Exchange } from '../../types';

const mockCreatePayload: CreateTraderRequest = {
  name: 'One Click Bot',
  ai_model_id: 'deepseek-v3',
  exchange_id: 'okx',
  initial_balance: 1000,
  scan_interval_minutes: 3,
  btc_eth_leverage: 5,
  altcoin_leverage: 3,
  trading_symbols: 'BTCUSDT,ETHUSDT',
  custom_prompt: '',
  override_base_prompt: false,
  system_prompt_template: 'default',
  is_cross_margin: true,
  use_coin_pool: false,
  use_oi_top: false,
};

const modalPropsSpy = vi.fn();

vi.mock('../CreditsDisplay', () => ({
  CreditsDisplay: () => <div data-testid="credits-display-mock" />,
}));

vi.mock('../Web3ConnectButton', () => ({
  default: () => <div data-testid="web3-connect-button" />,
}));

vi.mock('../../features/payment/components/PaymentModal', () => ({
  PaymentModal: () => null,
}));

vi.mock('../TraderConfigModal', () => ({
  TraderConfigModal: (props: any) => {
    modalPropsSpy(props);
    if (!props.isOpen) return null;
    return (
      <div data-testid="mock-trader-modal">
        <button data-testid="mock-modal-save" onClick={() => props.onSave?.(mockCreatePayload)}>
          save
        </button>
        <button data-testid="mock-modal-close" onClick={props.onClose}>
          close
        </button>
      </div>
    );
  },
}));

vi.mock('../../lib/api', () => ({
  api: {
    getModelConfigs: vi.fn(),
    getExchangeConfigs: vi.fn(),
    createTrader: vi.fn(),
  },
}));

const readyModels: AIModel[] = [
  {
    id: 'deepseek-v3',
    name: 'DeepSeek V3',
    provider: 'deepseek',
    enabled: true,
    apiKey: 'key',
  },
  {
    id: 'gemini-1.5',
    name: 'Gemini Ultra',
    provider: 'gemini',
    enabled: true,
    apiKey: 'key',
  },
];

const readyExchanges: Exchange[] = [
  {
    id: 'okx',
    name: 'OKX',
    type: 'cex',
    enabled: true,
    apiKey: 'key',
    secretKey: 'secret',
  },
];

const alertMock = vi.fn();

beforeAll(() => {
  vi.stubGlobal('alert', alertMock);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('HeaderBar one-click trader shortcut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    alertMock.mockReset();
    modalPropsSpy.mockClear();
    vi.mocked(api.getModelConfigs).mockResolvedValue([...readyModels]);
    vi.mocked(api.getExchangeConfigs).mockResolvedValue([...readyExchanges]);
    vi.mocked(api.createTrader).mockResolvedValue({} as any);
  });

  it('renders the shortcut button when logged in', async () => {
    render(<HeaderBar isLoggedIn language="zh" currentPage="competition" />);

    await waitFor(() => expect(api.getModelConfigs).toHaveBeenCalled());

    expect(screen.getByRole('button', { name: '一键生成交易员' })).toBeInTheDocument();
  });

  it('hides the shortcut button when logged out', () => {
    render(<HeaderBar isLoggedIn={false} language="zh" currentPage="competition" />);

    expect(screen.queryByRole('button', { name: '一键生成交易员' })).not.toBeInTheDocument();
  });

  it('opens the modal and submits via create trader API', async () => {
    render(<HeaderBar isLoggedIn language="en" currentPage="competition" />);

    await waitFor(() => expect(api.getModelConfigs).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: 'One-Click Trader' }));

    expect(await screen.findByTestId('mock-trader-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('mock-modal-save'));

    await waitFor(() => expect(api.createTrader).toHaveBeenCalledWith(mockCreatePayload));
    expect(alertMock).not.toHaveBeenCalled();
  });

  it('alerts when no eligible config exists', async () => {
    vi.mocked(api.getModelConfigs).mockResolvedValueOnce([]);
    vi.mocked(api.getExchangeConfigs).mockResolvedValueOnce([]);

    render(<HeaderBar isLoggedIn language="zh" currentPage="competition" />);

    await waitFor(() => expect(api.getModelConfigs).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: '一键生成交易员' }));
    expect(alertMock).toHaveBeenCalledWith('请先在配置页面设置DeepSeek或Gemini模型，并至少配置一个可用交易所。');
    expect(screen.queryByTestId('mock-trader-modal')).not.toBeInTheDocument();
  });
});
