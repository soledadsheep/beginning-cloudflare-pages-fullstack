# Frontend

React frontend with Vite and Tailwind CSS.

[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/soledadsheep/beginning-cloudflare-pages-fullstack/tree/main/frontend)

## Setup

1. Install dependencies: `npm install`
2. Run locally: `npm run dev`

The app will connect to the backend at `http://localhost:8787`.

## Deploy

1. Update `wrangler.jsonc` with your backend URL: replace `https://your-backend-url.workers.dev` with the actual deployed backend URL (if using env var).
2. Deploy to Cloudflare Workers: `wrangler deploy`

Or use the deploy button above, or run `npm run deploy`.