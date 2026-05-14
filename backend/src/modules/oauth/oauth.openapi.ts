// backend/src/modules/oauth/oauth.openapi.ts
import { OAuthAuthorizeRoute, OAuthCallbackRoute } from './openapis/oauth.route';
import { ListProvidersRoute, GetProviderByNameRoute, CreateProviderRoute, UpdateProviderRoute, DeleteProviderRoute, ListConnectionsRoute } from './openapis/oauthManagement.route';

export function oauthOpenApi(openapi: any, authMiddleware: any, requirePermission?: any) {
    openapi.get('/api/oauth/:provider/authorize', OAuthAuthorizeRoute);
    openapi.get('/api/oauth/:provider/callback', OAuthCallbackRoute);

    // Provider management routes (admin)
    openapi.get('/api/oauth/provider', authMiddleware, requirePermission('oauth_provider:list'), ListProvidersRoute);
    openapi.get('/api/oauth/provider/:name', authMiddleware, requirePermission('oauth_provider:read'), GetProviderByNameRoute);
    openapi.post('/api/oauth/provider', authMiddleware, requirePermission('oauth_provider:create'), CreateProviderRoute);
    openapi.put('/api/oauth/provider/:id', authMiddleware, requirePermission('oauth_provider:update'), UpdateProviderRoute);
    openapi.delete('/api/oauth/provider/:id', authMiddleware, requirePermission('oauth_provider:delete'), DeleteProviderRoute);

    openapi.get('/api/oauth/connection', authMiddleware, requirePermission('oauth_connection:list'), ListConnectionsRoute);
}
