/**
 * Payment Package Constants
 * Fixed pricing and credit configurations
 */

import type { PaymentPackage } from "../types/payment"

export const PAYMENT_PACKAGES: Record<
  "starter" | "pro" | "vip",
  PaymentPackage
> = {
  starter: {
    id: "starter",
    name: "初级套餐",
    description: "适合新手用户体验",
    price: {
      amount: 10,
      currency: "USDT",
      chainPreference: "polygon",
    },
    credits: {
      amount: 500,
      bonusMultiplier: 1.0,
      bonusAmount: 0,
    },
  },
  pro: {
    id: "pro",
    name: "专业套餐",
    description: "专业交易者的选择",
    price: {
      amount: 50,
      currency: "USDT",
      chainPreference: "base",
    },
    credits: {
      amount: 3000,
      bonusMultiplier: 1.1,
      bonusAmount: 300,
    },
    badge: "HOT",
  },
  vip: {
    id: "vip",
    name: "VIP 套餐",
    description: "最大价值，享受 20% 额外奖励",
    price: {
      amount: 100,
      currency: "USDT",
      chainPreference: "arbitrum",
    },
    credits: {
      amount: 8000,
      bonusMultiplier: 1.2,
      bonusAmount: 1600,
    },
    badge: "BEST SAVE",
    highlightColor: "#FFD700",
  },
}

export const PACKAGE_IDS = ["starter", "pro", "vip"] as const

export type PackageId = typeof PACKAGE_IDS[number]
