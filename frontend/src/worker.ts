export interface Env {
	STATIC_ASSETS: Fetcher;
	API_BASE_URL: string;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		// API endpoint for config
		if (url.pathname === '/api/config') {
			return new Response(JSON.stringify({ apiBaseUrl: env.API_BASE_URL }), {
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Serve static assets
		const page = url.pathname === '/' ? '/index.html' : url.pathname;
		return env.STATIC_ASSETS.fetch(new URL(page, request.url));
	},
};