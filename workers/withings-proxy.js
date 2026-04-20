/**
 * Cloudflare Worker — Withings OAuth2 Token Proxy
 *
 * Deploy to Cloudflare Workers (free tier):
 *   1. Go to dash.cloudflare.com → Workers & Pages → Create
 *   2. Paste this code
 *   3. Deploy
 *   4. Copy the worker URL and paste it into the app's Configuration
 *      as withings.proxyUrl (e.g. https://withings-proxy.yourname.workers.dev)
 *
 * This worker proxies the OAuth2 token exchange request to Withings API
 * because Withings doesn't set CORS headers on their token endpoint.
 */

export default {
  async fetch(request) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const body = await request.json();

      // Forward to Withings token endpoint
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(body)) {
        params.append(key, value);
      }

      const res = await fetch('https://wbsapi.withings.net/v2/oauth2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      const data = await res.json();

      return new Response(JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
