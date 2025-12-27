/**
 * Payment Error Codes
 * Standardized error codes for all payment operations
 */

// Client validation errors
export const CLIENT_ERROR_CODES = {
  INVALID_PACKAGE: "INVALID_PACKAGE",
  INVALID_PRICE: "INVALID_PRICE",
  INVALID_CREDITS: "INVALID_CREDITS",
  INVALID_ORDER: "INVALID_ORDER",
  INVALID_USER: "INVALID_USER",
} as const

// Authentication errors
export const AUTH_ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  FORBIDDEN: "FORBIDDEN",
} as const

// Conflict errors
export const CONFLICT_ERROR_CODES = {
  DUPLICATE_ORDER: "DUPLICATE_ORDER",
  ORDER_ALREADY_PROCESSED: "ORDER_ALREADY_PROCESSED",
} as const

// Timeout errors
export const TIMEOUT_ERROR_CODES = {
  PAYMENT_TIMEOUT: "PAYMENT_TIMEOUT",
  CONFIRMATION_TIMEOUT: "CONFIRMATION_TIMEOUT",
} as const

// Server errors
export const SERVER_ERROR_CODES = {
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  SIGNATURE_VERIFICATION_FAILED: "SIGNATURE_VERIFICATION_FAILED",
  CREDITS_UPDATE_FAILED: "CREDITS_UPDATE_FAILED",
  WEBHOOK_PROCESSING_FAILED: "WEBHOOK_PROCESSING_FAILED",
} as const

// External service errors
export const EXTERNAL_ERROR_CODES = {
  CROSSMINT_ERROR: "CROSSMINT_ERROR",
  WALLET_CONNECTION_FAILED: "WALLET_CONNECTION_FAILED",
  BLOCKCHAIN_ERROR: "BLOCKCHAIN_ERROR",
} as const

// All error codes combined
export const ALL_ERROR_CODES = {
  ...CLIENT_ERROR_CODES,
  ...AUTH_ERROR_CODES,
  ...CONFLICT_ERROR_CODES,
  ...TIMEOUT_ERROR_CODES,
  ...SERVER_ERROR_CODES,
  ...EXTERNAL_ERROR_CODES,
} as const

// Error messages mapping
export const ERROR_MESSAGES: Record<string, string> = {
  // Client errors
  INVALID_PACKAGE: "套餐不存在或无效",
  INVALID_PRICE: "价格无效",
  INVALID_CREDITS: "积分数量无效",
  INVALID_ORDER: "订单数据无效",
  INVALID_USER: "用户信息无效",

  // Auth errors
  UNAUTHORIZED: "请先登录",
  TOKEN_EXPIRED: "登录已过期，请重新登录",
  FORBIDDEN: "无权限执行此操作",

  // Conflict errors
  DUPLICATE_ORDER: "该订单已被处理",
  ORDER_ALREADY_PROCESSED: "订单已处理，无法重复支付",

  // Timeout errors
  PAYMENT_TIMEOUT: "支付超时，请重试",
  CONFIRMATION_TIMEOUT: "确认超时，请检查支付状态",

  // Server errors
  INTERNAL_ERROR: "服务器内部错误，请稍后重试",
  DATABASE_ERROR: "数据库操作失败",
  SIGNATURE_VERIFICATION_FAILED: "签名验证失败",
  CREDITS_UPDATE_FAILED: "积分更新失败",
  WEBHOOK_PROCESSING_FAILED: "支付确认失败",

  // External errors
  CROSSMINT_ERROR: "支付服务暂时不可用",
  WALLET_CONNECTION_FAILED: "钱包连接失败，请检查钱包状态",
  BLOCKCHAIN_ERROR: "区块链网络错误",
} as const
