// src/modules/account/account.routes.ts
import { Hono } from 'hono';
import { Env } from '../../env';
import { loginHandler } from './handlers/login';
import { registerHandler } from './handlers/register';
import { forgotPasswordHandler } from './handlers/forgotPassword';
import { resetPasswordHandler } from './handlers/resetPassword';

export function accountRoutes(app: Hono<{ Bindings: Env }>) {

	app.post('/api/user/login', loginHandler);
	app.post('/api/user/register', registerHandler);
	app.post('/api/user/forgot-password', forgotPasswordHandler);
	app.post('/api/user/reset-password', resetPasswordHandler);

}
