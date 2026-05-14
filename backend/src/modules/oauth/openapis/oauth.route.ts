// backend/src/modules/oauth/openapis/oauth.route.ts
import { OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { OAuthRepository } from '../oauth.repository';
import { OAuthService } from '../oauth.service';
import { jsonError } from '../../../shared/response';
import type { AppContext } from '../../../types';
import { signToken } from '../../../middlewares/auth';
import { AccountRepository } from '../../account/account.repository';
import { CreateOrUpdateUserInput } from '../../account/account.types';
import { hashPassword } from '../../../shared/crypto/password';

export class OAuthAuthorizeRoute extends OpenAPIRoute {
    override schema = {
        tags: ['OAuth'],
        summary: 'Redirect to OAuth provider',
        request: {
            params: z.object({
                provider: z.string(),
            }),
        },
        responses: {
            302: { description: 'Redirect to provider' },
            404: { description: 'Provider not found' },
        },
    };
    override async handle(c: AppContext) {
        const { params: { provider } } = await this.getValidatedData<typeof this.schema>();
        const oauthService = new OAuthService(new OAuthRepository());
        const config = await oauthService.getProvider(provider);
        if (!config) return jsonError('Provider not found', 404);

        const state = crypto.randomUUID();
        c.header('Set-Cookie', `oauth_state=${state}; HttpOnly; Path=/; Max-Age=600; SameSite=Lax`);
        const callbackUrl = `${c.env.BACKEND_URL}/api/auth/${provider}/callback`;
        const authUrl = await oauthService.buildAuthUrl(config, state, callbackUrl);
        return c.redirect(authUrl);
    }
}

export class OAuthCallbackRoute extends OpenAPIRoute {
    override schema = {
        tags: ['OAuth'],
        summary: 'OAuth callback',
        request: {
            params: z.object({
                provider: z.string(),
            }),
            query: z.object({
                code: z.string().optional(),
                state: z.string().optional(),
                error: z.string().optional(),
            }),
        },
        responses: {
            302: { description: 'Redirect to frontend with token' },
            400: { description: 'Missing code or invalid state' },
            404: { description: 'Provider not found' },
        },
    };
    override async handle(c: AppContext) {
        const { params: { provider }, query: { code, state, error } } = await this.getValidatedData<typeof this.schema>();

        if (error) return jsonError(`OAuth error: ${error}`, 400);
        if (!code) return jsonError('Missing code', 400);

        const cookieHeader = c.req.header('cookie') || '';
        const cookieState = cookieHeader
            .split(';')
            .map((part: string) => part.trim())
            .find((part: string) => part.startsWith('oauth_state='))
            ?.split('=')[1] ?? null;
        if (state !== cookieState) return jsonError('Invalid state', 400);

        const oauthRepo = new OAuthRepository();
        const oauthService = new OAuthService(oauthRepo);
        const config = await oauthService.getProvider(provider);
        if (!config) return jsonError('Provider not found', 404);

        const callbackUrl = `${c.env.BACKEND_URL}/api/auth/${provider}/callback`;
        const { access_token, refresh_token, expires_in } = await oauthService.getAccessToken(config, code, callbackUrl);
        const userInfo = await oauthService.getUserInfo(config, access_token);

        const accountRepo = new AccountRepository();
        let connection = await oauthRepo.findConnectionByProviderAndUserId(provider, userInfo.id);
        let userId: number;

        if (!connection) {
            const email = userInfo.email || `${provider}_${userInfo.id}@${provider}.local`;
            let user = await accountRepo.findByUserNameOrEmail(email, email);
            if (!user) {
                let baseUserName = '';
                if (userInfo.email) {
                    baseUserName = ((userInfo.email as string).split('@')[0] || `${provider}_${userInfo.id}`);
                } else if (userInfo.name) {
                    baseUserName = ((userInfo.name as string).split(' ')[0] || `${provider}_${userInfo.id}`);
                } else {
                    baseUserName = `${provider}_${userInfo.id}`;
                }

                const sanitizedBase = baseUserName
                    .toLowerCase()
                    .replace(/[^a-z0-9_]/g, '_')
                    .replace(/_+/g, '_')
                    .replace(/^_|_$/g, '')
                    .slice(0, 30) || `${provider}_${userInfo.id}`;

                let candidateUserName = sanitizedBase;
                let suffix = 1;
                while (await accountRepo.findByUserNameOrEmail(candidateUserName, email)) {
                    candidateUserName = `${sanitizedBase}_${suffix++}`;
                }

                const password = crypto.randomUUID();
                const passwordHash = await hashPassword(password);
                const fullName = userInfo.name?.trim() || `${provider} user`;
                const [firstName = provider, ...rest] = fullName.split(' ');
                const lastName = rest.join(' ') || 'User';

                const newUserData: CreateOrUpdateUserInput = {
                    user_name: candidateUserName,
                    first_name: firstName,
                    last_name: lastName,
                    full_name: fullName,
                    birth_date: '1970-01-01',
                    email,
                    password: password,
                    email_confirm: true,
                    avatar: userInfo.avatar || null,
                    country_code: 'vi',
                    phone: null,
                    address1: null,
                    address2: null,
                    last_online_time: null,
                    last_login_time: null,
                };
                const result = await accountRepo.createUser(newUserData, passwordHash);
                if (!result.success) {
                    return jsonError('Failed to create user from OAuth data', 500);
                }
                const newUser = await accountRepo.getUserById(result.meta.last_row_id as number);
                if (!newUser) {
                    return jsonError('Failed to create user from OAuth data', 500);
                }
                userId = newUser.id;
            }
            else {
                userId = user.id;
                if (userInfo.avatar && !user.avatar) {
                    await accountRepo.updateUser(userId, { avatar: userInfo.avatar });
                }
            }
            await oauthRepo.createConnection({
                user_id: userId,
                provider_name: provider,
                provider_user_id: userInfo.id,
                access_token: access_token,
                refresh_token: refresh_token || null,
                expires_at: expires_in ? new Date(Date.now() + expires_in * 1000).toISOString() : null,
            });
        }
        else {
            userId = connection.user_id;
            await oauthRepo.updateConnectionTokens(
                connection.id,
                access_token,
                refresh_token || null,
                expires_in ? new Date(Date.now() + expires_in * 1000).toISOString() : null
            );
        }

        const user = await accountRepo.getUserById(userId);
        if (!user) return jsonError('User not found', 500);
        const permissions = await accountRepo.getUserPermissions(userId);
        const jwt = await signToken({
            sub: user.id,
            user_name: user.user_name,
            email: user.email,
            country_code: user.country_code,
            permissions,
            ver: user.token_version,
        }, c.env.JWT_SECRET);

        c.header('Set-Cookie', 'oauth_state=; HttpOnly; Path=/; Max-Age=0');
        return c.redirect(`${c.env.FRONTEND_URL}/auth/callback?token=${jwt}`);
    }
}