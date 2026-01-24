import { fromHono } from "chanfana";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { UserLogin } from "./endpoints/userLogin";
import { UserRegister } from "./endpoints/userRegister";
import { UserForgotPassword } from "./endpoints/userForgotPassword";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use(
	"*",
	cors({
		origin: ["http://localhost:5173", "https://your-frontend-domain.com"], // Thay bằng domain thực tế
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["POST", "GET", "OPTIONS"],
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
