import { z } from 'zod';
import { ConnectorType } from '../../domain/enums';

export const PostgresCredentialsSchema = z.object({
  host: z.string().min(1, 'Host is required'),
  port: z.coerce.number().int().min(1).max(65535).default(5432),
  database: z.string().min(1, 'Database name is required'),
  user: z.string().min(1, 'Database user is required'),
  password: z.string().min(1, 'Password is required'),
  ssl: z.boolean().optional().default(false),
});

export type PostgresCredentials = z.infer<typeof PostgresCredentialsSchema>;

export const SlackCredentialsSchema = z.object({
  bot_token: z.string().min(1, 'Bot token is required'),
  signing_secret: z.string().optional(),
  default_channel: z.string().optional(),
  team_id: z.string().optional(),
});

export type SlackCredentials = z.infer<typeof SlackCredentialsSchema>;

export type ConnectorCredentials = PostgresCredentials | SlackCredentials;

export const ConnectorMetadataSchema = z
  .object({
    id: z.string().optional(),
    type: z.nativeEnum(ConnectorType),
    preview: z.record(z.string(), z.unknown()).nullish(),
    is_verified: z.boolean().optional(),
    verified_at: z.string().nullish(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .passthrough();

export type ConnectorMetadata = z.infer<typeof ConnectorMetadataSchema>;

export const ConnectorTestResponseSchema = z
  .object({
    ok: z.boolean().optional(),
    success: z.boolean().optional(),
    status: z.string().optional(),
    message: z.string().optional(),
    latencyMs: z.number().optional(),
    details: z.unknown().optional(),
  })
  .passthrough();

export type ConnectorTestResponse = z.infer<typeof ConnectorTestResponseSchema>;
