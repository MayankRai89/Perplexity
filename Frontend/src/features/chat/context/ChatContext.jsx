import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { connectSocket, getSocket } from "../services/chat.socket.js";
import { useAuth } from "../../auth/hook/useAuth.js";
import { fetchThreads, fetchThreadMessages, deleteThread } from "../services/chat.api.js";

const ChatContext = createContext(null);

/**
 * ChatProvider — wrap this at the App level.
 * All socket logic lives here (one instance, one connection).
 */
export function ChatProvider({ children }) {
  const { user, loading } = useAuth();

  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Refs so socket callbacks always read the latest value without
  // causing the socket-setup effect to re-run.
  const chatIdRef = useRef(null);
  const initialQuerySentRef = useRef(false);
  // Tracks the last chatId we successfully emitted joinChat for,
  // so we never send it twice (even across onConnect + join effect).
  const lastJoinedRef = useRef(null);

  // ── Threads ──────────────────────────────────────────────────────────────
  const loadThreads = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetchThreads();
      if (response.success) setThreads(response.threads);
    } catch (err) {
      console.error("Failed to load chat threads:", err);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && user) loadThreads();
  }, [user, loading, loadThreads]);

  // ── Active thread messages ────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      if (!chatId || !user) return;
      if (messages.length > 0) return; // already have messages in memory

      setLoadingHistory(true);
      try {
        const response = await fetchThreadMessages(chatId);
        if (response.success) {
          setMessages(
            response.messages.map((msg) => ({
              text: msg.content,
              isUser: msg.role === "user",
            }))
          );
        }
      } catch (err) {
        console.error("Failed to load thread messages:", err);
      } finally {
        setLoadingHistory(false);
      }
    };
    load();
  }, [chatId, user]); // messages intentionally omitted — we check .length inside

  // ── Socket: set up listeners ONCE per user session ───────────────────────
  useEffect(() => {
    if (loading || !user) return;

    const socket = connectSocket();

    const onConnect = () => {
      setIsConnected(true);
      lastJoinedRef.current = null; // reset on every new connection
      console.log("Socket connected:", socket.id);
      // Re-join current room after connect/reconnect (lastJoinedRef was reset above)
      if (chatIdRef.current) {
        lastJoinedRef.current = chatIdRef.current;
        socket.emit("joinChat", { chatId: chatIdRef.current });
      }
    };

    const onDisconnect = () => {
      setIsConnected(false);
      console.log("Socket disconnected");
    };

    const onChatCreated = ({ chatId: newId }) => {
      chatIdRef.current = newId;
      setChatId(newId);
      loadThreads();
    };

    const onTitleUpdated = ({ chatId: updatedId, title }) => {
      // Update the title in the threads list without a round-trip
      setThreads((prev) =>
        prev.map((t) => (t._id === updatedId ? { ...t, title } : t))
      );
    };

    const onAiResponse = ({ chatId: activeChatId, message }) => {
      setMessages((prev) => [...prev, { text: message.content, isUser: false }]);
      setIsAiResponding(false);
      if (activeChatId !== chatIdRef.current) {
        chatIdRef.current = activeChatId;
        setChatId(activeChatId);
      }
    };

    const onError = (err) => {
      console.error("Socket error:", err);
      setIsAiResponding(false);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("chatCreated", onChatCreated);
    socket.on("titleUpdated", onTitleUpdated);
    socket.on("aiResponse", onAiResponse);
    socket.on("error", onError);

    // Only call onConnect synchronously if socket was already connected
    // before this effect ran (e.g. user is logged in and socket persisted).
    if (socket.connected) onConnect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("chatCreated", onChatCreated);
      socket.off("titleUpdated", onTitleUpdated);
      socket.off("aiResponse", onAiResponse);
      socket.off("error", onError);
    };
  }, [user, loading, loadThreads]); // ← chatId is NOT here

  // ── Socket: join/switch room when chatId changes ──────────────────────────
  useEffect(() => {
    chatIdRef.current = chatId;
    const socket = getSocket();
    // Only emit if socket is connected AND we haven't already joined this room
    // (lastJoinedRef prevents the double-emit with onConnect)
    if (!socket || !socket.connected || !chatId) return;
    if (lastJoinedRef.current === chatId) return; // already joined, skip
    lastJoinedRef.current = chatId;
    socket.emit("joinChat", { chatId });
  }, [chatId]);

  // ── Public actions ────────────────────────────────────────────────────────
  const switchChat = useCallback((newChatId) => {
    // No-op if already on this chat — prevents oscillation from stale renders
    if (newChatId === chatIdRef.current) return;
    chatIdRef.current = newChatId;
    setChatId(newChatId);
    setMessages([]); // clear so history loads fresh
    initialQuerySentRef.current = !!newChatId;
  }, []);

  const sendMessage = useCallback((content) => {
    const socket = getSocket();
    if (!socket?.connected || !user) return;
    setMessages((prev) => [...prev, { text: content, isUser: true }]);
    setIsAiResponding(true);
    socket.emit("userMessage", {
      chatId: chatIdRef.current,
      userId: user.id || user._id,
      content,
    });
  }, [user]);

  const sendInitialQuery = useCallback((query) => {
    const socket = getSocket();
    if (!socket || !user || initialQuerySentRef.current) return;
    initialQuerySentRef.current = true;
    setMessages([{ text: query, isUser: true }]);
    setIsAiResponding(true);

    const emit = () =>
      socket.emit("userMessage", {
        chatId: null,
        userId: user.id || user._id,
        content: query,
      });

    if (socket.connected) emit();
    else socket.once("connect", emit);
  }, [user]);

  const deleteChat = useCallback(async (idToDelete) => {
    try {
      const response = await deleteThread(idToDelete);
      if (response.success) {
        if (idToDelete === chatIdRef.current) {
          chatIdRef.current = null;
          setChatId(null);
          setMessages([]);
        }
        loadThreads();
      }
    } catch (err) {
      console.error("Failed to delete chat thread:", err);
    }
  }, [loadThreads]);

  const resetInitialQuery = useCallback(() => {
    initialQuerySentRef.current = false;
  }, []);

  const value = {
    messages,
    setMessages,
    chatId,
    setChatId: switchChat,
    threads,
    isConnected,
    isAiResponding,
    loadingHistory,
    sendMessage,
    sendInitialQuery,
    resetInitialQuery,
    deleteChat,
    loadThreads,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

/** Hook for consuming chat context anywhere in the tree. */
export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used inside <ChatProvider>");
  return ctx;
}
