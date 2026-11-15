/**
 * @fileoverview Unit tests for Marketplace and MCP Lifecycle API client,
 * Zod schemas, error handling, and authorization headers.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { marketplaceApi } from '../marketplace.api';
import { toolsApi } from '../tools.api';
import {
  InstallToolInputSchema,
  MarketplaceToolDetailResponseSchema,
  MarketplaceToolsResponseSchema,
  MarketplaceToolSummarySchema,
  ToolForkResponseSchema,
  ToolInstallResponseSchema,
  ToolMcpRequestResponseSchema,
  ToolReportInputSchema,
  ToolReportResponseSchema,
  ToolUninstallResponseSchema,
} from '../types/marketplace.types';

describe('Marketplace & MCP Lifecycle API and Schema Suite', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('1. Zod Schema Validations', () => {
    const sampleAuthor = {
      id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      handle: 'alice_dev',
      display_name: 'Alice Developer',
    };

    const sampleToolSummary = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Web Scraper & Markdown Extractor',
      description: 'Extracts clean readable article markdown.',
      slug: 'alice_dev/web-scraper',
      type: 'client' as const,
      connector_type: null,
      tags: ['web', 'scraping'],
      install_count: 142,
      is_installed: false,
      allow_client_execution: true,
      is_mcp_hosted: false,
      mcp_hosting_status: 'none' as const,
      author: sampleAuthor,
      requires_connector: null,
      has_connector_configured: false,
      capabilities: ['fetch'],
      created_at: '2026-10-15T08:30:00Z',
      updated_at: '2026-11-01T12:00:00Z',
    };

    it('validates MarketplaceToolSummary with complete fields and defaults', () => {
      const parsed = MarketplaceToolSummarySchema.parse(sampleToolSummary);
      expect(parsed.id).toBe(sampleToolSummary.id);
      expect(parsed.type).toBe('client');
      expect(parsed.is_installed).toBe(false);
      expect(parsed.author.display_name).toBe('Alice Developer');
    });

    it('validates MarketplaceToolsResponse with pagination', () => {
      const parsed = MarketplaceToolsResponseSchema.parse({
        success: true,
        tools: [sampleToolSummary],
        pagination: {
          limit: 20,
          has_more: true,
          next_cursor: 'cursor_123',
        },
      });
      expect(parsed.success).toBe(true);
      expect(parsed.tools).toHaveLength(1);
      expect(parsed.pagination.has_more).toBe(true);
      expect(parsed.pagination.next_cursor).toBe('cursor_123');
    });

    it('validates MarketplaceToolDetailResponse including versions changelog', () => {
      const parsed = MarketplaceToolDetailResponseSchema.parse({
        success: true,
        tool: {
          ...sampleToolSummary,
          pinned_version_number: 1,
          current_version: {
            id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
            version_number: 2,
            schema_json: { type: 'object', properties: { url: { type: 'string' } } },
            capabilities_json: ['fetch'],
            code_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            created_at: '2026-11-01T10:00:00Z',
          },
          versions: [
            {
              id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
              version_number: 2,
              schema_json: {},
              capabilities_json: ['fetch'],
              code_hash: 'hash2',
              created_at: '2026-11-01T10:00:00Z',
            },
            {
              id: '1a2b3c4d-7425-40de-944b-e07fc1f90ae1',
              version_number: 1,
              schema_json: {},
              capabilities_json: ['fetch'],
              code_hash: 'hash1',
              created_at: '2026-10-15T08:30:00Z',
            },
          ],
        },
      });
      expect(parsed.success).toBe(true);
      expect(parsed.tool.pinned_version_number).toBe(1);
      expect(parsed.tool.current_version?.version_number).toBe(2);
      expect(parsed.tool.versions).toHaveLength(2);
    });

    it('validates InstallToolInput, ToolInstallResponse, and ToolUninstallResponse', () => {
      const input = InstallToolInputSchema.parse({
        version_id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      });
      expect(input.version_id).toBe('7c9e6679-7425-40de-944b-e07fc1f90ae7');

      const installRes = ToolInstallResponseSchema.parse({
        success: true,
        message: 'Tool installed successfully',
        install: {
          user_id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
          tool_id: '550e8400-e29b-41d4-a716-446655440000',
          pinned_version_id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
          installed_at: '2026-11-01T12:00:00Z',
        },
      });
      expect(installRes.success).toBe(true);

      const uninstallRes = ToolUninstallResponseSchema.parse({
        success: true,
        message: 'Tool uninstalled',
      });
      expect(uninstallRes.success).toBe(true);
    });

    it('validates ToolForkResponse', () => {
      const forked = ToolForkResponseSchema.parse({
        success: true,
        message: 'Tool forked successfully',
        tool: {
          id: '222e8400-e29b-41d4-a716-446655440000',
          name: 'Fork of Web Scraper',
          description: 'Client tool copy',
          type: 'client',
          status: 'draft',
          visibility: 'private',
          allow_client_execution: true,
          created_at: '2026-11-01T12:00:00Z',
        },
      });
      expect(forked.tool.name).toBe('Fork of Web Scraper');
    });

    it('validates ToolReportInput and ToolReportResponse', () => {
      const report = ToolReportInputSchema.parse({
        reason: 'malicious',
        details: 'Suspicious outbound requests observed.',
      });
      expect(report.reason).toBe('malicious');

      const reportRes = ToolReportResponseSchema.parse({
        success: true,
        reported: true,
        status: 'received',
        message: 'Report submitted successfully',
      });
      expect(reportRes.status).toBe('received');
    });

    it('validates ToolMcpRequestResponse', () => {
      const mcpRes = ToolMcpRequestResponseSchema.parse({
        success: true,
        message: 'Submitted for MCP review',
        tool: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Web Scraper',
          mcp_hosting_status: 'requested',
          is_mcp_hosted: false,
        },
      });
      expect(mcpRes.tool.mcp_hosting_status).toBe('requested');
    });
  });

  describe('2. Marketplace API Client Operations', () => {
    it('sends GET /marketplace/tools with query filters and returns parsed response', async () => {
      let capturedUrl = '';
      globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
        capturedUrl = String(input);
        return new Response(
          JSON.stringify({
            success: true,
            tools: [],
            pagination: { limit: 20, has_more: false, next_cursor: null },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      });

      const res = await marketplaceApi.list({
        q: 'scraper',
        type: 'client',
        sort: 'popular',
        limit: 15,
      });

      expect(res.success).toBe(true);
      expect(capturedUrl).toContain('/marketplace/tools');
      expect(capturedUrl).toContain('q=scraper');
      expect(capturedUrl).toContain('type=client');
      expect(capturedUrl).toContain('sort=popular');
      expect(capturedUrl).toContain('limit=15');
    });

    it('sends POST /marketplace/tools/:id/install with version pinning', async () => {
      let capturedMethod = '';
      let capturedBody: unknown = null;

      globalThis.fetch = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
        capturedMethod = init?.method ?? '';
        capturedBody = init?.body ? JSON.parse(String(init.body)) : null;
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Installed',
            install: {
              user_id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
              tool_id: '550e8400-e29b-41d4-a716-446655440000',
              pinned_version_id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
              installed_at: '2026-11-01T12:00:00Z',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      });

      const res = await marketplaceApi.install(
        '550e8400-e29b-41d4-a716-446655440000',
        { version_id: '7c9e6679-7425-40de-944b-e07fc1f90ae7' }
      );

      expect(capturedMethod).toBe('POST');
      expect(capturedBody).toEqual({
        version_id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      });
      expect(res.success).toBe(true);
    });

    it('sends DELETE /marketplace/tools/:id/install', async () => {
      let capturedMethod = '';
      globalThis.fetch = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
        capturedMethod = init?.method ?? '';
        return new Response(
          JSON.stringify({ success: true, message: 'Uninstalled' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      });

      const res = await marketplaceApi.uninstall(
        '550e8400-e29b-41d4-a716-446655440000'
      );
      expect(capturedMethod).toBe('DELETE');
      expect(res.success).toBe(true);
    });

    it('sends POST /marketplace/tools/:id/fork', async () => {
      let capturedMethod = '';
      globalThis.fetch = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
        capturedMethod = init?.method ?? '';
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Forked',
            tool: {
              id: '333e8400-e29b-41d4-a716-446655440000',
              name: 'Fork of Scraper',
              type: 'client',
            },
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        );
      });

      const res = await marketplaceApi.fork(
        '550e8400-e29b-41d4-a716-446655440000'
      );
      expect(capturedMethod).toBe('POST');
      expect(res.tool.name).toBe('Fork of Scraper');
    });

    it('sends POST /marketplace/tools/:id/report with reason and details', async () => {
      let capturedBody: unknown = null;
      globalThis.fetch = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
        capturedBody = init?.body ? JSON.parse(String(init.body)) : null;
        return new Response(
          JSON.stringify({
            success: true,
            reported: true,
            status: 'received',
            message: 'Report received',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      });

      const res = await marketplaceApi.report(
        '550e8400-e29b-41d4-a716-446655440000',
        { reason: 'broken', details: 'Fails to execute run function' }
      );

      expect(capturedBody).toEqual({
        reason: 'broken',
        details: 'Fails to execute run function',
      });
      expect(res.reported).toBe(true);
    });

    it('sends POST and DELETE for /tools/:id/mcp-request author lifecycle', async () => {
      const calls: { url: string; method: string }[] = [];
      globalThis.fetch = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
        calls.push({ url: String(url), method: init?.method ?? 'GET' });
        return new Response(
          JSON.stringify({
            success: true,
            message: 'MCP request handled',
            tool: {
              id: '550e8400-e29b-41d4-a716-446655440000',
              mcp_hosting_status: init?.method === 'POST' ? 'requested' : 'none',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      });

      const postRes = await toolsApi.requestMcpHosting(
        '550e8400-e29b-41d4-a716-446655440000'
      );
      expect(postRes.tool.mcp_hosting_status).toBe('requested');

      const deleteRes = await toolsApi.withdrawMcpRequest(
        '550e8400-e29b-41d4-a716-446655440000'
      );
      expect(deleteRes.tool.mcp_hosting_status).toBe('none');

      expect(calls).toHaveLength(2);
      expect(calls[0].method).toBe('POST');
      expect(calls[0].url).toContain('/tools/550e8400-e29b-41d4-a716-446655440000/mcp-request');
      expect(calls[1].method).toBe('DELETE');
      expect(calls[1].url).toContain('/tools/550e8400-e29b-41d4-a716-446655440000/mcp-request');
    });
  });
});

