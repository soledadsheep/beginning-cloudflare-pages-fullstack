# Backend

Cloudflare Workers backend with Hono, Chanfana for OpenAPI, D1 database, and manual login functionality.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/your-repo/adv-cloudflare-backend-frontend)

## Setup

1. Install dependencies: `npm install`
2. Login to Wrangler: `wrangler login`
3. Create D1 database: `wrangler d1 create adv-db`
4. Update `wrangler.jsonc` with the database_id from the create command
5. Initialize database: `wrangler d1 execute adv-db --file ./migrations/0001.sql`
6. Run locally: `npm run dev`

## CORS

Backend được cấu hình để chỉ cho phép requests từ `http://localhost:5173` (frontend local) và `https://your-frontend-domain.com` (thay bằng domain thực tế khi deploy). Nếu cần thêm domain, cập nhật `origin` trong `index.ts`.

## API

- POST /api/user/login
- POST /api/user/register
- POST /api/user/forgot-password

Sample user: username `testuser`, password `password`

## Deploy

Run `wrangler deploy` to deploy to Cloudflare Workers.