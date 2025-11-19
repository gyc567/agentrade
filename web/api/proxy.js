/**
 * Vercel Edge Function - API代理
 * 用于解决Vercel部署保护机制阻止API访问的问题
 * 将前端API请求代理到后端，绕过部署保护
 */

import { NextRequest, NextResponse } from 'next/server';

// 获取后端API URL
const getBackendUrl = () => {
  // 优先使用环境变量，否则使用默认URL
  return process.env.VITE_API_URL || 'https://nofx-gyc567.replit.app';
};

export const config = {
  // 匹配所有/api/*路径
  matcher: '/api/:path*',
};

export default async function handler(req) {
  try {
    // 获取原始请求路径
    const path = req.nextUrl.pathname;
    const search = req.nextUrl.search;

    // 构建目标URL
    const backendUrl = getBackendUrl();
    const targetUrl = `${backendUrl}${path}${search}`;

    console.log(`[API Proxy] ${req.method} ${path} -> ${targetUrl}`);

    // 准备请求头
    const headers = new Headers();
    const excludedHeaders = [
      'host',
      'connection',
      'keep-alive',
      'proxy-authenticate',
      'proxy-authorization',
      'te',
      'trailers',
      'transfer-encoding',
      'upgrade',
    ];

    // 复制非排除的请求头
    req.headers.forEach((value, key) => {
      if (!excludedHeaders.includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    // 添加原始IP信息
    headers.set('X-Forwarded-For', req.ip || 'unknown');
    headers.set('X-Forwarded-Proto', req.nextUrl.protocol);

    // 构建请求配置
    const requestConfig = {
      method: req.method,
      headers: headers,
    };

    // 添加请求体（对于POST/PUT/PATCH请求）
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      try {
        const body = await req.text();
        requestConfig.body = body;
      } catch (error) {
        console.warn('[API Proxy] 无法读取请求体:', error);
      }
    }

    // 执行代理请求
    const response = await fetch(targetUrl, requestConfig);

    // 获取响应头
    const responseHeaders = new Headers();
    const excludedResponseHeaders = [
      'connection',
      'keep-alive',
      'proxy-authenticate',
      'proxy-authorization',
      'te',
      'trailers',
      'transfer-encoding',
      'upgrade',
    ];

    response.headers.forEach((value, key) => {
      if (!excludedResponseHeaders.includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    // 获取响应体
    const responseText = await response.text();

    console.log(`[API Proxy] 响应: ${response.status} ${response.statusText}`);

    // 返回响应
    return new NextResponse(responseText, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('[API Proxy] 错误:', error);

    // 返回错误响应
    return NextResponse.json(
      {
        error: 'API代理失败',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
