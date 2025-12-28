import type { AIModel, Exchange } from '../types';

export const PLATFORM_MODEL_KEYWORDS = ['deepseek', 'gemini'];

export const hasValue = (value?: string | null): boolean =>
  Boolean(value && value.trim().length > 0);

export const filterEnabledModels = (models: AIModel[] = []): AIModel[] =>
  models.filter((model) => model.enabled && hasValue(model.apiKey));

export const filterPlatformModels = (
  models: AIModel[],
  keywords: string[] = PLATFORM_MODEL_KEYWORDS
): AIModel[] => {
  const loweredKeywords = keywords.map((keyword) => keyword.toLowerCase());
  return models.filter((model) => {
    const id = (model.id || '').toLowerCase();
    const name = (model.name || '').toLowerCase();
    return loweredKeywords.some(
      (keyword) => id.includes(keyword) || name.includes(keyword)
    );
  });
};

export const isExchangeReady = (exchange: Exchange): boolean => {
  if (!exchange.enabled) return false;

  if (exchange.id === 'aster') {
    return (
      hasValue(exchange.asterUser) &&
      hasValue(exchange.asterSigner) &&
      hasValue(exchange.asterPrivateKey)
    );
  }

  if (exchange.id === 'hyperliquid') {
    return hasValue(exchange.apiKey) && hasValue(exchange.hyperliquidWalletAddr);
  }

  return hasValue(exchange.apiKey) && hasValue(exchange.secretKey);
};

export const filterReadyExchanges = (
  exchanges: Exchange[] = []
): Exchange[] => exchanges.filter(isExchangeReady);
