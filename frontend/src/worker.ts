export interface Env {
	STATIC_ASSETS: Fetcher;
	API_BASE_URL: string;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const apiBaseUrl = env.API_BASE_URL?.trim() || 'https://127.0.0.1:8787';

		// API endpoint for config
		if (url.pathname === '/api/config') {
			return new Response(JSON.stringify({ apiBaseUrl }), {
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Serve static assets
		const page = url.pathname === '/' ? '/index.html' : url.pathname;
		const res = await env.STATIC_ASSETS.fetch(new URL(page, request.url));
		if (res.status === 404) {
			return new Response('Not Found', { status: 404 });
			//return env.STATIC_ASSETS.fetch(new URL('/index.html', request.url));
		}
		return res;
	},
};