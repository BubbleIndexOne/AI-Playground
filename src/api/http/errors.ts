import { z } from 'zod';

export const ErrorResponseSchema = z
  .object({
    statusCode: z.number().optional(),
    message: z.union([z.string(), z.array(z.string())]).optional(),
    error: z.string().optional(),
    reason: z.string().optional(),
    details: z.unknown().optional(),
  })
  .passthrough();

export type RawErrorResponse = z.infer<typeof ErrorResponseSchema>;

export interface NormalizedError {
  readonly status: number;
  readonly messages: readonly string[];
  readonly primaryMessage: string;
  readonly error?: string;
  readonly reason?: string;
  readonly details?: unknown;
}

export function normalizeErrorPayload(
  status: number,
  payload: unknown
): NormalizedError {
  const parsed = ErrorResponseSchema.safeParse(payload);
  if (!parsed.success) {
    const fallback =
      typeof payload === 'string' && payload.trim().length > 0
        ? payload
        : `Request failed with status ${status}`;
    return {
      status,
      messages: [fallback],
      primaryMessage: fallback,
    };
  }

  const data = parsed.data;
  let messages: string[] = [];

  if (Array.isArray(data.message)) {
    messages = data.message.filter((m) => typeof m === 'string' && m.trim().length > 0);
  } else if (typeof data.message === 'string' && data.message.trim().length > 0) {
    messages = [data.message];
  } else if (typeof data.reason === 'string' && data.reason.trim().length > 0) {
    messages = [data.reason];
  } else if (typeof data.error === 'string' && data.error.trim().length > 0) {
    messages = [data.error];
  }

  if (messages.length === 0) {
    messages = [`Request failed with status ${status}`];
  }

  return {
    status: data.statusCode ?? status,
    messages,
    primaryMessage: messages[0],
    error: data.error,
    reason: data.reason,
    details: data.details,
  };
}

export class ApiError extends Error {
  readonly status: number;
  readonly messages: readonly string[];
  readonly errorType?: string;
  readonly reason?: string;
  readonly details?: unknown;

  constructor(normalized: NormalizedError) {
    super(normalized.primaryMessage);
    this.name = 'ApiError';
    this.status = normalized.status;
    this.messages = normalized.messages;
    this.errorType = normalized.error;
    this.reason = normalized.reason;
    this.details = normalized.details;
  }
}

export class NotImplementedError extends Error {
  constructor(methodName: string) {
    super(`Endpoint not implemented in backend contract: ${methodName}`);
    this.name = 'NotImplementedError';
  }
}
