import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../features/auth/hook/useAuth";
import { useChat } from "../features/chat/hooks/useChat.js";
import { useVoice } from "../features/chat/hooks/useVoice.js";
import ConfirmModal from "../features/chat/components/ConfirmModal";
import MarkdownRenderer from "../features/chat/components/MarkdownRenderer.jsx";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
});

export function parseUserMessage(content) {
  if (!content) return { fileName: null, fileContent: null, query: "" };
  const match = content.match(
    /^\[Attached File:\s*(.+?)\]\s*--- CONTENT START ---\s*([\s\S]*?)\s*--- CONTENT END ---\s*([\s\S]*)$/,
  );
  if (match) {
    return {
      fileName: match[1],
      fileContent: match[2],
      query: match[3].trim(),
    };
  }
  return {
    fileName: null,
    fileContent: null,
    query: content,
  };
}

const Chat = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [input, setInput] = useState("");
  const { user, handleLogout, loading } = useAuth();

  const activeId = searchParams.get("id");
  const messagesEndRef = useRef(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const [collections, setCollections] = useState([]);
  const [isOrganizeOpen, setIsOrganizeOpen] = useState(false);

  // File Attachment State
  const fileInputRef = useRef(null);
  const [attachedFile, setAttachedFile] = useState(null); // { name, size, content }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File size exceeds 2MB limit. Please upload a smaller file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedFile({
        name: file.name,
        size: file.size,
        content: event.target.result,
      });
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const loadCollections = async () => {
    try {
      const res = await api.get("/api/collections");
      if (res.data.success) {
        setCollections(res.data.collections);
      }
    } catch (err) {
      console.error("Failed to load folders", err);
    }
  };

  useEffect(() => {
    if (user) {
      loadCollections();
    }
  }, [user]);

  const handleAddThreadToFolder = async (colId) => {
    const threadId = chatId || activeId;
    if (!threadId) return;

    try {
      const res = await api.post(`/api/collections/${colId}/threads`, {
        threadId,
        action: "add",
      });
      if (res.data.success) {
        loadCollections();
        setIsOrganizeOpen(false);
        alert("Saved to folder successfully!");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add thread.");
    }
  };

  const {
    messages,
    chatId,
    isAiResponding,
    sendMessage,
    sendInitialQuery,
    resetInitialQuery,
    threads,
    deleteChat,
  } = useChat(activeId);

  const {
    isListening,
    autoSpeak,
    setAutoSpeak,
    speakingMessageId,
    startListening,
    stopListening,
    speakText,
    stopSpeaking,
    hasSupport,
  } = useVoice();

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((text) => {
        setInput((prev) => (prev ? prev + " " + text : text));
      });
    }
  };

  const prevResponding = useRef(false);

  useEffect(() => {
    if (
      prevResponding.current &&
      !isAiResponding &&
      autoSpeak &&
      messages.length > 0
    ) {
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage.isUser) {
        speakText(lastMessage.text, messages.length - 1);
      }
    }
    prevResponding.current = isAiResponding;
  }, [isAiResponding, messages, autoSpeak]);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiResponding]);

  useEffect(() => {
    if (chatId && searchParams.get("id") !== chatId) {
      setSearchParams({ id: chatId });
    }
  }, [chatId, searchParams, setSearchParams]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const initialQuery = searchParams.get("q");
    if (initialQuery && user && !loading) {
      resetInitialQuery();
      sendInitialQuery(initialQuery);
    }
  }, [searchParams.get("q"), user, loading]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() && !attachedFile) return;

    let finalQuery = input;
    if (attachedFile) {
      finalQuery = `[Attached File: ${attachedFile.name}]\n--- CONTENT START ---\n${attachedFile.content}\n--- CONTENT END ---\n\n${input || "Analyze the attached file."}`;
    }

    sendMessage(finalQuery);
    setInput("");
    setAttachedFile(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#131415] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin h-8 w-8 text-[#20808D]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="text-sm font-semibold">Loading session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#131415] text-slate-200 flex font-sans antialiased selection:bg-[#20808D]/30 selection:text-white overflow-hidden">
      <aside className="w-64 bg-[#191a1a] border-r border-[#2d3131]/30 flex flex-col p-4 justify-between hidden md:flex shrink-0 h-full overflow-hidden">
        <div className="flex flex-col gap-6 flex-1 min-h-0">
          <div className="flex items-center gap-2.5 px-2 shrink-0">
            <svg
              className="w-6 h-6 text-[#20808D]"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2V22M2 12H22M4.93 4.93L19.07 19.07M4.93 19.07L19.07 4.93"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-xl font-bold tracking-tight text-white select-none">
              perplexity
            </span>
          </div>

          <Link
            to="/"
            className="flex items-center justify-between text-sm font-medium bg-[#131415] hover:bg-[#202222] border border-[#2d3131] text-slate-300 hover:text-white px-4 py-2.5 rounded-xl transition duration-150 shadow-inner group w-full shrink-0"
          >
            <span className="flex items-center gap-2">
              <span className="text-slate-400 group-hover:text-white transition">
                ➕
              </span>{" "}
              New Chat
            </span>
          </Link>

          <nav className="flex flex-col gap-1 shrink-0">
            <Link
              to="/"
              className="flex items-center gap-3 text-sm font-semibold text-slate-400 hover:text-white hover:bg-[#202222]/60 px-3.5 py-2.5 rounded-xl transition"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Home
            </Link>
            <Link
              to="/discover"
              className="flex items-center gap-3 text-sm font-semibold text-slate-400 hover:text-white hover:bg-[#202222]/60 px-3.5 py-2.5 rounded-xl transition"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              Discover
            </Link>
            <Link
              to="/library"
              className="flex items-center gap-3 text-sm font-semibold text-slate-400 hover:text-white hover:bg-[#202222]/60 px-3.5 py-2.5 rounded-xl transition"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              Library
            </Link>
          </nav>

          {user && threads.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-2 border-t border-[#2d3131]/20 pt-4 flex-1 min-h-0">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-3.5 mb-1 shrink-0">
                Recent Threads
              </div>
              <div className="flex flex-col gap-0.5 overflow-y-auto px-1.5 no-scrollbar flex-1 min-h-0">
                {threads.map((thread) => (
                  <div
                    key={thread._id}
                    className={`group flex items-center justify-between hover:bg-[#202222]/60 rounded-lg py-1.5 px-2 transition shrink-0 ${
                      activeId === thread._id
                        ? "bg-[#202222]/80 text-[#20808D]"
                        : ""
                    }`}
                  >
                    <Link
                      to={`/chat?id=${thread._id}`}
                      className={`text-xs truncate flex-grow text-left pr-2 ${
                        activeId === thread._id
                          ? "text-[#20808D] font-semibold"
                          : "text-slate-400 group-hover:text-white"
                      }`}
                    >
                      {thread.title}
                    </Link>
                    <button
                      onClick={() => setDeleteTargetId(thread._id)}
                      className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1 cursor-pointer shrink-0"
                      title="Delete Thread"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Section */}
        <div className="border-t border-[#2d3131]/30 pt-4 flex flex-col gap-3 shrink-0">
          {user && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 px-2 py-1.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#20808D] to-emerald-400 flex items-center justify-center font-bold text-white text-sm shadow-md">
                  {user.username ? user.username[0].toUpperCase() : "U"}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {user.username}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {user.email}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 px-3.5 py-2 rounded-lg transition cursor-pointer"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-[#131415] h-full overflow-hidden">
        <header className="px-6 py-4 border-b border-[#2d3131]/20 flex justify-between items-center bg-[#191a1a]/40 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="md:hidden text-slate-400 hover:text-white mr-1"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <h2 className="text-sm font-semibold text-slate-300">
              Thread Session
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {(chatId || activeId) && (
              <button
                onClick={() => setIsOrganizeOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-[#131415]/60 border-[#2d3131]/60 text-slate-400 hover:text-white transition cursor-pointer"
                title="Save this chat session to a curated folder"
              >
                📁 Save to Folder
              </button>
            )}

            {hasSupport && (
              <button
                onClick={() => setAutoSpeak(!autoSpeak)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                  autoSpeak
                    ? "bg-[#20808D]/10 border-[#20808D] text-white"
                    : "bg-[#131415]/60 border-[#2d3131]/60 text-slate-400 hover:text-white"
                }`}
                title="Automatically read aloud new AI responses"
              >
                🔊 Auto-Read:{" "}
                <span className="font-bold">{autoSpeak ? "ON" : "OFF"}</span>
              </button>
            )}
            <Link
              to="/"
              className="text-xs text-[#20808D] hover:text-[#3ab2bf] font-bold transition"
            >
              Back to Home
            </Link>
          </div>
        </header>

        <div className="flex-grow p-6 overflow-y-auto space-y-5 max-w-3xl mx-auto w-full min-h-0 no-scrollbar">
          {messages.length === 0 && !isAiResponding ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 py-16">
              <svg
                className="w-12 h-12 text-[#20808D]/30 mb-4"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2V22M2 12H22M4.93 4.93L19.07 19.07M4.93 19.07L19.07 4.93"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <p className="text-sm text-slate-400">
                Ask any question to begin the conversation thread.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col gap-1 max-w-[85%] ${
                    msg.isUser ? "ml-auto items-end" : "mr-auto items-start"
                  }`}
                >
                  <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-1">
                    <span>{msg.isUser ? "You" : "Perplexity AI"}</span>
                    {!msg.isUser && (
                      <button
                        onClick={() => speakText(msg.text, index)}
                        className={`text-slate-500 hover:text-white transition duration-150 cursor-pointer p-0.5 rounded-full ${
                          speakingMessageId === index ? "text-[#20808D]" : ""
                        }`}
                        title={
                          speakingMessageId === index
                            ? "Stop reading"
                            : "Read aloud"
                        }
                      >
                        {speakingMessageId === index ? (
                          <svg
                            className="w-3.5 h-3.5 text-[#20808D] animate-pulse"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                          </svg>
                        ) : (
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
                            />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                  <div
                    className={`p-4 rounded-2xl leading-relaxed text-[14.5px] border ${
                      msg.isUser
                        ? "bg-[#20808D]/10 border-[#20808D]/20 text-slate-100"
                        : "bg-[#1c1e1f] border-[#2d3131]/60 text-slate-200 shadow-md"
                    }`}
                  >
                    {msg.isUser ? (
                      (() => {
                        const parsed = parseUserMessage(msg.text);
                        return (
                          <div className="flex flex-col gap-1.5">
                            {parsed.fileName && (
                              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#131415] border border-[#2d3131]/60 text-xs text-slate-300 w-max shrink-0 select-none">
                                <span>📄</span>
                                <span className="font-bold truncate max-w-[150px]">
                                  {parsed.fileName}
                                </span>
                                <span className="text-[10px] bg-[#2d3131]/40 px-1 py-0.2 rounded text-slate-500 font-mono">
                                  FILE
                                </span>
                              </div>
                            )}
                            <p>{parsed.query}</p>
                          </div>
                        );
                      })()
                    ) : (
                      <MarkdownRenderer text={msg.text} />
                    )}
                  </div>
                </div>
              ))}

              {isAiResponding && (
                <div className="flex flex-col gap-1 max-w-[85%] mr-auto items-start">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-1">
                    Perplexity AI
                  </div>
                  <div className="p-4 rounded-2xl leading-relaxed text-[14.5px] border bg-[#1c1e1f] border-[#2d3131]/60 text-slate-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#20808D] rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-[#20808D] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-[#20808D] rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="p-6 max-w-3xl mx-auto w-full shrink-0 bg-[#131415] z-10 border-t border-[#2d3131]/10">
          <form
            onSubmit={handleSend}
            className="w-full bg-[#1c1e1f] border border-[#2d3131] hover:border-[#3c4142] focus-within:border-[#20808D] focus-within:ring-1 focus-within:ring-[#20808D] rounded-2xl p-3 shadow-xl flex flex-col gap-2 transition"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            {attachedFile && (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-[#131415] border border-[#2d3131]/60 text-xs text-slate-300 mb-1 w-max animate-fade-in shrink-0 select-none">
                <span>📄</span>
                <span className="font-bold truncate max-w-[180px]">
                  {attachedFile.name}
                </span>
                <span className="text-[10px] text-slate-500">
                  ({(attachedFile.size / 1024).toFixed(1)} KB)
                </span>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="hover:text-red-400 font-bold transition cursor-pointer ml-1 text-[11px]"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="flex items-center gap-3 w-full">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a follow up..."
                className="flex-grow bg-transparent text-white outline-none placeholder-slate-500 text-[14.5px] py-1 px-1 font-sans"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="w-8 h-8 rounded-full bg-[#2d3131]/60 hover:bg-[#3c4142] text-slate-400 hover:text-white flex items-center justify-center transition duration-150 cursor-pointer shrink-0"
                title="Attach text or code file (< 2MB)"
              >
                <svg
                  className="w-4.5 h-4.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
              </button>

              {hasSupport && (
                <button
                  type="button"
                  onClick={handleMicToggle}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition duration-150 cursor-pointer shrink-0 ${
                    isListening
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-[#2d3131]/60 text-slate-400 hover:bg-[#3c4142] hover:text-white"
                  }`}
                  title={isListening ? "Stop listening" : "Start voice typing"}
                >
                  {isListening ? (
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zm0 18a7 7 0 0 1-7-7h2a5 5 0 0 0 10 0h2a7 7 0 0 1-7 7z" />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 18.5a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3m-3 0h6m-3-10.5a3 3 0 003-3V6a3 3 0 00-3-3 3 3 0 00-3 3v3.5a3 3 0 003 3z"
                      />
                    </svg>
                  )}
                </button>
              )}

              <button
                type="submit"
                disabled={!input.trim() && !attachedFile}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition duration-150 cursor-pointer shrink-0 ${
                  input.trim() || attachedFile
                    ? "bg-[#20808D] hover:bg-[#1a6872] text-white shadow-md shadow-[#20808D]/10 active:scale-95"
                    : "bg-[#2d3131]/60 text-slate-600 cursor-not-allowed"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"
                  />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) {
            deleteChat(deleteTargetId);
          }
        }}
        title="Delete Thread"
        message="Are you sure you want to delete this thread? This will permanently erase the chat history from your Library."
      />

      {isOrganizeOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#191a1a] border border-[#2d3131] rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#2d3131]/30 pb-3">
              <h3 className="text-base font-bold text-white">
                📁 Save to Folder
              </h3>
              <button
                type="button"
                onClick={() => setIsOrganizeOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Select a folder to save this conversation into:
              </p>
              {collections.length === 0 ? (
                <div className="text-center py-6 bg-[#131415] border border-dashed border-[#2d3131]/60 rounded-xl text-slate-500 text-xs">
                  No folders found. Please create a folder in the Library
                  section first!
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {collections.map((col) => {
                    const activeThreadId = chatId || activeId;
                    const alreadyIn = col.threads?.some(
                      (t) => t === activeThreadId || t._id === activeThreadId,
                    );
                    return (
                      <button
                        key={col._id}
                        onClick={() => {
                          if (!alreadyIn) {
                            handleAddThreadToFolder(col._id);
                          }
                        }}
                        disabled={alreadyIn}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs font-bold transition flex justify-between items-center ${
                          alreadyIn
                            ? "bg-[#1c1e1f] border-emerald-500/20 text-emerald-400 cursor-not-allowed opacity-80"
                            : "bg-[#1c1e1f] border-[#2d3131] text-slate-300 hover:border-[#20808D] hover:text-white cursor-pointer"
                        }`}
                      >
                        <span className="truncate">📁 {col.name}</span>
                        {alreadyIn && (
                          <span className="text-[9px] bg-emerald-500/10 px-2 py-0.5 rounded font-extrabold uppercase">
                            Saved
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#2d3131]/20">
              <button
                type="button"
                onClick={() => setIsOrganizeOpen(false)}
                className="bg-[#131415] hover:bg-[#202222] border border-[#2d3131] text-slate-300 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
