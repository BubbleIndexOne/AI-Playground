/**
 * @fileoverview Zod schemas and TypeScript types for Marketplace and MCP Lifecycle APIs.
 * Complies with the OpenAPI 3.1.0 specification for community tool discovery, inspection,
 * version pinning, installation, forking, reporting, and author MCP hosting requests.
 */

import { z } from 'zod';
import { ToolType } from '../../domain/enums';

export const McpHostingStatusSchema = z.enum([
  'none',
  'requested',
  'in_review',
  'approved',
  'rejected',
]);

export type McpHostingStatus = z.infer<typeof McpHostingStatusSchema>;

export const MarketplaceToolAuthorSchema = z.object({
  id: z.string().uuid(),
  handle: z.string().nullable().optional(),
  display_name: z.string(),
});

export type MarketplaceToolAuthor = z.infer<typeof MarketplaceToolAuthorSchema>;

export const MarketplaceToolSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  slug: z.string().nullable().optional(),
  type: z.nativeEnum(ToolType).or(z.enum(['client', 'mcp'])),
  connector_type: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  install_count: z.number().int().default(0),
  is_installed: z.boolean().default(false),
  allow_client_execution: z.boolean().default(false),
  is_mcp_hosted: z.boolean().default(false),
  mcp_hosting_status: McpHostingStatusSchema.or(z.string()).default('none'),
  author: MarketplaceToolAuthorSchema,
  requires_connector: z.string().nullable().optional(),
  has_connector_configured: z.boolean().default(false),
  capabilities: z.array(z.string()).default([]),
  created_at: z.string(),
  updated_at: z.string(),
});

export type MarketplaceToolSummary = z.infer<typeof MarketplaceToolSummarySchema>;

export const MarketplacePaginationSchema = z.object({
  limit: z.number().int().default(20),
  has_more: z.boolean().default(false),
  next_cursor: z.string().nullable().optional(),
});

export type MarketplacePagination = z.infer<typeof MarketplacePaginationSchema>;

export const MarketplaceToolsResponseSchema = z.object({
  success: z.boolean(),
  tools: z.array(MarketplaceToolSummarySchema),
  pagination: MarketplacePaginationSchema,
});

export type MarketplaceToolsResponse = z.infer<typeof MarketplaceToolsResponseSchema>;

export const ToolVersionSummarySchema = z.object({
  id: z.string().uuid().optional(),
  version_number: z.number().int(),
  schema_json: z.record(z.string(), z.unknown()).default({}),
  capabilities_json: z.array(z.string()).default([]),
  code_hash: z.string().optional(),
  test_results_json: z.unknown().nullable().optional(),
  created_at: z.string().optional(),
});

export type ToolVersionSummary = z.infer<typeof ToolVersionSummarySchema>;

export const MarketplaceToolDetailSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  slug: z.string().nullable().optional(),
  type: z.nativeEnum(ToolType).or(z.enum(['client', 'mcp'])),
  connector_type: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  install_count: z.number().int().default(0),
  is_installed: z.boolean().default(false),
  pinned_version_number: z.number().int().nullable().optional(),
  allow_client_execution: z.boolean().default(false),
  is_mcp_hosted: z.boolean().default(false),
  mcp_hosting_status: McpHostingStatusSchema.or(z.string()).default('none'),
  author: MarketplaceToolAuthorSchema,
  requires_connector: z.string().nullable().optional(),
  has_connector_configured: z.boolean().default(false),
  current_version: ToolVersionSummarySchema.nullable().optional(),
  versions: z.array(ToolVersionSummarySchema).default([]),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type MarketplaceToolDetail = z.infer<typeof MarketplaceToolDetailSchema>;

export const MarketplaceToolDetailResponseSchema = z.object({
  success: z.boolean(),
  tool: MarketplaceToolDetailSchema,
});

export type MarketplaceToolDetailResponse = z.infer<
  typeof MarketplaceToolDetailResponseSchema
>;

export const InstallToolInputSchema = z.object({
  version_id: z.string().uuid().optional(),
});

export type InstallToolInput = z.infer<typeof InstallToolInputSchema>;

export const ToolInstallResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  install: z.object({
    user_id: z.string().uuid().optional(),
    tool_id: z.string().uuid().optional(),
    pinned_version_id: z.string().uuid().optional(),
    installed_at: z.string().optional(),
  }),
});

export type ToolInstallResponse = z.infer<typeof ToolInstallResponseSchema>;

export const ToolUninstallResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type ToolUninstallResponse = z.infer<typeof ToolUninstallResponseSchema>;

export const ToolForkResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  tool: z.object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable().optional(),
    type: z.string(),
    status: z.string().optional(),
    visibility: z.string().optional(),
    allow_client_execution: z.boolean().optional(),
    created_at: z.string().optional(),
  }),
});

export type ToolForkResponse = z.infer<typeof ToolForkResponseSchema>;

export const ToolReportReasonSchema = z.enum([
  'malicious',
  'broken',
  'spam',
  'other',
]);

export type ToolReportReason = z.infer<typeof ToolReportReasonSchema>;

export const ToolReportInputSchema = z.object({
  reason: ToolReportReasonSchema,
  details: z.string().max(1000).optional(),
});

export type ToolReportInput = z.infer<typeof ToolReportInputSchema>;

export const ToolReportResponseSchema = z.object({
  success: z.boolean(),
  reported: z.boolean(),
  status: z.enum(['received', 'under_review']).or(z.string()),
  message: z.string(),
});

export type ToolReportResponse = z.infer<typeof ToolReportResponseSchema>;

export const ToolMcpRequestResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  tool: z.object({
    id: z.string().uuid(),
    name: z.string().optional(),
    mcp_hosting_status: McpHostingStatusSchema.or(z.string()).optional(),
    is_mcp_hosted: z.boolean().optional(),
  }),
});

export type ToolMcpRequestResponse = z.infer<typeof ToolMcpRequestResponseSchema>;

export interface ListMarketplaceToolsParams {
  readonly q?: string;
  readonly type?: 'client' | 'mcp';
  readonly connector?: string;
  readonly tag?: string;
  readonly hosting_tier?: 'client' | 'mcp';
  readonly sort?: 'popular' | 'recent' | 'name';
  readonly cursor?: string;
  readonly limit?: number;
}

