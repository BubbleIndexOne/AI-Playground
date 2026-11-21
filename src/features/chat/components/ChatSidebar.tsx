import {
  Edit2,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BlobbieAvatar,
  Button,
  IconButton,
  Input,
  Tooltip,
} from '../../../shared/ui';
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
  readonly onPruneEmptyChats?: (emptyIds: string[]) => void;
}

/**
 * Smoothly scrolls/slides long truncated agent names horizontally on hover.
 */
function SlidingAgentName({ name }: { name: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflowPx, setOverflowPx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const updateOverflow = () => {
      if (containerRef.current && textRef.current) {
        const diff =
          textRef.current.scrollWidth - containerRef.current.clientWidth;
        setOverflowPx(diff > 0 ? diff : 0);
      }
    };
    updateOverflow();
    window.addEventListener('resize', updateOverflow);
    return () => window.removeEventListener('resize', updateOverflow);
  }, [name]);

  const slideDuration = Math.max(1.5, overflowPx / 35);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="overflow-hidden whitespace-nowrap min-w-0 flex-1 relative"
    >
      <span
        ref={textRef}
        style={{
          transform:
            isHovered && overflowPx > 0
              ? `translateX(-${overflowPx + 8}px)`
              : 'translateX(0)',
          transition:
            isHovered && overflowPx > 0
              ? `transform ${slideDuration}s cubic-bezier(0.2, 0.8, 0.4, 1)`
              : 'transform 0.4s ease-out',
        }}
        className="inline-block"
      >
        {name}
      </span>
    </div>
  );
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
  onPruneEmptyChats,
}: ChatSidebarProps) {
  const navigate = useNavigate();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  // Filter conversations in real time so users never have to scroll through dozens of chats
  const filteredChats = useMemo(() => {
    if (!searchFilter.trim()) return chats ?? [];
    const query = searchFilter.toLowerCase().trim();
    return (chats ?? []).filter(
      (c) =>
        (c.title ?? '').toLowerCase().includes(query) ||
        (c.messages ?? []).some((m) =>
          (m.content ?? '').toLowerCase().includes(query)
        )
    );
  }, [chats, searchFilter]);

  // Detect redundant empty conversations
  const emptyChats = useMemo(() => {
    return (chats ?? []).filter((c) => (c.messages ?? []).length === 0);
  }, [chats]);

  return (
    <div className="w-full md:w-80 shrink-0 rounded-xl border border-subtle bg-card shadow-card flex flex-row h-full min-h-[540px] overflow-hidden">
      {/* ─── LEFT RAIL: All Agents Always Visible ─── */}
      <div className="w-[62px] shrink-0 bg-app/60 border-r border-subtle flex flex-col items-center py-3 select-none justify-between">
        <div className="w-full flex flex-col items-center gap-2.5 overflow-y-auto no-scrollbar max-h-[calc(100vh-12rem)]">
          <span className="text-[9px] font-bold text-muted uppercase tracking-wider pb-0.5">
            Agents
          </span>

          {agents.map((agent) => {
            const isCurrent = agent.id === selectedAgentId;

            return (
              <Tooltip key={agent.id} content={agent.name} side="right">
                <button
                  type="button"
                  onClick={() => onSelectAgent(agent.id)}
                  className={`relative p-1 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                    isCurrent
                      ? 'ring-2 ring-accent bg-raised shadow-xs'
                      : 'opacity-75 hover:opacity-100 hover:bg-hover'
                  }`}
                  aria-label={`Select agent ${agent.name}`}
                >
                  {isCurrent && (
                    <span className="absolute -left-1.5 top-2.5 bottom-2.5 w-1 bg-accent rounded-r-full shadow-xs" />
                  )}
                  <BlobbieAvatar
                    config={agent.avatar ?? agent.name}
                    size={36}
                    interactive={false}
                  />
                </button>
              </Tooltip>
            );
          })}
        </div>

        {/* Bottom Rail Action: Manage / Add Agents */}
        <div className="pt-2 border-t border-subtle/50 w-full flex justify-center">
          <Tooltip content="Explore & Add Agents" side="right">
            <button
              type="button"
              onClick={() => navigate('/marketplace')}
              className="w-9 h-9 rounded-xl border border-dashed border-subtle flex items-center justify-center text-muted hover:text-primary hover:border-accent hover:bg-hover transition-all cursor-pointer"
              aria-label="Add or browse agents"
            >
              <Plus size={15} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* ─── RIGHT PANE: Dedicated Conversations Panel ─── */}
      <div className="flex-1 flex flex-col min-w-0 bg-card">
        {/* Pane Header */}
        <div className="p-3 border-b border-subtle space-y-2">
          <div className="flex items-center justify-between gap-1.5 min-w-0">
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-medium text-muted block leading-none">
                Conversations
              </span>
              <div className="text-[13px] font-semibold text-primary truncate mt-0.5">
                {selectedAgent ? (
                  <SlidingAgentName name={selectedAgent.name} />
                ) : (
                  'No agent'
                )}
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              icon={<Plus size={13} />}
              disabled={!selectedAgentId}
              onClick={onCreateChat}
              className="shrink-0 text-[12px] px-2.5 h-7"
            >
              New
            </Button>
          </div>

          {/* Real-time search filter */}
          <div className="relative">
            <Search
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter chats..."
              className="w-full text-[12px] bg-app border border-subtle rounded-lg pl-7 pr-6 py-1 text-primary placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
            />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-primary p-0.5"
                aria-label="Clear filter"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Clean up redundant empty chats notice */}
        {emptyChats.length > 1 && onPruneEmptyChats && (
          <div className="mx-2.5 mt-2 p-1.5 rounded-lg bg-warning-tint/50 border border-warning-border/50 flex items-center justify-between text-[11px] text-warning">
            <span>{emptyChats.length} empty chats</span>
            <button
              type="button"
              onClick={() =>
                onPruneEmptyChats(emptyChats.slice(1).map((c) => c.id))
              }
              className="underline font-semibold hover:text-primary cursor-pointer"
            >
              Clean up
            </button>
          </div>
        )}

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
          {filteredChats.length === 0 ? (
            <div className="px-3 py-8 text-center text-muted text-[12px] space-y-2">
              <MessageSquare size={20} className="mx-auto text-muted/60" />
              <p>
                {searchFilter
                  ? `No chats matching "${searchFilter}"`
                  : `No conversations yet for ${selectedAgent?.name ?? 'agent'}.`}
              </p>
              {!searchFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Sparkles size={12} />}
                  onClick={onCreateChat}
                  className="text-[11px] text-accent"
                >
                  Start a chat
                </Button>
              )}
            </div>
          ) : (
            filteredChats.map((chat) => {
              const active = chat.id === selectedChatId;
              const isRenaming = renamingId === chat.id;

              return (
                <div
                  key={chat.id}
                  className={`group rounded-lg px-2.5 py-1.5 text-[13px] transition-colors ${
                    active
                      ? 'bg-accent-tint text-primary font-medium'
                      : 'text-secondary hover:text-primary hover:bg-hover'
                  }`}
                >
                  {isRenaming ? (
                    <div className="flex items-center gap-1.5">
                      <Input
                        value={renameText}
                        onChange={(e) => setRenameText(e.target.value)}
                        className="text-[12px] h-7 px-1.5"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            onRenameChat(chat.id, renameText);
                            setRenamingId(null);
                          } else if (e.key === 'Escape') {
                            setRenamingId(null);
                          }
                        }}
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        className="h-7 text-[11px] px-2"
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
                          className={`shrink-0 ${
                            active ? 'text-accent' : 'text-muted'
                          }`}
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
      </div>
    </div>
  );
}
