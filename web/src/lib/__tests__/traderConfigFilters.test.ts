import {
  filterEnabledModels,
  filterPlatformModels,
  filterReadyExchanges,
  PLATFORM_MODEL_KEYWORDS,
} from '../traderConfigFilters';
import type { AIModel, Exchange } from '../../types';

const baseModel = (overrides: Partial<AIModel>): AIModel => ({
  id: 'model',
  name: 'Model',
  provider: 'provider',
  enabled: true,
  ...overrides,
});

const baseExchange = (overrides: Partial<Exchange>): Exchange => ({
  id: 'okx',
  name: 'OKX',
  type: 'cex',
  enabled: true,
  apiKey: 'key',
  secretKey: 'secret',
  ...overrides,
});

describe('traderConfigFilters', () => {
  describe('filterEnabledModels', () => {
    it('keeps only enabled models with API keys', () => {
      const models: AIModel[] = [
        baseModel({ id: 'deepseek', apiKey: 'abc', enabled: true }),
        baseModel({ id: 'gemini', apiKey: '', enabled: true }),
        baseModel({ id: 'claude', apiKey: 'xyz', enabled: false }),
      ];

      const filtered = filterEnabledModels(models);
      expect(filtered).toEqual([
        expect.objectContaining({ id: 'deepseek' }),
      ]);
    });
  });

  describe('filterPlatformModels', () => {
    it('filters by configured keyword list', () => {
      const models: AIModel[] = [
        baseModel({ id: 'deepseek-v3', name: 'DeepSeek V3' }),
        baseModel({ id: 'openai', name: 'OpenAI GPT' }),
        baseModel({ id: 'gemini-ultra', name: 'Gemini Ultra' }),
      ];

      const filtered = filterPlatformModels(models, PLATFORM_MODEL_KEYWORDS);
      expect(filtered.map((m) => m.id)).toEqual(['deepseek-v3', 'gemini-ultra']);
    });

    it('supports custom keyword overrides', () => {
      const models: AIModel[] = [
        baseModel({ id: 'alpha', name: 'AlphaModel' }),
        baseModel({ id: 'beta', name: 'BetaModel' }),
      ];

      const filtered = filterPlatformModels(models, ['beta']);
      expect(filtered.map((m) => m.id)).toEqual(['beta']);
    });
  });

  describe('filterReadyExchanges', () => {
    it('keeps generic exchanges with api + secret keys', () => {
      const exchanges: Exchange[] = [
        baseExchange({ id: 'okx', apiKey: 'k', secretKey: 's' }),
        baseExchange({ id: 'binance', apiKey: '', secretKey: 's' }),
      ];

      const filtered = filterReadyExchanges(exchanges);
      expect(filtered.map((e) => e.id)).toEqual(['okx']);
    });

    it('validates Aster-specific credentials', () => {
      const exchanges: Exchange[] = [
        baseExchange({
          id: 'aster',
          asterUser: 'user',
          asterSigner: 'signer',
          asterPrivateKey: 'pk',
        }),
        baseExchange({ id: 'aster', asterUser: 'user', asterSigner: '', asterPrivateKey: 'pk' }),
      ];

      const filtered = filterReadyExchanges(exchanges);
      expect(filtered).toHaveLength(1);
    });

    it('validates Hyperliquid-specific credentials', () => {
      const exchanges: Exchange[] = [
        baseExchange({
          id: 'hyperliquid',
          apiKey: 'k',
          hyperliquidWalletAddr: 'addr',
          secretKey: undefined,
        }),
        baseExchange({
          id: 'hyperliquid',
          apiKey: '',
          hyperliquidWalletAddr: 'addr',
          secretKey: undefined,
        }),
      ];

      const filtered = filterReadyExchanges(exchanges);
      expect(filtered).toHaveLength(1);
    });
  });
});
