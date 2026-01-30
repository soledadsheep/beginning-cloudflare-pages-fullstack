// src/modules/account/account.openapi.ts
import { UserLoginRoute } from './openapis/login.route';
import { UserRegisterRoute } from './openapis/register.route';
import { UserForgotPasswordRoute } from './openapis/forgotPassword.route';
import { UserChangePasswordTokenRoute } from './openapis/changePasswordToken.route';
import { UserResetPasswordRoute } from './openapis/resetPassword.route';
import { UserChangePasswordRoute } from './openapis/changePassword.route';
import { UserCurrentRoute } from './openapis/getCurrentUser.router';
import { GetUserRoute } from './openapis/getUset.router';

export function accountOpenApi(openapi: any, authMiddleware: any, requirePermission: any) {
  openapi.post('/api/user/login', UserLoginRoute);
  openapi.post('/api/user/register', UserRegisterRoute);
  openapi.post('/api/user/forgot-password', UserForgotPasswordRoute);
  openapi.post('/api/user/change-password-token', UserChangePasswordTokenRoute);
  openapi.post('/api/user/reset-password', authMiddleware, UserResetPasswordRoute);
  openapi.post('/api/user/change-password', authMiddleware, UserChangePasswordRoute);
  openapi.post('/api/user/info', authMiddleware, UserCurrentRoute);
  openapi.post('/api/user/list', authMiddleware, requirePermission('user:list'), GetUserRoute);
}
