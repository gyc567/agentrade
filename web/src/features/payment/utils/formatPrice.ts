/**
 * Format Price Utility
 * Formats price values for display
 */

export function formatPrice(
  price: number,
  currency: string = "USDT",
  decimals: number = 2
): string {
  if (!Number.isFinite(price)) {
    return "N/A"
  }

  const formatted = price.toFixed(decimals)
  return `${formatted} ${currency}`
}

export function formatCredits(credits: number): string {
  if (!Number.isInteger(credits) || credits < 0) {
    return "0"
  }

  if (credits >= 1000000) {
    return `${(credits / 1000000).toFixed(1)}M`
  }

  if (credits >= 1000) {
    return `${(credits / 1000).toFixed(1)}K`
  }

  return credits.toString()
}

export function formatPercentage(value: number, decimals: number = 1): string {
  if (!Number.isFinite(value)) {
    return "0%"
  }

  return `${(value * 100).toFixed(decimals)}%`
}
