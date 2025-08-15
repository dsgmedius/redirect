export default {
  async fetch(req, env) {
    // Set your target API:
    const url = 'https://script.google.com/macros/s/AKfycbwOjHpDltCIM21wrKz_TAl9Q_kyC8ifMFrnA8BB7TFogw_UpbRAxZdu6UgMbQA_Q3h-/exec';

    // Optional: simple shared secret check
    const key = req.headers.get('x-api-key');
    if (env.API_KEY && key !== env.API_KEY) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Proxy the request and follow redirects
    const body = req.method === 'GET' ? undefined : await req.text();
    const r = await fetch(url, {
      method: req.method,
      headers: req.headers,
      body,
      redirect: 'follow'
    });

    // CORS for your Custom GPT Action
    const h = new Headers(r.headers);
    h.set('access-control-allow-origin', '*');
    h.set('access-control-allow-headers', '*');
    h.set('content-type', h.get('content-type') || 'application/json');

    return new Response(await r.text(), { status: r.status, headers: h });
  }
}
