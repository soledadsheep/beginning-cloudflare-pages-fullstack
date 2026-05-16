// backend/src/modules/oauth/oauth.service.ts
import { OAuthRepository } from './oauth.repository';
import { OAuthUserInfo, OAuthProvider } from './oauth.types';

export class OAuthService {
    constructor(private repo: OAuthRepository) { }

    async getProvider(providerName: string): Promise<OAuthProvider | null> {
        return await this.repo.getProvider({ provider_name: providerName });
    }

    async getProviderActive(providerName: string): Promise<OAuthProvider | null> {
        return await this.repo.getProvider({ provider_name: providerName, enabled: true });
    }

    async getAllProvider(): Promise<OAuthProvider[]> {
        return await this.repo.getAllProvider();
    }

    async getAccessToken(provider: OAuthProvider, code: string, callbackUrl: string): Promise<{ access_token: string; refresh_token?: string; expires_in?: number }> {
        if (!provider.token_endpoint) {
            throw new Error(`Provider ${provider.provider_name} missing token_endpoint`);
        }
        const redirectUri = provider.redirect_uri || callbackUrl;
        const response = await fetch(provider.token_endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
            body: new URLSearchParams({
                client_id: provider.client_id,
                client_secret: provider.client_secret,
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
            }),
        });
        const text = await response.text();
        let data: any;
        if (response.headers.get('content-type')?.includes('application/x-www-form-urlencoded')) {
            const params = new URLSearchParams(text);
            data = {
                access_token: params.get('access_token'),
                refresh_token: params.get('refresh_token'),
                expires_in: params.get('expires_in') ? parseInt(params.get('expires_in')!) : undefined,
            };
        }
        else {
            data = JSON.parse(text);
        }
        if (!response.ok || !data.access_token) {
            throw new Error(`Token exchange failed: ${text}`);
        }
        return {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_in: data.expires_in,
        };
    }

    async getUserInfo(provider: OAuthProvider, accessToken: string): Promise<OAuthUserInfo> {
        if (!provider.userinfo_endpoint) {
            throw new Error(`Provider ${provider.provider_name} missing userinfo_endpoint`);
        }
        const response = await fetch(provider.userinfo_endpoint, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch user info');
        }
        const raw: any = await response.json();

        // Chuẩn hóa các trường từ các provider khác nhau
        let id = raw.id || raw.sub;
        let email = raw.email;
        let name = raw.name || raw.login; // GitHub trả về login
        let avatar = raw.avatar || raw.picture;

        // Đặc biệt cho GitHub: email có thể không có trong userinfo, cần gọi thêm endpoint
        if (provider.provider_name === 'github' && !email) {
            const emailResp = await fetch('https://api.github.com/user/emails', {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (emailResp.ok) {
                const emails: any = await emailResp.json();
                const primaryEmail = emails.find((e: any) => e.primary && e.verified);
                if (primaryEmail) email = primaryEmail.email;
            }
        }

        if (!email) {
            // Fallback: tạo email giả để không bị lỗi unique
            email = `${id}@${provider.provider_name}.local`;
        }

        return { id, email, name, avatar, raw, };
    }

    async buildAuthUrl(provider: OAuthProvider, state: string, callbackUrl: string): Promise<string> {
        if (!provider.authorization_endpoint) {
            throw new Error(`Provider ${provider.provider_name} missing authorization_endpoint`);
        }
        const redirectUri = provider.redirect_uri || callbackUrl;
        const url = new URL(provider.authorization_endpoint);
        url.searchParams.set('response_type', 'code');
        url.searchParams.set('client_id', provider.client_id);
        url.searchParams.set('redirect_uri', redirectUri);
        url.searchParams.set('scope', provider.scopes);
        url.searchParams.set('state', state);
        return url.toString();
    }

}