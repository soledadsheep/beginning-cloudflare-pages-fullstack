import { fromHono } from "chanfana";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { UserLogin } from "./endpoints/userLogin";
import { UserRegister } from "./endpoints/userRegister";
import { UserForgotPassword } from "./endpoints/userForgotPassword";

export interface Env {
  CORS_ORIGINS?: string;
}

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Cors configuration
app.use(
  "*",
  cors({
    origin: (origin, c) => {
      const allow = (c.env.CORS_ORIGINS ?? "http://localhost:5173")
        .split(",")
        .map(o => o.replace(/\/$/, "").trim());

      if (!origin) return "*";           // curl / server-side
      if (allow.includes(origin)) return origin;

      return ""; // block
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  })
);

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: "/",
});

// Register OpenAPI endpoints
openapi.post("/api/user/login", UserLogin);
openapi.post("/api/user/register", UserRegister);
openapi.post("/api/user/forgot-password", UserForgotPassword);

// Export the Hono app
export default app;