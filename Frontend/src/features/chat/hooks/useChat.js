/**
 * useChat — thin wrapper around ChatContext.
 *
 * If `initialChatId` is provided (from the URL param), switches the
 * active thread when it changes. switchChat() in the context is a
 * no-op if the same ID is passed, so this is safe to call on every render.
 *
 * All socket logic lives in ChatProvider (ChatContext.jsx).
 */
import { useEffect } from "react";
import { useChatContext } from "../context/ChatContext.jsx";

export const useChat = (initialChatId = null) => {
  const ctx = useChatContext();

  useEffect(() => {
    if (initialChatId) {
      ctx.setChatId(initialChatId);
    }
  }, [initialChatId]); // eslint-disable-line react-hooks/exhaustive-deps

  return ctx;
};
