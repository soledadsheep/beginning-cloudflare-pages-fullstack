// src/modules/account/account.openapi.ts
import { UserLoginRoute } from './openapis/login.route';
import { UserLogoutRoute } from './openapis/logout.route';
import { UserRegisterRoute } from './openapis/register.route';
import { UserForgotPasswordRoute } from './openapis/forgotPassword.route';
import { UserChangePasswordTokenRoute } from './openapis/changePasswordToken.route';
import { UserResetPasswordRoute } from './openapis/resetPassword.route';
import { UserChangePasswordRoute } from './openapis/changePassword.route';
import { UserCurrentRoute } from './openapis/getCurrentUser.router';
import { ListUsersRoute, GetUserByIdRoute, CreateUserRoute, UpdateUserRoute, DeleteUserRoute } from './openapis/userManagement.router';

export function accountOpenApi(openapi: any, authMiddleware: any, requirePermission: any) {
  openapi.post('/api/user/login', UserLoginRoute);
  openapi.post('/api/user/logout', authMiddleware, UserLogoutRoute);
  openapi.post('/api/user/register', UserRegisterRoute);
  openapi.post('/api/user/forgot-password', UserForgotPasswordRoute);
  openapi.post('/api/user/change-password-token', UserChangePasswordTokenRoute);
  openapi.post('/api/user/change-password', authMiddleware, UserChangePasswordRoute);
  openapi.post('/api/user/info', authMiddleware, UserCurrentRoute);


  // User management (REST)
  openapi.get('/api/user', authMiddleware, requirePermission('user:list'), ListUsersRoute);
  openapi.get('/api/user/:id', authMiddleware, requirePermission('user:read'), GetUserByIdRoute);
  openapi.post('/api/user', authMiddleware, requirePermission('user:create'), CreateUserRoute);
  openapi.put('/api/user/:id', authMiddleware, requirePermission('user:update'), UpdateUserRoute);
  openapi.delete('/api/user/:id', authMiddleware, requirePermission('user:delete'), DeleteUserRoute);
  openapi.post('/api/user/reset-password', authMiddleware, requirePermission('user:reset-password'), UserResetPasswordRoute);
}
