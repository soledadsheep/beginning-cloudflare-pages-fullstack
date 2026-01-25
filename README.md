## Giới thiệu

Dự án full-stack đơn giản cho người mới làm quen Cloudflare Workers với backend (Hono, Chanfana, D1) và frontend React (Vite, Tailwind CSS).

## Cấu trúc

- `backend/`: API backend với authentication thủ công, database D1.
- `frontend/`: Giao diện người dùng React.

## Cài đặt và Chạy

### Backend (host mặc định - wrangler: http://127.0.0.1:8787/)
1. `cd backend`
2. `npm install`
3. `wrangler login`
4. `wrangler d1 create adv-db`
5. Cập nhật `wrangler.jsonc` với database_id
6. `wrangler d1 execute adv-db --file ./migrations/0001.sql`
7. `npm run dev`


### Frontend (host mặc định - vite: http://localhost:5173/)
1. `cd frontend`
2. `npm install`
3. `npm run dev`

Sample user: username: `testuser`, password: `password`

## Triển khai

### Backend
[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/soledadsheep/beginning-cloudflare-pages-fullstack/tree/main/backend)

Hoặc chạy: `wrangler deploy`

### Frontend
[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/soledadsheep/beginning-cloudflare-pages-fullstack/tree/main/frontend)

Hoặc build và deploy: `npm run build` rồi `wrangler pages deploy dist/` hoặc `npm run deploy`. Đừng quên cập nhật URL backend trong `wrangler.toml`.

## License

MIT