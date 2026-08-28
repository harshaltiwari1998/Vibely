import { useEffect, useRef, useState, useCallback } from "react";
import { Page } from "../components/Page";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../store/auth";
import { RealtimeEvent } from "@vibely/types";
import { useLocalization } from "../locales";
import api from "../lib/api";

type Conversation = {
  id: string;
  peer: { id: string; username: string; avatarUrl?: string };
  lastMessage?: { content: string; createdAt: string };
  updatedAt: string;
};

type Message = {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  status: "SENT" | "DELIVERED" | "READ" | "FAILED";
  createdAt: string;
};

export function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [translationMode, setTranslationMode] = useState<"original" | "translated" | "both">("original");
  const [targetLanguage, setTargetLanguage] = useState("hi");
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const accessToken = useAuthStore((s) => s.accessToken);
  const wsUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000";
  const { t } = useLocalization();

  const translateMessage = useCallback(async (messageId: string, content: string) => {
    if (translations[messageId]) return;
    try {
      const { data } = await api.post("/translation/translate", {
        text: content,
        targetLanguage: targetLanguage,
      });
      if (data?.translatedText) {
        setTranslations((prev) => ({ ...prev, [messageId]: data.translatedText }));
      }
    } catch {
      // ignore translation errors
    }
  }, [targetLanguage, translations]);

  useEffect(() => {
    if (!accessToken) return;
    const sock = io(wsUrl, {
      auth: { token: `Bearer ${accessToken}` },
      transports: ["websocket"],
    });
    socketRef.current = sock;

    sock.on("connect", () => {
      loadConversations();
    });

    sock.on(RealtimeEvent.MessageSent, (payload: { messageId: string; chatId: string; senderId: string; content: string; createdAt: string }) => {
      if (activeChatId === payload.chatId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.messageId)) return prev;
          return [
            ...prev,
            {
              id: payload.messageId,
              chatId: payload.chatId,
              senderId: payload.senderId,
              content: payload.content,
              status: "SENT",
              createdAt: payload.createdAt,
            },
          ];
        });
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
      setConversations((prev) =>
        prev.map((c) =>
          c.id === payload.chatId
            ? { ...c, lastMessage: { content: payload.content, createdAt: payload.createdAt }, updatedAt: payload.createdAt }
            : c,
        ),
      );
    });

    sock.on(RealtimeEvent.MessageDelivered, (payload: { messageId: string }) => {
      setMessages((prev) => prev.map((m) => (m.id === payload.messageId ? { ...m, status: "DELIVERED" } : m)));
    });

    sock.on(RealtimeEvent.MessageRead, (payload: { messageId: string; userId: string }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === payload.messageId && m.senderId !== payload.userId ? { ...m, status: "READ" } : m)),
      );
    });

    sock.on(RealtimeEvent.TypingStarted, (payload: { chatId: string; userId: string }) => {
      if (activeChatId === payload.chatId) {
        setTypingUsers((prev) => new Set(prev).add(payload.userId));
      }
    });

    sock.on(RealtimeEvent.TypingStopped, (payload: { chatId: string; userId: string }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(payload.userId);
        return next;
      });
    });

    return () => {
      sock.disconnect();
    };
  }, [accessToken, wsUrl, activeChatId]);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch(`${wsUrl}/api/chat`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.items ?? data);
      }
    } catch {
      // ignore
    }
  }, [accessToken, wsUrl]);

  const loadMessages = useCallback(async (chatId: string) => {
    try {
      const res = await fetch(`${wsUrl}/api/chat/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.items ?? data);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
    } catch {
      // ignore
    }
  }, [accessToken, wsUrl]);

  useEffect(() => {
    if (translationMode === "original") return;
    messages.forEach((m) => {
      if (!translations[m.id]) {
        translateMessage(m.id, m.content);
      }
    });
  }, [messages, translationMode, targetLanguage, translateMessage, translations]);

  const openChat = (chat: Conversation) => {
    setActiveChatId(chat.id);
    loadMessages(chat.id);
    setTypingUsers(new Set());
  };

  const send = async () => {
    if (!text.trim() || !activeChatId || !socketRef.current) return;
    const optimistic: Message = {
      id: crypto.randomUUID(),
      chatId: activeChatId,
      senderId: useAuthStore.getState().userId ?? "",
      content: text.trim(),
      status: "SENT",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setText("");
    socketRef.current.emit(RealtimeEvent.MessageSent, { chatId: activeChatId, content: optimistic.content });
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const handleTyping = () => {
    if (!socketRef.current || !activeChatId) return;
    socketRef.current.emit(RealtimeEvent.TypingStarted, { chatId: activeChatId });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit(RealtimeEvent.TypingStopped, { chatId: activeChatId });
    }, 2000);
  };

  const markRead = async (messageId: string) => {
    if (!socketRef.current || !activeChatId) return;
    await fetch(`${wsUrl}/api/chat/${messageId}/read`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    socketRef.current.emit(RealtimeEvent.MessageRead, { messageId, userId: useAuthStore.getState().userId });
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderStatus = (status: string) => {
    if (status === "SENT") return "✓";
    if (status === "DELIVERED") return "✓✓";
    if (status === "READ") return <span className="text-blue-500">✓✓</span>;
    return "";
  };

  const myId = useAuthStore.getState().userId;

  return (
    <Page title="Chat">
      <div className="card flex h-[70vh] overflow-hidden p-0">
        <div className="w-64 border-r border-gray-200 bg-gray-50">
          <div className="p-3 text-lg font-semibold">Conversations</div>
          <div className="overflow-y-auto">
            {conversations.length === 0 && <p className="p-3 text-sm text-gray-400">No conversations yet.</p>}
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => openChat(c)}
                className={`w-full border-b border-gray-100 p-3 text-left hover:bg-gray-100 ${
                  activeChatId === c.id ? "bg-brand-50" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-brand-200" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{c.peer.username}</div>
                    {c.lastMessage && (
                      <div className="truncate text-xs text-gray-500">{c.lastMessage.content}</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-col">
          {activeChatId ? (
            <>
              <div className="border-b border-gray-200 p-3 font-semibold">
                {conversations.find((c) => c.id === activeChatId)?.peer.username ?? "Chat"}
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{t.chat.translated}:</span>
                  <select
                    className="input text-xs"
                    value={translationMode}
                    onChange={(e) => setTranslationMode(e.target.value as "original" | "translated" | "both")}
                  >
                    <option value="original">{t.chat.original}</option>
                    <option value="translated">{t.chat.translated}</option>
                    <option value="both">{t.chat.both}</option>
                  </select>
                  <select
                    className="input text-xs"
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                  >
                    <option value="hi">Hindi</option>
                    <option value="en">English</option>
                  </select>
                </div>
                {messages.map((m) => {
                  const fromMe = m.senderId === myId;
                  const translated = translations[m.id];
                  return (
                    <div
                      key={m.id}
                      className={`flex ${fromMe ? "justify-end" : "justify-start"}`}
                      onMouseEnter={() => fromMe && m.status === "DELIVERED" && markRead(m.id)}
                    >
                      <div
                        className={`max-w-[70%] rounded-xl px-3 py-2 text-sm ${
                          fromMe ? "bg-brand-100" : "bg-gray-100"
                        }`}
                      >
                        {(translationMode === "original" || translationMode === "both") && (
                          <div>{m.content}</div>
                        )}
                        {(translationMode === "translated" || translationMode === "both") && translated && (
                          <div className="text-xs text-gray-500 italic">{translated}</div>
                        )}
                        {(translationMode === "translated" || translationMode === "both") && !translated && (
                          <div className="text-xs text-gray-400">{t.translation.translating}</div>
                        )}
                        <div className="mt-1 flex items-center justify-end gap-1 text-xs text-gray-400">
                          {formatTime(m.createdAt)}
                          {fromMe && renderStatus(m.status)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {typingUsers.size > 0 && (
                  <div className="text-xs text-gray-400">Someone is typing...</div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="border-t border-gray-200 p-3">
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      handleTyping();
                    }}
                    placeholder="Type a message"
                    onKeyDown={(e) => e.key === "Enter" && send()}
                  />
                  <button className="btn-primary" onClick={send}>Send</button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-gray-400">Select a conversation</div>
          )}
        </div>
      </div>
    </Page>
  );
}
