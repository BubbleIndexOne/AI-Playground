import { ListToolsFilters, toolsApi } from '../../../api/tools.api';
import {
  CreateToolInput,
  CreateToolVersionInput,
  Tool,
  ToolRegistrationResponse,
  ToolVersion,
  ToolVersionDiff,
  UpdateToolInput,
} from '../../../api/types/tools.types';
import { isMemoryMeasurementSupported } from '../../../sandbox/controls/memoryControl';
import {
  SandboxExecutionOutcome,
  SandboxRunInput,
} from '../../../sandbox/protocol';
import { runInSandbox } from '../../../sandbox/sandboxRunner';

export const toolsService = {
  list(filters?: ListToolsFilters): Promise<Tool[]> {
    return toolsApi.list(filters, 'bearer');
  },

  getById(id: string): Promise<Tool> {
    return toolsApi.getById(id, 'bearer');
  },

  create(body: CreateToolInput): Promise<Tool> {
    return toolsApi.create(body);
  },

  updateMetadata(id: string, body: UpdateToolInput): Promise<Tool> {
    return toolsApi.update(id, body, 'bearer');
  },

  softDelete(id: string): Promise<unknown> {
    return toolsApi.delete(id, { purge: false, security: 'bearer' });
  },

  createVersion(
    toolId: string,
    body: CreateToolVersionInput
  ): Promise<ToolVersion> {
    return toolsApi.createVersion(toolId, body);
  },

  listVersions(toolId: string): Promise<ToolVersion[]> {
    return toolsApi.listVersions(toolId, 'bearer');
  },

  getVersion(toolId: string, version: number): Promise<ToolVersion> {
    return toolsApi.getVersion(toolId, version, 'bearer');
  },

  diffVersions(
    toolId: string,
    fromVersion: number,
    toVersion: number
  ): Promise<ToolVersionDiff> {
    return toolsApi.diffVersions(toolId, fromVersion, toVersion, 'bearer');
  },

  registerTool(
    toolId: string,
    inputs?: Record<string, unknown>
  ): Promise<ToolRegistrationResponse> {
    return toolsApi.register(toolId, inputs);
  },

  executeInSandbox(input: SandboxRunInput): Promise<SandboxExecutionOutcome> {
    return runInSandbox(input);
  },

  canMeasureMemory(): boolean {
    return isMemoryMeasurementSupported();
  },
};
