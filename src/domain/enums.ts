export enum ToolStatus {
  Draft = 'draft',
  Testing = 'testing',
  Verified = 'verified',
  Registered = 'registered',
  Rejected = 'rejected',
  Deprecated = 'deprecated',
}

export enum ToolType {
  Client = 'client',
  Mcp = 'mcp',
}

export enum ConnectorType {
  Postgres = 'postgres',
  Slack = 'slack',
}

export enum SandboxTestStatus {
  Passed = 'passed',
  Failed = 'failed',
}

export const CREATOR_ALLOWED_STATUSES: readonly ToolStatus[] = [
  ToolStatus.Draft,
  ToolStatus.Deprecated,
] as const;

export const ADMIN_REVIEW_STATUSES: readonly ToolStatus[] = [
  ToolStatus.Verified,
  ToolStatus.Rejected,
  ToolStatus.Deprecated,
] as const;
