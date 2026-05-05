/**
 * Cloudflare Worker - Supabase API Proxy for China Access
 * Deploy this to Cloudflare Workers
 */

const SUPABASE_URL = 'https://lwercdnrvxrsnjjvojfx.supabase.co';

export default {
  async fetch(request, env, ctx) {
    // 处理 CORS preflight 请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    try {
      const url = new URL(request.url);
      // 移除 /api/supabase 前缀，保留剩余路径
      let path = url.pathname.replace(/^\/api\/supabase/, '') + url.search;
      if (!path.startsWith('/')) {
        path = '/' + path;
      }

      // 构建目标URL
      const targetUrl = SUPABASE_URL + path;

      // 创建新请求，保留原始请求的所有头部
      const newRequest = new Request(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });

      // 转发请求到Supabase
      const response = await fetch(newRequest);

      // 创建新响应，添加CORS头
      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(response.headers),
      });

      // 添加CORS头
      newResponse.headers.set('Access-Control-Allow-Origin', '*');
      newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey');
      newResponse.headers.set('Access-Control-Expose-Headers', 'Content-Length, X-JSON-response-length');

      return newResponse;
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
