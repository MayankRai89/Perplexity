import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { useAuth } from "../features/auth/hook/useAuth";
import axios from "axios";
import ReactMarkdown from "react-markdown";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

const SpaceChat = () => {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [space, setSpace] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sources, setSources] = useState([]);
  const [showSources, setShowSources] = useState(false);
  const [spaceLoading, setSpaceLoading] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && spaceId) {
      fetchSpace();
    }
  }, [user, spaceId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchSpace = async () => {
    try {
      const res = await api.get(`/api/spaces/${spaceId}`);
      if (res.data.success) setSpace(res.data.space);
    } catch (err) {
      console.error("Failed to load space", err);
    } finally {
      setSpaceLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);
    setSources([]);

    // Optimistically add user message
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, id: Date.now() },
    ]);

    try {
      const res = await api.post(`/api/spaces/${spaceId}/chat`, {
        content: userMessage,
        chatId,
      });

      if (res.data.success) {
        if (res.data.isNewChat) setChatId(res.data.chatId);
        setMessages((prev) => [...prev, res.data.message]);
        setSources(res.data.sources || []);
        if (res.data.sources?.length > 0) setShowSources(true);
      }
    } catch (err) {
      console.error("RAG chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "⚠️ An error occurred. Please try again.",
          id: Date.now() + 1,
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  if (loading || spaceLoading) {
    return (
      <div className="min-h-screen w-full bg-[#131415] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#20808D] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-400 font-semibold">Loading space...</span>
        </div>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="min-h-screen w-full bg-[#131415] flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400">Space not found.</p>
          <Link to="/library" className="text-[#20808D] text-sm mt-2 block hover:underline">
            ← Back to Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#131415] text-slate-200 flex font-sans antialiased overflow-hidden">
      {/* Left sidebar */}
      <aside className="w-64 bg-[#191a1a] border-r border-[#2d3131]/30 flex flex-col p-4 hidden md:flex shrink-0">
        <div className="flex items-center gap-2.5 px-2 mb-6">
          <svg className="w-6 h-6 text-[#20808D]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2V22M2 12H22M4.93 4.93L19.07 19.07M4.93 19.07L19.07 4.93" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span className="text-xl font-bold tracking-tight text-white select-none">perplexity</span>
        </div>

        {/* Space info */}
        <div className="bg-[#20808D]/10 border border-[#20808D]/20 rounded-xl p-3 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🚀</span>
            <span className="text-sm font-bold text-white truncate">{space.name}</span>
          </div>
          {space.description && (
            <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{space.description}</p>
          )}
          <div className="mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            {space.documents?.length || 0} document{space.documents?.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Documents list */}
        {space.documents?.length > 0 && (
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-1 mb-2">
              Documents
            </div>
            <div className="flex flex-col gap-1 overflow-y-auto no-scrollbar">
              {space.documents.map((doc) => (
                <div key={doc._id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[#1c1e1f] border border-[#2d3131]/30">
                  <span className="text-xs">📄</span>
                  <span className="text-[11px] text-slate-400 truncate">{doc.originalName || doc.filename}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-[#2d3131]/30">
          <Link
            to="/library"
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white font-semibold transition py-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Library
          </Link>
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="px-6 py-4 border-b border-[#2d3131]/20 bg-[#191a1a]/40 backdrop-blur-md shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/library" className="md:hidden text-slate-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-sm font-bold text-white">🚀 {space.name}</h1>
              <p className="text-[10px] text-slate-500">RAG-powered chat · {space.documents?.length || 0} docs indexed</p>
            </div>
          </div>
          {sources.length > 0 && (
            <button
              onClick={() => setShowSources((s) => !s)}
              className="text-xs text-[#20808D] hover:text-[#3ab2bf] font-bold border border-[#20808D]/30 px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              {showSources ? "Hide" : "Show"} Sources ({sources.length})
            </button>
          )}
        </header>

        <div className="flex-1 flex min-h-0">
          {/* Messages */}
          <div className={`flex-1 flex flex-col min-w-0 ${showSources ? "border-r border-[#2d3131]/20" : ""}`}>
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 no-scrollbar">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                  <span className="text-4xl mb-4">🚀</span>
                  <h2 className="text-lg font-bold text-white mb-2">Chat with {space.name}</h2>
                  <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                    Ask anything about your uploaded documents. The AI will search through them and answer with cited sources.
                  </p>
                  {space.documents?.length === 0 && (
                    <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-xs text-amber-400">
                      ⚠️ No documents uploaded yet.{" "}
                      <Link to="/library" className="underline">Upload some from the Library</Link>.
                    </div>
                  )}
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={msg.id || i}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "ai" && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#20808D] to-emerald-400 flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                      <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2V22M2 12H22M4.93 4.93L19.07 19.07M4.93 19.07L19.07 4.93" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[#20808D]/20 border border-[#20808D]/20 text-white rounded-br-sm"
                        : "bg-[#191a1a] border border-[#2d3131]/40 text-slate-200 rounded-bl-sm"
                    }`}
                  >
                    {msg.role === "ai" ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                  {msg.role === "user" && user && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#20808D] to-emerald-400 flex items-center justify-center shrink-0 mt-0.5 shadow-md font-bold text-xs text-white">
                      {user.username?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#20808D] to-emerald-400 flex items-center justify-center shrink-0 shadow-md">
                    <svg className="w-3.5 h-3.5 text-white animate-pulse" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2V22M2 12H22M4.93 4.93L19.07 19.07M4.93 19.07L19.07 4.93" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="bg-[#191a1a] border border-[#2d3131]/40 rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#20808D] text-xs font-semibold">Searching documents</span>
                      <span className="flex gap-0.5">
                        <span className="w-1 h-1 bg-[#20808D] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1 h-1 bg-[#20808D] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1 h-1 bg-[#20808D] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 pb-6 shrink-0">
              <form onSubmit={handleSend} className="bg-[#191a1a] border border-[#2d3131]/50 rounded-2xl overflow-hidden shadow-xl">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Ask about your documents in "${space.name}"...`}
                  rows={1}
                  className="w-full bg-transparent text-sm text-white placeholder-slate-500 px-4 pt-3.5 pb-2 outline-none resize-none leading-relaxed"
                  style={{ minHeight: "48px", maxHeight: "160px" }}
                />
                <div className="flex justify-between items-center px-3 pb-2.5">
                  <span className="text-[10px] text-slate-600">Press Enter to send · Shift+Enter for new line</span>
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="bg-[#20808D] hover:bg-[#1a6872] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-4 py-1.5 text-xs font-semibold transition shadow-md shadow-[#20808D]/20 cursor-pointer"
                  >
                    {isLoading ? "Thinking..." : "Ask →"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sources panel */}
          {showSources && sources.length > 0 && (
            <div className="w-72 shrink-0 flex flex-col bg-[#191a1a]/50 overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2d3131]/20 flex justify-between items-center">
                <span className="text-xs font-bold text-[#20808D] uppercase tracking-wider">Sources</span>
                <button
                  onClick={() => setShowSources(false)}
                  className="text-slate-500 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar">
                {sources.map((src, i) => (
                  <div key={i} className="bg-[#1c1e1f] border border-[#2d3131]/40 rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px]">📄</span>
                        <span className="text-[11px] font-bold text-slate-300 truncate">{src.filename}</span>
                      </div>
                      <span className="text-[9px] bg-[#20808D]/20 text-[#20808D] px-1.5 py-0.5 rounded font-bold shrink-0">
                        {Math.round(src.score * 100)}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-4">{src.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpaceChat;
