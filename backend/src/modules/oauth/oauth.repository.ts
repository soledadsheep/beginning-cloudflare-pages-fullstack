// backend/src/modules/oauth/oauth.repository.ts
import { getDb } from '../../shared/db/d1';
import { OAuthConnection, OAuthProvider } from './oauth.types';

export class OAuthRepository {
    constructor() { }

    // OAuth Providers
    async getAllProvider(): Promise<OAuthProvider[]> {
        const result = await getDb()
            .prepare(`SELECT * FROM oauth_providers`)
            .all<OAuthProvider>();
        return result.results;
    }

    async getProvider(provider: Partial<Omit<OAuthProvider, 'id' | 'created_at' | 'updated_at'>>): Promise<OAuthProvider | null> {
            const conditions: string[] = [];
            const values: any[] = [];

            if (provider.provider_name !== undefined) {
                conditions.push('provider_name = ?');
                values.push(provider.provider_name);
            }
            if (provider.client_id !== undefined) {
                conditions.push('client_id = ?');
                values.push(provider.client_id);
            }
            if (provider.client_secret !== undefined) {
                conditions.push('client_secret = ?');
                values.push(provider.client_secret);
            }
            if (provider.redirect_uri !== undefined) {
                conditions.push('redirect_uri = ?');
                values.push(provider.redirect_uri);
            }
            if (provider.authorization_endpoint !== undefined) {
                conditions.push('authorization_endpoint = ?');
                values.push(provider.authorization_endpoint);
            }
            if (provider.token_endpoint !== undefined) {
                conditions.push('token_endpoint = ?');
                values.push(provider.token_endpoint);
            }
            if (provider.userinfo_endpoint !== undefined) {
                conditions.push('userinfo_endpoint = ?');
                values.push(provider.userinfo_endpoint);
            }
            if (provider.scopes !== undefined) {
                conditions.push('scopes = ?');
                values.push(provider.scopes);
            }
            if (provider.enabled !== undefined) {
                conditions.push('enabled = ?');
                values.push(provider.enabled ? 1 : 0);
            }

            if (conditions.length === 0) {
                return null;
            }
            const sql = `SELECT * FROM oauth_providers WHERE ${conditions.join(' AND ')} LIMIT 1`;

            const result = await getDb()
                .prepare(sql)
                .bind(...values)
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

    // OAuth Connections
    async getAllConnections(): Promise<OAuthConnection[]> {
        const result = await getDb()
            .prepare(`SELECT * FROM oauth_logins`)
            .all<OAuthConnection>();
        return result.results;
    }

    async getConnection(connection: Partial<Omit<OAuthConnection, 'id' | 'created_at' | 'updated_at'>>): Promise<OAuthConnection | null> {
        const conditions: string[] = [];
        const values: any[] = [];

        if (connection.user_id !== undefined) {
            conditions.push('user_id = ?');
            values.push(connection.user_id);
        }
        if (connection.provider_name !== undefined) {
            conditions.push('provider_name = ?');
            values.push(connection.provider_name);
        }
        if (connection.provider_user_id !== undefined) {
            conditions.push('provider_user_id = ?');
            values.push(connection.provider_user_id);
        }

        if (conditions.length === 0) {
            return null;
        }

        const sql = `SELECT * FROM oauth_logins WHERE ${conditions.join(' AND ')} LIMIT 1`;

        const result = await getDb()
            .prepare(sql)
            .bind(...values)
            .first<OAuthConnection>();
        return result;
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