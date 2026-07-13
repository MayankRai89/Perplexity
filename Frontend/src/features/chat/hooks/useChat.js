import { useState, useEffect, useRef } from "react";
import { connectSocket, getSocket } from "../services/chat.socket.js";
import { useAuth } from "../../auth/hook/useAuth.js";
import { fetchThreads, fetchThreadMessages, deleteThread } from "../services/chat.api.js";

export const useChat = (initialChatId = null) => {
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useState(initialChatId);
  const [threads, setThreads] = useState([]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const initialQuerySentRef = useRef(false);

  // Sync state with prop when switching threads
  useEffect(() => {
    setChatId(initialChatId);
    setMessages([]); // Always clear messages on thread switch to trigger database reload and visual reset
    if (initialChatId) {
      initialQuerySentRef.current = true;
    } else {
      initialQuerySentRef.current = false;
    }
  }, [initialChatId]);

  // Load user's chat threads on login
  const loadThreads = async () => {
    if (!user) return;
    try {
      const response = await fetchThreads();
      if (response.success) {
        setThreads(response.threads);
      }
    } catch (error) {
      console.error("Failed to load chat threads:", error);
    }
  };

  useEffect(() => {
    if (!loading && user) {
      loadThreads();
    }
  }, [user, loading]);

  // Load messages for the active thread if one is selected
  useEffect(() => {
    const loadMessages = async () => {
      if (!chatId || !user) return;
      // Only fetch if messages list is empty (avoids fetching during live conversation)
      if (messages.length > 0) return;

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
      } catch (error) {
        console.error("Failed to load thread messages:", error);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadMessages();
  }, [chatId, user]);

  useEffect(() => {
    if (loading || !user) return;

    const socket = connectSocket();

    const onConnect = () => {
      setIsConnected(true);
      console.log("Chat socket connected:", socket.id);
      if (chatId) {
        socket.emit("joinChat", { chatId });
      }
    };

    const onDisconnect = () => {
      setIsConnected(false);
      console.log("Chat socket disconnected");
    };

    const onChatCreated = ({ chatId: newChatId }) => {
      setChatId(newChatId);
      loadThreads();
    };

    const onAiResponse = ({ chatId: activeChatId, message }) => {
      setMessages((prev) => [
        ...prev,
        { text: message.content, isUser: false },
      ]);
      setIsAiResponding(false);
      setChatId(activeChatId);
    };

    const onError = (err) => {
      console.error("Socket chat error:", err);
      setIsAiResponding(false);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("chatCreated", onChatCreated);
    socket.on("aiResponse", onAiResponse);
    socket.on("error", onError);

    if (socket.connected) {
      onConnect();
    } else {
      socket.connect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("chatCreated", onChatCreated);
      socket.off("aiResponse", onAiResponse);
      socket.off("error", onError);
    };
  }, [user, loading, chatId]);

  const sendMessage = (content) => {
    const socket = getSocket();
    if (!socket || !socket.connected || !user) return;

    setMessages((prev) => [...prev, { text: content, isUser: true }]);
    setIsAiResponding(true);

    socket.emit("userMessage", {
      chatId,
      userId: user.id || user._id,
      content,
    });
  };

  const sendInitialQuery = (query) => {
    const socket = getSocket();
    if (!socket || !user || initialQuerySentRef.current) return;

    initialQuerySentRef.current = true;
    setMessages([{ text: query, isUser: true }]);
    setIsAiResponding(true);

    const emitQuery = () => {
      socket.emit("userMessage", {
        chatId: null,
        userId: user.id || user._id,
        content: query,
      });
    };

    if (socket.connected) {
      emitQuery();
    } else {
      socket.once("connect", emitQuery);
    }
  };

  const deleteChat = async (idToDelete) => {
    try {
      const response = await deleteThread(idToDelete);
      if (response.success) {
        if (idToDelete === chatId) {
          setChatId(null);
          setMessages([]);
        }
        loadThreads();
      }
    } catch (error) {
      console.error("Failed to delete chat thread:", error);
    }
  };

  return {
    messages,
    chatId,
    threads,
    isConnected,
    isAiResponding,
    loadingHistory,
    sendMessage,
    sendInitialQuery,
    deleteChat,
    setMessages,
  };
};
