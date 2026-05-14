// backend/src/modules/oauth/oauth.types.ts
import { z } from 'zod';

export const CreateOrUpdateProviderSchema = z.object({
    provider_name: z.string().min(1),
    client_id: z.string().min(1),
    client_secret: z.string().min(1),
    redirect_uri: z.string().url().nullable().optional(),
    authorization_endpoint: z.string().url().nullable().optional(),
    token_endpoint: z.string().url().nullable().optional(),
    userinfo_endpoint: z.string().url().nullable().optional(),
    scopes: z.string().default('email profile'),
    enabled: z.boolean().default(true),
});

export interface OAuthProvider {
    id: number;
    provider_name: string;
    client_id: string;
    client_secret: string;
    redirect_uri: string | null;
    authorization_endpoint: string | null;
    token_endpoint: string | null;
    userinfo_endpoint: string | null;
    scopes: string;
    enabled: boolean;
    created_at: string;
    updated_at: string;
}

export interface OAuthUserInfo {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
    raw: any;
}

export interface OAuthConnection {
    id: number;
    user_id: number;
    provider_name: string;
    provider_user_id: string;
    access_token: string | null;
    refresh_token: string | null;
    expires_at: string | null;
}