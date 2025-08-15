export interface Env {
  UPSTREAM_KEY?: string;    // set with: wrangler secret put UPSTREAM_KEY
  TARGET_URL?: string;      // optional: set in wrangler.jsonc "vars"
}

function corsHeaders() {
  const h = new Headers();
  h.set('access-control-allow-origin', '*');
  h.set('access-control-allow-headers', '*');
  h.set('access-control-allow-methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  return h;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    // ---- set your upstream endpoint here ----
    const upstream = env.TARGET_URL ?? 'https://script.google.com/macros/s/DEPLOYMENT_ID/exec';

    // Preflight for safety (not strictly needed for server-to-server calls)
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.text();

    // Clone incoming headers and add your upstream key (kept secret in CF)
    const hdrs = new Headers(req.headers);
    if (env.UPSTREAM_KEY) hdrs.set('X-API-KEY', env.UPSTREAM_KEY);

    // Follow redirects upstream
    const r = await fetch(upstream, {
      method: req.method,
      headers: hdrs,
      body,
      redirect: 'follow'
    });

    // Pass through response, plus CORS + sensible content-type default
    const h = corsHeaders();
    r.headers.forEach((v, k) => h.set(k, v));
    if (!h.get('content-type')) h.set('content-type', 'application/json');

    return new Response(await r.text(), { status: r.status, headers: h });
  }
};
