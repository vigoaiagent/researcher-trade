import { FastifyInstance } from 'fastify';
import https from 'https';

// 使用 https 模块直接发请求，绕过代理
async function fetchWithoutProxy(url: string, options: {
  method: string;
  headers: Record<string, string>;
  body: string;
}): Promise<{ ok: boolean; status: number; json: () => Promise<any>; text: () => Promise<string> }> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);

    const req = https.request({
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method,
      headers: options.headers,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode! >= 200 && res.statusCode! < 300,
          status: res.statusCode!,
          json: async () => JSON.parse(data),
          text: async () => data,
        });
      });
    });

    req.on('error', reject);
    req.write(options.body);
    req.end();
  });
}

// Dify API 代理路由
export async function aiRoutes(fastify: FastifyInstance) {
  // 代理 Dify chat-messages 请求
  fastify.post<{
    Body: {
      query: string;
      user: string;
      conversation_id?: string;
      inputs?: Record<string, any>;
    };
  }>('/chat', async (request, reply) => {
    const DIFY_API_KEY = process.env.DIFY_API_KEY;
    const DIFY_API_ENDPOINT = process.env.DIFY_API_ENDPOINT || 'https://api.dify.ai/v1';

    if (!DIFY_API_KEY) {
      return reply.status(500).send({ error: 'Dify API key not configured on server' });
    }

    const { query, user, conversation_id, inputs } = request.body;

    try {
      console.log('[AI Proxy] Sending request to Dify:', DIFY_API_ENDPOINT);

      const response = await fetchWithoutProxy(`${DIFY_API_ENDPOINT}/chat-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DIFY_API_KEY}`,
        },
        body: JSON.stringify({
          inputs: inputs || {},
          query,
          response_mode: 'blocking',
          conversation_id: conversation_id || undefined,
          user,
        }),
      });

      console.log('[AI Proxy] Dify response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AI Proxy] Dify error:', errorText);
        return reply.status(response.status).send({
          error: 'Dify API error',
          details: errorText
        });
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('[AI Proxy] Error:', error);
      return reply.status(500).send({
        error: 'Failed to call Dify API',
        message: error.message
      });
    }
  });
}
