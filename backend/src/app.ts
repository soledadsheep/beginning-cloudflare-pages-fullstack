// src/app.ts
import { fromHono } from 'chanfana';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './env';
import { authMiddleware, requirePermission } from './middlewares/auth';
import { accountOpenApi } from './modules/account/account.openapi';
import { fileOpenApi } from './modules/attachment/attachment.openapi';
import { oauthOpenApi } from './modules/oauth/oauth.openapi';

export const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use(
  '*',
  cors({
    origin: (origin, c) => {
      const allow = c.env.CORS_ORIGINS
        .split(',')
        .map((o: string) => o.trim().replace(/\/$/, ''))
        .filter(Boolean)
        .concat([
          'https://127.0.0.1:5173',
          'https://127.0.0.1:8787',
        ]);

      if (!origin) return '*';  // Nếu không có Origin header (server-to-server, curl, Postman...)
      if (allow.includes(origin)) return origin;

      return ''; // Block tất cả origin khác
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // cache preflight 24h
    credentials: false, // nếu dùng cookie/auth header
  })
);

// --- OpenAPI adapter (Swagger) ---
app.use('/openapi.json', authMiddleware, requirePermission('view_docs'));
app.get('/docs', (c) => c.redirect('/openapi'));
const openapi_json = '/openapi.json';
export const openapi = fromHono(app, {
  openapi_url: openapi_json,
  schema: {
    info: {
      title: 'Backend API',
      version: '1.0.0',
      description: 'API documentation for Cloudflare Workers',
    },
  } as any,
});
openapi.registry.registerComponent('securitySchemes', 'BearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});
app.get('/openapi', (c) => c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Swagger UI</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui.css" crossorigin="anonymous" />
  <style>
    .login-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .login-card {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      width: 300px;
    }
    .login-card input {
      width: 100%;
      padding: 8px;
      margin: 8px 0;
      box-sizing: border-box;
    }
    .login-card button {
      width: 100%;
      padding: 10px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .error { color: red; font-size: 0.9em; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <div id="loginOverlay" class="login-overlay" style="display: none;">
    <div class="login-card">
      <h2>Login Required</h2>
      <div id="loginError" class="error"></div>
      <input type="text" id="username" placeholder="Username" autocomplete="username" />
      <input type="password" id="password" placeholder="Password" autocomplete="current-password" />
      <button id="loginBtn">Login</button>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui-bundle.js" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui-standalone-preset.js" crossorigin="anonymous"></script>
  <script>
    function showLogin() {
      document.getElementById('loginOverlay').style.display = 'flex';
    }

    function hideLogin() {
      document.getElementById('loginOverlay').style.display = 'none';
    }

    async function login(user_name, password) {
      const errorDiv = document.getElementById('loginError');
      errorDiv.innerText = '';
      try {
        const response = await fetch('/api/user/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_name, password })
        });
        const data = await response.json();
        if (data.success && data.data?.access_token) {
          const bearer = 'Bearer ' + data.data.access_token;
          localStorage.setItem('swagger_bearer_token', bearer);
          hideLogin();
          initSwagger(bearer);
        } else {
          errorDiv.innerText = data.message || 'Login failed';
        }
      } catch (err) {
        errorDiv.innerText = 'Network error. Please try again.';
      }
    }

    let swaggerUI = null;
    function initSwagger(token = null) {
      swaggerUI = SwaggerUIBundle({
        url: '${openapi_json}',
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis],
        persistAuthorization: true,
        requestInterceptor: (req) => {
          const storedToken = token || localStorage.getItem('swagger_bearer_token');
          if (storedToken) req.headers['Authorization'] = storedToken;
          return req;
        },
        responseInterceptor: (res) => {
          // Tự động lưu token sau khi login qua "Try it out"
          if (res.url?.includes('/api/user/login') && res.body) {
            const data = res.body;
            if (data.success && data.data?.access_token) {
              const bearer = 'Bearer ' + data.data.access_token;
              localStorage.setItem('swagger_bearer_token', bearer);
              if (swaggerUI && swaggerUI.authActions) swaggerUI.authActions.authorize({ BearerAuth: { value: bearer } });
            }
          }
          // Nếu lỗi 401 khi fetch spec -> hiển thị login
          if (res.status === 401 && res.url === '${openapi_json}') showLogin();
          return res;
        },
      });
    }

    // Khởi tạo: kiểm tra token hiện tại
    const existingToken = localStorage.getItem('swagger_bearer_token');
    if (existingToken) {
      // Thử fetch spec để xác nhận token còn hiệu lực
      fetch('${openapi_json}', { headers: { 'Authorization': existingToken } })
        .then(res => {
          if (res.ok) initSwagger(existingToken);
          else showLogin();
        })
        .catch(() => showLogin());
    }
    else showLogin();

    // Gắn sự kiện cho nút login
    document.getElementById('loginBtn').onclick = () => {
      const user_name = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;
      if (user_name && password) login(user_name, password);
      else document.getElementById('loginError').innerText = 'Please enter username and password';
    };
  </script>
</body>
</html>
`));

accountOpenApi(openapi, authMiddleware, requirePermission);
fileOpenApi(openapi, authMiddleware, requirePermission);
oauthOpenApi(openapi, authMiddleware, requirePermission);

export default app;