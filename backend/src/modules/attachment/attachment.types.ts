// backend/src/modules/upload/upload.types.ts
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
extendZodWithOpenApi(z);

export const UploadSchema = z.object({
  category: z.string().optional(),

  files: z
    .array(
      z
        .any()
        .openapi({
          type: 'string',
          format: 'binary',
          description: 'Files to upload',
        })
        .refine((v) => v instanceof File, {
          message: 'Invalid file',
        })
    )
    .min(1),

  description: z.string().optional(),
});
export type UploadInput = z.infer<typeof UploadSchema>;

export const UploadResponseSchema = z.object({
  success: z.literal(true),
  files: z.array(
    z.object({
      name: z.string(),
      size: z.number(),
      type: z.string(),
      saved_as: z.string(),
      download_url: z.string(),
      public_url: z.string().nullable(),
    })
  ),
});
export type UploadResponse = z.infer<typeof UploadResponseSchema>;
