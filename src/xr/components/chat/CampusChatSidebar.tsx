import { xrApi, xrWsUrl } from '../../lib/xrApi';
import { queueOutbox, flushOutbox, outboxCount, onReconnect } from '../../lib/offline';
import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Users,
  Radio,
  ChevronDown,
  Sparkles,
  Smile,
  GraduationCap,
  FlaskConical,
  Orbit,
  Dna,
  Share2,
  RefreshCw
} from 'lucide-react';
import { AvatarConfig, ChatMessage, ChatPeer } from '../../types';

interface Props {
  currentRoomId: string;
  currentRoomName: string;
  currentUser: {
    id: string;
    name: string;
    avatar: AvatarConfig;
  };
  isOpen: boolean;
  onClose: () => void;
  onNavigateToRoom?: (roomId: string) => void;
}

const ROOM_OPTIONS = [
  { id: 'floor-1', label: 'Floor 1: Grand Atrium & Commons', icon: Users },
  { id: 'floor-2', label: 'Floor 2: Cellular Bio & Optics', icon: Dna },
  { id: 'floor-3', label: 'Floor 3: Kepler Observatory', icon: Orbit },
  { id: 'floor-4', label: 'Floor 4: Advanced XR Labs', icon: Sparkles },
  { id: 'chemistry', label: 'Lab: Molecular Chemistry Bench', icon: FlaskConical },
  { id: 'astrophysics', label: 'Lab: Kepler Astrophysics', icon: Orbit },
  { id: 'biology', label: 'Lab: Cellular Biology', icon: Dna },
  { id: 'optics', label: 'Lab: Wave Optics', icon: Sparkles },
];

const QUICK_STAMPS = ['🔬', '⚛️', '🔭', '🧪', '💡', '🚀', '✨'];

