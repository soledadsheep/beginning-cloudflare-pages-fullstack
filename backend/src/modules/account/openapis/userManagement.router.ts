// backend/src/modules/account/openapi/userManagement.route.ts
import { OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { jsonError } from '../../../shared/response'
import type { AppContext } from '../../../types';
import { ListUsersSchema, UserSchema, CreateOrUpdateUserSchema } from '../account.types';
import { createAccountService } from '../account.factory';

export class ListUsersRoute extends OpenAPIRoute {
	override schema = {
		tags: ['User'],
		security: [{ BearerAuth: [] }],
		summary: 'Get list of users (admin)',
		request: {
			query: ListUsersSchema,
		},
		responses: {
			200: {
				description: 'Users list',
				content: {
					'application/json': {
						schema: z.object({
							success: z.boolean(),
							data: z.array(UserSchema.omit({
								password_hash: true,
								token_version: true,
								login_fail_count: true,
								is_locked: true,
								lock_until: true,
								permissions: true,
							})),
							pagination: z.object({
								page: z.number(),
								limit: z.number(),
								total: z.number(),
								totalPages: z.number(),
							}),
						}),
					},
				},
			},
			401: { description: 'Unauthorized' },
			403: { description: 'Forbidden – requires user:list permission' },
		},
	};
	override async handle(c: AppContext) {
		try {
			const { query } = await this.getValidatedData<typeof this.schema>();
			const service = createAccountService(c.env);
			return await service.listUsers(query);
		} catch (e: any) {
			return jsonError(e.message ?? 'Invalid request');
		}
	}
}

export class GetUserByIdRoute extends OpenAPIRoute {
	override schema = {
		tags: ['User'],
		security: [{ BearerAuth: [] }],
		summary: 'User details (admin)',
		request: {
			params: z.object({
				id: z.coerce.number().int().positive(),
			}),
		},
		responses: {
			200: {
				description: 'User details',
				content: {
					'application/json': {
						schema: z.object({
							success: z.boolean(),
							data: UserSchema.omit({ password_hash: true }).nullable(),
						}),
					},
				},
			},
			401: { description: 'Unauthorized' },
			403: { description: 'Forbidden – requires user:read permission' },
			404: { description: 'User not found' },
		},
	};
	override async handle(c: AppContext) {
		try {
			const { params } = await this.getValidatedData<typeof this.schema>();
			const service = createAccountService(c.env);
			return await service.getUserById(params.id);
		} catch (e: any) {
			return jsonError(e.message ?? 'Invalid request');
		}
	}
}

export class CreateUserRoute extends OpenAPIRoute {
	override schema = {
		tags: ['User'],
		security: [{ BearerAuth: [] }],
		summary: 'Create a new user (admin)',
		request: {
			body: {
				content: {
					'application/json': {
						schema: CreateOrUpdateUserSchema,
					},
				},
			},
		},
		responses: {
			200: {
				description: 'User created',
				content: {
					'application/json': {
						schema: z.object({
							success: z.boolean(),
							data: UserSchema.omit({ password_hash: true }),
						}),
					},
				},
			},
			401: { description: 'Unauthorized' },
			403: { description: 'Forbidden – requires user:create permission' },
		},
	};
	override async handle(c: AppContext) {
		try {
			const { body } = await this.getValidatedData<typeof this.schema>();
			const service = createAccountService(c.env);
			return await service.createUser(body);
		} catch (e: any) {
			return jsonError(e.message ?? 'Invalid request');
		}
	}
}

export class UpdateUserRoute extends OpenAPIRoute {
	override schema = {
		tags: ['User'],
		security: [{ BearerAuth: [] }],
		summary: 'Update user information (admin)',
		request: {
			params: z.object({
				id: z.coerce.number().int().positive(),
			}),
			body: {
				content: {
					'application/json': {
						schema: CreateOrUpdateUserSchema,
					},
				},
			},
		},
		responses: {
			200: {
				description: 'User updated',
				content: {
					'application/json': {
						schema: z.object({
							success: z.boolean(),
							message: z.string().optional(),
						}),
					},
				},
			},
			401: { description: 'Unauthorized' },
			403: { description: 'Forbidden (not owner nor admin)' },
			404: { description: 'User not found' },
		},
	};
	override async handle(c: AppContext) {
		try {
			const { params, body } = await this.getValidatedData<typeof this.schema>();
			const service = createAccountService(c.env);
			const jwt = c.get('jwtPayload');
			return await service.updateUser(params.id, body, jwt);
		} catch (e: any) {
			return jsonError(e.message ?? 'Invalid request');
		}
	}
}

export class DeleteUserRoute extends OpenAPIRoute {
	override schema = {
		tags: ['User'],
		security: [{ BearerAuth: [] }],
		summary: 'Delete user (admin)',
		request: {
			params: z.object({
				id: z.coerce.number().int().positive(),
			}),
		},
		responses: {
			200: {
				description: 'User deleted',
				content: {
					'application/json': {
						schema: z.object({
							success: z.boolean(),
							message: z.string(),
						}),
					},
				},
			},
			401: { description: 'Unauthorized' },
			403: { description: 'Forbidden – requires user:delete permission' },
			404: { description: 'User not found' },
		},
	};
	override async handle(c: AppContext) {
		try {
			const { params } = await this.getValidatedData<typeof this.schema>();
			const service = createAccountService(c.env);
			return await service.deleteUser(params.id);
		} catch (e: any) {
			return jsonError(e.message ?? 'Invalid request');
		}
	}
}