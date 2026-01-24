# Adv Cloudflare Backend Frontend

Dự án full-stack đơn giản cho người mới làm quen Cloudflare Workers với backend (Hono, Chanfana, D1) và frontend React (Vite, Tailwind CSS).

## Cấu trúc

- `backend/`: API backend với authentication thủ công, database D1.
- `frontend/`: Giao diện người dùng React.

## Cài đặt và Chạy

### Backend
1. `cd backend`
2. `npm install`
3. `wrangler login`
4. `wrangler d1 create adv-db`
5. Cập nhật `wrangler.jsonc` với database_id
6. `wrangler d1 execute adv-db --file ./migrations/0001.sql`
7. `npm run dev`
host mặc định là http://127.0.0.1:8787/ (wrangler)

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`
host mặc định là http://localhost:5173/ (vite)

## Deploy

### Backend
[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/your-repo/adv-cloudflare-backend-frontend)

Hoặc chạy: `wrangler deploy`

### Frontend
[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/your-repo/adv-cloudflare-backend-frontend)

Hoặc build và deploy lên Cloudflare Pages.

## License

MIT