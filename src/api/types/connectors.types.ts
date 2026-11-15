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

export const SlackCredentialsSchema = z
  .object({
    botToken: z.string().optional(),
    bot_token: z.string().optional(),
    signingSecret: z.string().optional(),
    signing_secret: z.string().optional(),
    default_channel: z.string().optional(),
    team_id: z.string().optional(),
  })
  .refine((val) => Boolean(val.botToken || val.bot_token), {
    message: 'Bot token is required',
    path: ['botToken'],
  })
  .refine(
    (val) => {
      const token = val.botToken || val.bot_token || '';
      return token.startsWith('xoxb-');
    },
    {
      message: 'Bot token must start with "xoxb-"',
      path: ['botToken'],
    }
  )
  .transform((val) => {
    const token = (val.botToken || val.bot_token || '').trim();
    const secret = (val.signingSecret || val.signing_secret || '').trim() || undefined;
    return {
      botToken: token,
      bot_token: token,
      signingSecret: secret,
      signing_secret: secret,
      default_channel: val.default_channel?.trim() || undefined,
      team_id: val.team_id?.trim() || undefined,
    };
  });

export type SlackCredentials = z.infer<typeof SlackCredentialsSchema>;

export type ConnectorCredentials = PostgresCredentials | SlackCredentials;

const RawConnectorMetadataSchema = z
  .object({
    id: z.string().optional(),
    type: z.nativeEnum(ConnectorType),
    connector_type: z.string().optional(),
    preview: z.union([z.record(z.string(), z.unknown()), z.string()]).nullish(),
    is_verified: z.boolean().optional(),
    verified_at: z.string().nullish(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .passthrough();

export const ConnectorMetadataSchema = z.preprocess((val) => {
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    let rec = val as Record<string, unknown>;
    if (
      rec.connector &&
      typeof rec.connector === 'object' &&
      !Array.isArray(rec.connector)
    ) {
      rec = rec.connector as Record<string, unknown>;
    } else if (rec.data && typeof rec.data === 'object' && !Array.isArray(rec.data)) {
      rec = rec.data as Record<string, unknown>;
    }

    const resolvedType = (rec.type || rec.connector_type) as ConnectorType;
    return {
      ...rec,
      type: resolvedType,
      connector_type: resolvedType,
    };
  }
  return val;
}, RawConnectorMetadataSchema);

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