export const CampusChatSidebar: React.FC<Props> = ({
  currentRoomId: propRoomId,
  currentRoomName: propRoomName,
  currentUser,
  isOpen,
  onClose,
  onNavigateToRoom,
}) => {
  const [activeRoomId, setActiveRoomId] = useState<string>(propRoomId || 'floor-1');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [peers, setPeers] = useState<ChatPeer[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [inputText, setInputText] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isRoomDropdownOpen, setIsRoomDropdownOpen] = useState<boolean>(false);
  const [showPeersList, setShowPeersList] = useState<boolean>(false);

  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  // Sync prop changes to room
  useEffect(() => {
    if (propRoomId && propRoomId !== activeRoomId) {
      setActiveRoomId(propRoomId);
    }
  }, [propRoomId]);

  // Connect to WebSocket Server
  useEffect(() => {
    let isMounted = true;

    function connect() {
      try {
                const wsUrl = xrWsUrl('/ws/campus-chat');
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (!isMounted) return;
          setIsConnected(true);
          // Join active room
          ws.send(
            JSON.stringify({
              type: 'join',
              roomId: activeRoomId,
              user: {
                id:
                  currentUser.id ||
                  `student-${String(currentUser.name || 'student').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'anon'}`,
                name: currentUser.name,
                avatar: currentUser.avatar,
                status: 'active',
              },
            })
          );
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'init') {
              setMessages(data.messages || []);
            } else if (data.type === 'message') {
              if (data.message && data.roomId === activeRoomId) {
                setMessages((prev) => {
                  // Idempotency check
                  if (prev.some((m) => m.id === data.message.id)) return prev;
                  return [...prev, data.message];
                });
              }
            } else if (data.type === 'presence') {
              if (data.roomId === activeRoomId && Array.isArray(data.peers)) {
                setPeers(data.peers);
              }
            }
          } catch (e) {
            console.error('WebSocket parse error:', e);
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setIsConnected(false);
          // Attempt graceful reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        };

        ws.onerror = (err) => {
          console.warn('WebSocket connection error; will retry:', err);
          ws.close();
        };

        socketRef.current = ws;
      } catch (err) {
        console.error('Failed to initialize WebSocket:', err);
      }
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [activeRoomId, currentUser]);

  // Fallback REST fetch if WS takes a moment
  useEffect(() => {
    async function loadFallbackMessages() {
      try {
        const res = await fetch(`${xrApi('/campus/chat/messages')}?roomId=${activeRoomId}`);
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setMessages((prev) => (prev.length === 0 ? data.messages : prev));
        }
      } catch (e) {
        /* ignore */
      }
    }
    loadFallbackMessages();
  }, [activeRoomId]);

  // Replay queued offline messages whenever connectivity returns.
  useEffect(() => {
    setPendingCount(0);
    outboxCount().then(setPendingCount).catch(() => {});
    return onReconnect(async () => {
      const { remaining } = await flushOutbox().catch(() => ({ sent: 0, remaining: 0 }));
      setPendingCount(remaining);
    });
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const senderId =
      currentUser.id ||
      `student-${String(currentUser.name || 'student').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'anon'}`;
    const payload = {
      type: 'message',
      roomId: activeRoomId,
      sender: {
        id: senderId,
        name: currentUser.name,
        avatar: currentUser.avatar,
      },
      text,
    };

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    } else {
      // Fallback via HTTP REST, queued offline and replayed on reconnect
      // (the service worker also replays via background sync).
      fetch(xrApi('/campus/chat/send'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.message) {
            setMessages((prev) => [...prev, data.message]);
          }
        })
        .catch(async () => {
          await queueOutbox({
            url: xrApi('/campus/chat/send'),
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          setMessages((prev) => [
            ...prev,
            {
              id: `queued-${Date.now()}`,
              roomId: activeRoomId,
              sender: payload.sender,
              text: `${text} (queued — will send when back online)`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
          setPendingCount(await outboxCount());
        });
    }

    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const currentRoomLabel = ROOM_OPTIONS.find((r) => r.id === activeRoomId)?.label || propRoomName || activeRoomId;

  if (!isOpen) return null;

  return (
    <div className="fixed top-14 bottom-0 right-0 w-80 sm:w-96 bg-slate-950/95 border-l border-slate-800 z-40 flex flex-col shadow-2xl backdrop-blur-lg animate-in slide-in-from-right duration-200">
      {/* Sidebar Header */}
      <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-xs">Real-Time Campus Chat</span>
              {pendingCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono" title="Messages queued offline — they send automatically on reconnect">
                  {pendingCount} queued
                </span>
              )}
              <span
                className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}
                title={isConnected ? 'Connected to WebSocket' : 'Connecting to campus mesh...'}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Peer-to-Peer Study Session</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Peer Presence Toggle */}
          <button
            onClick={() => setShowPeersList(!showPeersList)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
              showPeersList ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
            title="View peers currently in this room"
          >
            <Users className="w-3 h-3" />
            <span>{peers.length > 0 ? peers.length : 3}</span>
          </button>

          {/* Close Sidebar */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Room Selector Bar */}
      <div className="px-3.5 py-2 bg-slate-900/60 border-b border-slate-800 relative">
        <button
          onClick={() => setIsRoomDropdownOpen(!isRoomDropdownOpen)}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 hover:border-slate-700 cursor-pointer"
        >
          <div className="flex items-center gap-2 truncate">
            <Radio className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-pulse" />
            <span className="truncate font-medium">{currentRoomLabel}</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
        </button>

        {/* Dropdown Menu */}
        {isRoomDropdownOpen && (
          <div className="absolute top-12 left-3.5 right-3.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 max-h-64 overflow-y-auto">
            <span className="text-[10px] font-mono uppercase text-slate-500 px-2 py-1 block">Switch Campus Channel</span>
            {ROOM_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setActiveRoomId(opt.id);
                    setIsRoomDropdownOpen(false);
                    if (onNavigateToRoom) onNavigateToRoom(opt.id);
                  }}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-left cursor-pointer transition-colors ${
                    activeRoomId === opt.id
                      ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Peers Drawer (Collapsible) */}
      {showPeersList && (
        <div className="p-3 bg-slate-900/90 border-b border-slate-800 text-xs animate-in slide-in-from-top">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-cyan-400 font-semibold uppercase">Peers in this Space</span>
            <span className="text-[10px] text-slate-500">Auto-synced</span>
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {/* Current user */}
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950 border border-slate-800/80">
              <div className="flex items-center gap-2">
                {currentUser.avatar?.photoUrl ? (
                  <img
                    src={currentUser.avatar.photoUrl}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="w-4 h-4 rounded-full object-cover border border-cyan-400/60"
                  />
                ) : (
                  <span
                    className="w-3 h-3 rounded-full border border-white/40"
                    style={{ backgroundColor: currentUser.avatar?.primaryColor || '#06b6d4' }}
                  />
                )}
                <span className="font-semibold text-white">{currentUser.name} (You)</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">Present</span>
            </div>

            {/* Other peers */}
            {peers.length > 0 ? (
              peers.map((peer, i) => (
                <div
                  key={peer.id || i}
                  className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/50"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full border border-white/40"
                      style={{ backgroundColor: peer.avatar?.primaryColor || '#10b981' }}
                    />
                    <span className="text-slate-300">{peer.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">In Lab</span>
                </div>
              ))
            ) : (
              <>
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/50">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="text-slate-300">Alex Rivera</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Bench 2</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/50">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-purple-400" />
                    <span className="text-slate-300">Maya Patel</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Running VSEPR</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Chat Messages Feed */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3">
        {messages.map((msg) => {
          const isMe = msg.sender?.id === currentUser.id;
          const isFaculty = msg.sender?.isFaculty;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in duration-150`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                {!isMe && (
                  msg.sender?.avatar?.photoUrl ? (
                    <img
                      src={msg.sender.avatar.photoUrl}
                      alt={msg.sender?.name}
                      referrerPolicy="no-referrer"
                      className="w-4 h-4 rounded-full object-cover border border-white/30"
                    />
                  ) : (
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-white/30"
                      style={{ backgroundColor: msg.sender?.avatar?.primaryColor || '#06b6d4' }}
                    />
                  )
                )}
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                  {msg.sender?.name}
                  {isFaculty && (
                    <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[9px] font-mono border border-purple-500/30">
                      Faculty
                    </span>
                  )}
                </span>
                <span className="text-[9px] text-slate-500 font-mono">{msg.timestamp}</span>
              </div>

              <div
                className={`max-w-[85%] p-2.5 rounded-2xl text-xs leading-relaxed ${
                  isMe
                    ? 'bg-cyan-600 text-white rounded-tr-xs'
                    : isFaculty
                    ? 'bg-purple-950/60 border border-purple-500/40 text-purple-100 rounded-tl-xs'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-xs'
                }`}
              >
                {msg.text}
              </div>

              {msg.reaction && (
                <span className="text-sm mt-0.5 px-1.5 py-0.5 rounded-full bg-slate-900 border border-slate-800">
                  {msg.reaction}
                </span>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Reaction Stamps */}
      <div className="px-3 py-1.5 bg-slate-900/40 border-t border-slate-800 flex items-center justify-between gap-1 overflow-x-auto">
        <span className="text-[10px] text-slate-500 font-mono shrink-0 mr-1">React:</span>
        <div className="flex items-center gap-1">
          {QUICK_STAMPS.map((stamp) => (
            <button
              key={stamp}
              onClick={() => handleSendMessage(stamp)}
              className="p-1 text-xs hover:bg-slate-800 rounded transition-colors cursor-pointer"
            >
              {stamp}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input Bar */}
      <div className="p-3 bg-slate-900 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message peers in ${currentRoomLabel.split(':')[0]}...`}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim()}
            className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-slate-950 cursor-pointer transition-all shadow-md shadow-cyan-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
