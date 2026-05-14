// backend/src/modules/oauth/openapis/oauthManagement.route.ts
import { OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { OAuthRepository } from '../oauth.repository';
import { AppContext } from '../../../types';
import { jsonSuccess } from '../../../shared/response';
import { CreateOrUpdateProviderSchema } from '../oauth.types';

export class ListProvidersRoute extends OpenAPIRoute {
    override schema = {
        tags: ['OAuth'],
		security: [{ BearerAuth: [] }],
        summary: 'List OAuth providers (admin)',
        responses: {
            200: {
                description: 'OK',
                content: {
                    'application/json': {
                        schema: z.object({
                            success: z.boolean(),
                            message: z.string().optional(),
                            providers: z.array(z.object({
                                id: z.number(),
                                provider_name: z.string(),
                                client_id: z.string(),
                                redirect_uri: z.string().url().nullable().optional(),
                                authorization_endpoint: z.string().url().nullable().optional(),
                                token_endpoint: z.string().url().nullable().optional(),
                                userinfo_endpoint: z.string().url().nullable().optional(),
                                scopes: z.string(),
                                enabled: z.boolean(),
                                created_at: z.string(),
                                updated_at: z.string(),
                            }))
                        })
                    }
                }
            },
            401: {
                description: 'Unauthorized',
                content: {
                    'application/json': {
                        schema: z.object({
                            success: z.boolean().default(false),
                            message: z.string().default('Unauthorized'),
                        }),
                    },
                },
            },
        },
    };
    override async handle(c: AppContext) {
        const repo = new OAuthRepository();
        const providers = await repo.getAllProvider();
        return jsonSuccess({ providers });
    }
}

export class GetProviderByNameRoute extends OpenAPIRoute {
    override schema = {
        tags: ['OAuth'],
		security: [{ BearerAuth: [] }],
        summary: 'Get OAuth provider by name (admin)',
        request: { params: z.object({ name: z.string().min(1) }) },
        responses: {
            200: {
                description: 'OK',
                content: {
                    'application/json': {
                        schema: z.object({
                            success: z.boolean(),
                            message: z.string().optional(),
                            provider: z.object({
                                id: z.number(),
                                provider_name: z.string(),
                                client_id: z.string(),
                                client_secret: z.string().url().nullable().optional(),
                                redirect_uri: z.string().url().nullable().optional(),
                                authorization_endpoint: z.string().url().nullable().optional(),
                                token_endpoint: z.string().url().nullable().optional(),
                                userinfo_endpoint: z.string().url().nullable().optional(),
                                scopes: z.string(),
                                enabled: z.boolean(),
                                created_at: z.string(),
                                updated_at: z.string(),
                            })
                        })
                    }
                }
            },
            401: {
                description: 'Unauthorized',
                content: {
                    'application/json': {
                        schema: z.object({
                            success: z.boolean().default(false),
                            message: z.string().default('Unauthorized'),
                        }),
                    },
                },
            },
        },
    };
    override async handle(c: AppContext) {
        const { params: { name } } = await this.getValidatedData<typeof this.schema>();
        const repo = new OAuthRepository();
        const provider = await repo.getProviderByName(name);
        if (!provider) {
            return c.json({ error: 'Provider is not supported' }, 404);
        }
        return jsonSuccess({ provider });
    }
}

export class CreateProviderRoute extends OpenAPIRoute {
    override schema = {
        tags: ['OAuth'],
        security: [{ BearerAuth: [] }],
        summary: 'Create OAuth provider (admin)',
        request: {
            body: { content: { 'application/json': { schema: CreateOrUpdateProviderSchema } } },
        },
        responses: {
            200: {
                description: 'OK',
                content: {
                    'application/json': {
                        schema: z.object({
                            success: z.boolean(),
                            message: z.string().optional(),
                        })
                    }
                }
            },
            401: {
                description: 'Unauthorized',
                content: {
                    'application/json': {
                        schema: z.object({
                            success: z.boolean().default(false),
                            message: z.string().default('Unauthorized'),
                        }),
                    },
                },
            },
        },
    };
    override async handle(c: AppContext) {
        const body = await this.getValidatedData() as unknown as z.infer<typeof CreateOrUpdateProviderSchema>;
        const repo = new OAuthRepository();
        await repo.createProvider({
            ...body,
            redirect_uri: body.redirect_uri ?? null,
            authorization_endpoint: body.authorization_endpoint ?? null,
            token_endpoint: body.token_endpoint ?? null,
            userinfo_endpoint: body.userinfo_endpoint ?? null,
        });
        return jsonSuccess({ message: 'Provider saved' });
    }
}

export class UpdateProviderRoute extends OpenAPIRoute {
    override schema = {
        tags: ['OAuth'],
        security: [{ BearerAuth: [] }],
        summary: 'Update OAuth provider (admin)',
        request: {
            params: z.object({ id: z.coerce.number().int().positive() }),
            body: { content: { 'application/json': { schema: CreateOrUpdateProviderSchema } } },
        },
        responses: {
            200: {
                description: 'OK',
                content: {
                    'application/json': {
                        schema: z.object({
                            success: z.boolean(),
                            message: z.string().optional(),
                        })
                    }
                }
            },
            401: {
                description: 'Unauthorized',
                content: {
                    'application/json': {
                        schema: z.object({
                            success: z.boolean().default(false),
                            message: z.string().default('Unauthorized'),
                        }),
                    },
                },
            },
        },
    };
    override async handle(c: AppContext) {
        const { params: { id }, body } = await this.getValidatedData<typeof this.schema>();
        const repo = new OAuthRepository();
        await repo.updateProvider(id, {
            ...body,
            redirect_uri: body.redirect_uri ?? null,
            authorization_endpoint: body.authorization_endpoint ?? null,
            token_endpoint: body.token_endpoint ?? null,
            userinfo_endpoint: body.userinfo_endpoint ?? null,
        });
        return jsonSuccess({ message: 'Provider updated' });
    }
}

export class DeleteProviderRoute extends OpenAPIRoute {
    override schema = {
        tags: ['OAuth'],
        security: [{ BearerAuth: [] }],
        summary: 'Delete OAuth provider (admin)',
        request: { params: z.object({ id: z.coerce.number().int().positive() }) },
        responses: {
            200: {
                description: 'OK',
                content: {
                    'application/json': {
                        schema: z.object({
                            success: z.boolean(),
                            message: z.string().optional(),
                        })
                    }
                }
            },
            401: {
                description: 'Unauthorized',
                content: {
                    'application/json': {
                        schema: z.object({
                            success: z.boolean().default(false),
                            message: z.string().default('Unauthorized'),
                        }),
                    },
                },
            },
        },
    };
    override async handle(c: AppContext) {
        const { params: { id } } = await this.getValidatedData<typeof this.schema>();
        const repo = new OAuthRepository();
        await repo.updateProvider(id, { enabled: false });
        return jsonSuccess({ message: 'Provider deleted' });
    }
}

export class ListConnectionsRoute extends OpenAPIRoute {
    override schema = {
        tags: ['OAuth'],
        security: [{ BearerAuth: [] }],
        summary: 'List OAuth connections (admin)',
        responses: {
            200: {
                description: 'OK',
                content: {
                    'application/json': {
                        schema: z.object({
                            success: z.boolean(),
                            message: z.string().optional(),
                        })
                    }
                }
            },
            401: {
                description: 'Unauthorized',
                content: {
                    'application/json': {
                        schema: z.object({
                            success: z.boolean().default(false),
                            message: z.string().default('Unauthorized'),
                        }),
                    },
                },
            },
        },
    };
    override async handle(c: AppContext) {
        const repo = new OAuthRepository();
        const connections = await repo.getAllConnections();
        return jsonSuccess({ connections });
    }
}