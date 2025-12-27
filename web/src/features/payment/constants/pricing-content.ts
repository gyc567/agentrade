/**
 * Pricing Content Constants
 *
 * Multilingual content for pricing page
 */

export const PRICING_FEATURES_EN = [
  'Crypto payment support',
  'Multiple blockchain networks',
  'Instant credit delivery',
  'Transaction history',
  'Flexible spending',
]

export const PRICING_FEATURES_ZH = [
  '加密货币支付',
  '多区块链网络',
  '即时积分到账',
  '交易历史记录',
  '灵活消费',
]

export const BLOCKCHAINS = [
  {
    name: 'Polygon',
    symbol: 'MATIC',
    description: 'Low fees, fast transactions',
    descriptionZh: '低手续费，快速交易',
  },
  {
    name: 'Base',
    symbol: 'ETH',
    description: 'Ethereum layer 2 by Coinbase',
    descriptionZh: 'Coinbase 的以太坊 Layer 2',
  },
  {
    name: 'Arbitrum',
    symbol: 'ARB',
    description: 'High throughput, low cost',
    descriptionZh: '高吞吐量，低成本',
  },
]

export const PRICING_FAQ_EN = [
  {
    question: 'How are credits added to my account?',
    answer:
      'Once you complete a payment, credits are added immediately to your account. You can see your balance in the Dashboard.',
  },
  {
    question: 'Can I get a refund for unused credits?',
    answer:
      'Credits are non-refundable once purchased. However, they do not expire and can be used anytime.',
  },
  {
    question: 'Which cryptocurrencies do you accept?',
    answer:
      'We currently accept USDT (Tether) on Polygon, Base, and Arbitrum networks.',
  },
  {
    question: 'Is there a limit to how many credits I can purchase?',
    answer:
      'No, you can purchase as many credits as you need. For bulk purchases, please contact support.',
  },
  {
    question: 'How do I know which package is right for me?',
    answer:
      'Check the credits-per-USDT value on each package. The VIP package offers the best value with 20% bonus credits.',
  },
]

export const PRICING_FAQ_ZH = [
  {
    question: '积分如何添加到我的账户？',
    answer:
      '支付完成后，积分将立即添加到您的账户。您可以在仪表板中查看余额。',
  },
  {
    question: '我可以获得未使用积分的退款吗？',
    answer:
      '购买后的积分不可退款。但是，它们不会过期，可以随时使用。',
  },
  {
    question: '您接受哪些加密货币？',
    answer:
      '我们目前在 Polygon、Base 和 Arbitrum 网络上接受 USDT（Tether）。',
  },
  {
    question: '购买积分有限制吗？',
    answer:
      '没有限制，您可以购买所需的任意数量的积分。如需批量购买，请联系支持。',
  },
  {
    question: '我应该选择哪个套餐？',
    answer:
      '检查每个套餐的"每 USDT 积分"价值。VIP 套餐提供最佳价值，额外赠送 20% 积分。',
  },
]

export const PRICING_COMPARISON_EN = {
  features: [
    'Base Credits',
    'Bonus Credits',
    'Cost per Credit',
    'Supported Networks',
    'Best For',
  ],
  starter: [
    '500',
    'None',
    '2.0¢',
    'Polygon, Base, Arbitrum',
    'Beginners',
  ],
  pro: [
    '3,000',
    '300 (10%)',
    '1.67¢',
    'Polygon, Base, Arbitrum',
    'Regular Traders',
  ],
  vip: [
    '8,000',
    '1,600 (20%)',
    '1.25¢',
    'Polygon, Base, Arbitrum',
    'Power Users',
  ],
}

export const PRICING_COMPARISON_ZH = {
  features: [
    '基础积分',
    '赠送积分',
    '每个积分成本',
    '支持的网络',
    '适合场景',
  ],
  starter: [
    '500',
    '无',
    '2.0¢',
    'Polygon、Base、Arbitrum',
    '初学者',
  ],
  pro: [
    '3,000',
    '300 (10%)',
    '1.67¢',
    'Polygon、Base、Arbitrum',
    '常规交易者',
  ],
  vip: [
    '8,000',
    '1,600 (20%)',
    '1.25¢',
    'Polygon、Base、Arbitrum',
    '高级用户',
  ],
}

/**
 * Helper function to get pricing content by language
 */
export function getPricingContent(lang: 'en' | 'zh' = 'en') {
  return {
    features:
      lang === 'zh'
        ? PRICING_FEATURES_ZH
        : PRICING_FEATURES_EN,
    faq:
      lang === 'zh' ? PRICING_FAQ_ZH : PRICING_FAQ_EN,
    comparison:
      lang === 'zh'
        ? PRICING_COMPARISON_ZH
        : PRICING_COMPARISON_EN,
  }
}

export default getPricingContent
