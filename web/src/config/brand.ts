/**
 * 品牌配置 - 统一管理所有品牌相关的常量
 * 修改品牌信息时只需修改此文件
 */

export const BRAND = {
  // 品牌名称
  name: 'PumpStrategy',
  
  // 品牌标语
  tagline: {
    en: 'AI Trading Strategy Platform',
    zh: 'AI交易策略平台',
  },
  
  // Logo 路径
  logo: {
    simple: '/icons/PumpStrategy_Logo_Simple.svg',
    full: '/icons/PumpStrategy_Logo.svg',
  },
  
  // 域名
  domain: 'pumpstrategy.io',
  
  // 社交媒体
  social: {
    twitter: 'https://x.com/EricBlock2100',
  },
  
  // 颜色主题
  colors: {
    primary: '#F0B90B',
    primaryGradientStart: '#F0B90B',
    primaryGradientEnd: '#FCD535',
  },
  
  // 版权信息
  copyright: {
    year: new Date().getFullYear(),
    holder: 'PumpStrategy',
  },
} as const;

// 类型导出
export type Brand = typeof BRAND;
