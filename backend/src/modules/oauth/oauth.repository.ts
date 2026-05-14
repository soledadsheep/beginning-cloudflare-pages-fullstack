// backend/src/modules/oauth/oauth.repository.ts
import { getDb } from '../../shared/db/d1';
import { OAuthConnection, OAuthProvider } from './oauth.types';

export class OAuthRepository {
    constructor() { }

    async getAllProvider(): Promise<OAuthProvider[]> {
        const result = await getDb()
            .prepare(`SELECT * FROM oauth_providers`)
            .all<OAuthProvider>();
        return result.results;
    }

    async getProviderByName(providerName: string): Promise<OAuthProvider | null> {
        const result = await getDb()
            .prepare(`SELECT * FROM oauth_providers WHERE provider_name = ?`)
            .bind(providerName)
            .first<OAuthProvider>();
        return result;
    }

    async createProvider(config: Omit<OAuthProvider, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
        await getDb()
            .prepare(`
                INSERT INTO oauth_providers 
                (provider_name, client_id, client_secret, redirect_uri, 
                 authorization_endpoint, token_endpoint, userinfo_endpoint, scopes, enabled)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(provider_name) DO UPDATE SET
                    client_id = excluded.client_id,
                    client_secret = excluded.client_secret,
                    redirect_uri = excluded.redirect_uri,
                    authorization_endpoint = excluded.authorization_endpoint,
                    token_endpoint = excluded.token_endpoint,
                    userinfo_endpoint = excluded.userinfo_endpoint,
                    scopes = excluded.scopes,
                    enabled = excluded.enabled,
                    updated_at = CURRENT_TIMESTAMP
            `)
            .bind(
                config.provider_name,
                config.client_id,
                config.client_secret,
                config.redirect_uri,
                config.authorization_endpoint,
                config.token_endpoint,
                config.userinfo_endpoint,
                config.scopes,
                config.enabled ? 1 : 0
            )
            .run();
    }

    async updateProvider(id: number, config: Partial<Omit<OAuthProvider, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
        const fields: string[] = [];
        const values: any[] = [];

        if (config.provider_name !== undefined) {
            fields.push('provider_name = ?');
            values.push(config.provider_name);
        }
        if (config.client_id !== undefined) {
            fields.push('client_id = ?');
            values.push(config.client_id);
        }
        if (config.client_secret !== undefined) {
            fields.push('client_secret = ?');
            values.push(config.client_secret);
        }
        if (config.redirect_uri !== undefined) {
            fields.push('redirect_uri = ?');
            values.push(config.redirect_uri);
        }
        if (config.authorization_endpoint !== undefined) {
            fields.push('authorization_endpoint = ?');
            values.push(config.authorization_endpoint);
        }
        if (config.token_endpoint !== undefined) {
            fields.push('token_endpoint = ?');
            values.push(config.token_endpoint);
        }
        if (config.userinfo_endpoint !== undefined) {
            fields.push('userinfo_endpoint = ?');
            values.push(config.userinfo_endpoint);
        }
        if (config.scopes !== undefined) {
            fields.push('scopes = ?');
            values.push(config.scopes);
        }
        if (config.enabled !== undefined) {
            fields.push('enabled = ?');
            values.push(config.enabled ? 1 : 0);
        }

        if (fields.length === 0) {
            return Promise.resolve();
        }

        values.push(id);
        const sql = `UPDATE oauth_providers SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

        await getDb()
            .prepare(sql)
            .bind(...values)
            .run();
    }

    async deleteProvider(id: number): Promise<void> {
        await getDb()
            .prepare(`DELETE FROM oauth_providers WHERE id = ?`)
            .bind(id)
            .run();
    }

    async getAllConnections(): Promise<OAuthConnection[]> {
        const result = await getDb()
            .prepare(`SELECT * FROM oauth_logins`)
            .all<OAuthConnection>();
        return result.results;
    }

    async findConnectionByProviderAndUserId(providerName: string, providerUserId: string): Promise<OAuthConnection | null> {
        return await getDb()
            .prepare(`SELECT * FROM oauth_logins WHERE provider_name = ? AND provider_user_id = ?`)
            .bind(providerName, providerUserId)
            .first<OAuthConnection>();
    }

    async createConnection(conn: Omit<OAuthConnection, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
        await getDb()
            .prepare(`INSERT INTO oauth_logins (user_id, provider_name, provider_user_id, access_token, refresh_token, expires_at)
                      VALUES (?, ?, ?, ?, ?, ?)`)
            .bind(conn.user_id, conn.provider_name, conn.provider_user_id, conn.access_token, conn.refresh_token, conn.expires_at)
            .run();
    }

    async updateConnectionTokens(id: number, accessToken: string | null, refreshToken: string | null, expiresAt: string | null): Promise<void> {
        await getDb()
            .prepare(`
                UPDATE oauth_logins 
                SET access_token = ?, refresh_token = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `)
            .bind(accessToken, refreshToken, expiresAt, id)
            .run();
    }

}