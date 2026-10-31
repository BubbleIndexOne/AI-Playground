import { Edit2, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button, IconButton, Input } from '../../../shared/ui';
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

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  return (
    <div className="w-full md:w-64 shrink-0 rounded-xl border border-subtle bg-card shadow-card flex flex-col overflow-hidden">
      <div className="p-3.5 border-b border-subtle flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-primary">
          Conversations
        </span>
        <Button
          variant="secondary"
          size="sm"
          icon={<Plus size={14} />}
          disabled={!selectedAgentId}
          onClick={onCreateChat}
        >
          New chat
        </Button>
      </div>

      {/* Grouped by Agent */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3 max-h-[520px]">
        {agents.map((agent) => {
          const isCurrentAgent = agent.id === selectedAgentId;
          const agentChats = isCurrentAgent ? chats : [];

          return (
            <div key={agent.id} className="space-y-1">
              <button
                type="button"
                onClick={() => onSelectAgent(agent.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-[12px] font-semibold transition-colors cursor-pointer ${
                  isCurrentAgent
                    ? 'text-primary bg-raised'
                    : 'text-muted hover:text-primary hover:bg-hover'
                }`}
              >
                <span className="truncate">{agent.name}</span>
                {isCurrentAgent && (
                  <span className="font-mono text-[11px] text-secondary">
                    {agentChats.length}
                  </span>
                )}
              </button>

              {isCurrentAgent && (
                <div className="pl-2 space-y-0.5">
                  {agentChats.length === 0 ? (
                    <p className="px-2.5 py-2 text-[12px] text-muted">
                      No chats for {selectedAgent?.name}.
                    </p>
                  ) : (
                    agentChats.map((chat) => {
                      const active = chat.id === selectedChatId;
                      return (
                        <div
                          key={chat.id}
                          className={`group rounded-lg px-2.5 py-1.5 text-[13px] transition-colors ${
                            active
                              ? 'bg-accent-tint text-primary font-medium'
                              : 'text-secondary hover:text-primary hover:bg-hover'
                          }`}
                        >
                          {renamingId === chat.id ? (
                            <div className="flex items-center gap-1.5">
                              <Input
                                value={renameText}
                                onChange={(e) => setRenameText(e.target.value)}
                              />
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                  onRenameChat(chat.id, renameText);
                                  setRenamingId(null);
                                }}
                              >
                                Save
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-1.5">
                              <button
                                type="button"
                                onClick={() => onSelectChat(chat.id)}
                                className="flex-1 flex items-center gap-2 text-left min-w-0 cursor-pointer"
                              >
                                <MessageSquare
                                  size={13}
                                  className="shrink-0 text-muted"
                                />
                                <span className="truncate">{chat.title}</span>
                              </button>
                              <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity">
                                <IconButton
                                  aria-label="Rename conversation"
                                  icon={<Edit2 size={12} />}
                                  size="sm"
                                  onClick={() => {
                                    setRenamingId(chat.id);
                                    setRenameText(chat.title);
                                  }}
                                />
                                <IconButton
                                  aria-label="Delete conversation"
                                  icon={<Trash2 size={12} />}
                                  variant="danger"
                                  size="sm"
                                  onClick={() => onRequestDeleteChat(chat)}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
