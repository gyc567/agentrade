/**
 * API 配置模块
 * 统一管理所有 API 相关配置
 * 确保前端数据都从后端 API 获取，不直接访问数据库
 */

// 默认后端 API 地址（仅当前端部署在独立域名且无VITE_API_URL时使用）
const DEFAULT_API_URL = 'https://nofx-gyc567.replit.app';

/**
 * 获取后端 API 基础 URL
 * - 开发环境使用相对路径
 * - Replit部署（后端服务前端）使用相对路径
 * - 独立前端部署使用VITE_API_URL或默认URL
 */
export function getApiBaseUrl(): string {
  // 1. 如果设置了环境变量，优先使用环境变量
  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL}/api`;
  }

  // 2. 开发环境使用相对路径
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // 3. 生产环境下，如果在浏览器中运行，默认使用相对路径
  // 这适用于同域部署（如 Vercel 反向代理或 Replit 直接服务）
  if (typeof window !== 'undefined') {
    return '/api';
  }
  
  // 4. 后台回退方案
  return `${DEFAULT_API_URL}/api`;
}

/**
 * 获取后端 API 完整 URL
 * @param endpoint API 端点（如 '/supported-exchanges'）
 * @returns 完整的 API URL
 */
export function getApiUrl(endpoint: string): string {
  // 移除开头多余的斜杠
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${getApiBaseUrl()}/${cleanEndpoint}`;
}

/**
 * 获取后端基础域名
 * @returns 后端域名（空字符串表示使用相对路径）
 */
export function getBackendUrl(): string {
  // 优先使用环境变量
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // 开发环境使用相对路径
  if (import.meta.env.DEV) {
    return '';
  }
  
  // 生产环境下，如果在浏览器中运行，默认使用相对路径
  if (typeof window !== 'undefined') {
    return '';
  }

  // 后台回退方案
  return DEFAULT_API_URL;
}

/**
 * 检查是否为开发环境
 */
export function isDevelopment(): boolean {
  return import.meta.env.DEV;
}

/**
 * 检查是否使用环境变量中的 API URL
 */
export function isUsingEnvironmentApiUrl(): boolean {
  return !!import.meta.env.VITE_API_URL;
}
