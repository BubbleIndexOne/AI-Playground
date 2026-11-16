import { runTransaction, STORES } from '../local/idbHelper';
import { AgentRecord } from '../interfaces/AgentRepository';
import { ChatSessionRecord } from '../interfaces/ChatRepository';
import { remoteAgentRepository } from '../remote/RemoteAgentRepository';
import { remoteChatRepository } from '../remote/RemoteChatRepository';
import { settingsApi } from '../../api/settings.api';
import { getThemePreference } from '../../shared/ui/theme/tokens';

let migrationDone = false;

export async function migrateLegacyClientStorageIfNeeded(): Promise<void> {
  if (migrationDone || typeof window === 'undefined') return;

  try {
    // 1. Check local agents
    let localAgents: AgentRecord[] = [];
    try {
      localAgents =
        (await runTransaction<AgentRecord[]>(
          STORES.AGENTS,
          'readonly',
          (store) => store.getAll()
        )) || [];
    } catch {
      localAgents = [];
    }

    // 2. Check local chats
    let localChats: ChatSessionRecord[] = [];
    try {
      localChats =
        (await runTransaction<ChatSessionRecord[]>(
          STORES.CHATS,
          'readonly',
          (store) => store.getAll()
        )) || [];
    } catch {
      localChats = [];
    }

    if (localAgents.length === 0 && localChats.length === 0) {
      migrationDone = true;
      return;
    }

    console.info(
      `[Migrator] Found ${localAgents.length} local agents and ${localChats.length} local chats. Migrating to server...`
    );

    // Migrate agents first
    for (const agent of localAgents) {
      try {
        await remoteAgentRepository.save({
          id: agent.id,
          name: agent.name,
          description: agent.description,
          systemPrompt: agent.systemPrompt,
          modelPresetId: agent.modelPresetId,
          attachedTools: agent.attachedTools,
          attachedConnectors: agent.attachedConnectors,
          avatar: agent.avatar,
        });
      } catch (err) {
        console.warn(`[Migrator] Failed to migrate agent ${agent.name} (${agent.id}):`, err);
      }
    }

    // Migrate chats and messages
    for (const chat of localChats) {
      try {
        await remoteChatRepository.create(chat.agentId, chat.title, chat.id);
        if (chat.messages && chat.messages.length > 0) {
          await remoteChatRepository.saveMessages(chat.id, chat.messages);
        }
      } catch (err) {
        console.warn(`[Migrator] Failed to migrate chat ${chat.id}:`, err);
      }
    }

    // Sync theme if available
    try {
      const currentTheme = getThemePreference();
      if (currentTheme) {
        await settingsApi.updateSettings({ theme: currentTheme });
      }
    } catch {
      // Ignore settings sync failure
    }

    // Clear local stores to ensure no business data is stored in the UI
    try {
      await runTransaction(STORES.AGENTS, 'readwrite', (store) => store.clear());
      await runTransaction(STORES.CHATS, 'readwrite', (store) => store.clear());
      console.info('[Migrator] Local IndexedDB agents & chats cleared successfully.');
    } catch (clearErr) {
      console.warn('[Migrator] Error clearing local stores:', clearErr);
    }

    migrationDone = true;
  } catch (err) {
    console.error('[Migrator] Client migration error:', err);
  }
}
