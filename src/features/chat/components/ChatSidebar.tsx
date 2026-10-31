import { useState } from 'react';
import { AgentRecord } from '../../../storage/interfaces/AgentRepository';
import { ChatSessionRecord } from '../../../storage/interfaces/ChatRepository';

interface ChatSidebarProps {
  readonly agents: readonly AgentRecord[];
  readonly selectedAgentId: string | null;
  readonly onSelectAgent: (id: string) => void;
  readonly chats: readonly ChatSessionRecord[];
  readonly selectedChatId: string | null;
  readonly onSelectChat: (id: string) => void;
  readonly onCreateChat: () => void;
  readonly onRenameChat: (chatId: string, title: string) => void;
  readonly onRequestDeleteChat: (chat: ChatSessionRecord) => void;
}

export function ChatSidebar({
  agents,
  selectedAgentId,
  onSelectAgent,
  chats,
  selectedChatId,
  onSelectChat,
  onCreateChat,
  onRenameChat,
  onRequestDeleteChat,
}: ChatSidebarProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');

  return (
    <div className="w-full md:w-72 shrink-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col gap-4">
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Select Agent
        </label>
        <select
          value={selectedAgentId ?? ''}
          onChange={(e) => onSelectAgent(e.target.value)}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-medium"
        >
          <option value="">Choose an agent...</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Conversations ({chats.length})
        </span>
        <button
          type="button"
          disabled={!selectedAgentId}
          onClick={onCreateChat}
          className="px-2.5 py-1 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-md disabled:opacity-40"
        >
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 max-h-96">
        {chats.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            No conversations yet.
          </p>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              className={`rounded-lg p-2 text-xs transition-colors ${
                selectedChatId === chat.id
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              {renamingId === chat.id ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={renameText}
                    onChange={(e) => setRenameText(e.target.value)}
                    className="flex-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 py-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onRenameChat(chat.id, renameText);
                      setRenamingId(null);
                    }}
                    className="text-emerald-600 dark:text-emerald-400 font-medium px-1"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectChat(chat.id)}
                    className="flex-1 text-left truncate"
                  >
                    {chat.title}
                  </button>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setRenamingId(chat.id);
                        setRenameText(chat.title);
                      }}
                      className="text-[11px] text-slate-500 hover:underline"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => onRequestDeleteChat(chat)}
                      className="text-[11px] text-red-600 dark:text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
