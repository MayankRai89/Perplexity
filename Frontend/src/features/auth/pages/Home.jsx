import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../hook/useAuth";
import { useChat } from "../../chat/hooks/useChat";
import ConfirmModal from "../../chat/components/ConfirmModal";

const Home = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { user, handleLogout } = useAuth();
  const { threads, deleteChat } = useChat();
  const [focusMode, setFocusMode] = useState("All");
  const [isFocusOpen, setIsFocusOpen] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/chat?q=${encodeURIComponent(query)}&focus=${encodeURIComponent(focusMode)}&pro=${isPro}`);
  };

  const focusOptions = [
    { 
      name: "All", 
      desc: "Search across the entire internet", 
      icon: (
        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ) 
    },
    { 
      name: "Academic", 
      desc: "Search peer-reviewed papers", 
      icon: (
        <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ) 
    },
    { 
      name: "Writing", 
      desc: "Generate text or code without internet", 
      icon: (
        <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ) 
    },
    { 
      name: "YouTube", 
      desc: "Search and watch video transcripts", 
      icon: (
        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ) 
    },
    { 
      name: "Reddit", 
      desc: "Search community discussions", 
      icon: (
        <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ) 
    }
  ];

  return (
    <div className="min-h-screen w-full bg-[#131415] text-slate-200 flex font-sans antialiased selection:bg-[#20808D]/30 selection:text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-[#191a1a] border-r border-[#2d3131]/30 flex flex-col p-4 justify-between hidden md:flex shrink-0">
        <div className="flex flex-col gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-2">
            <svg className="w-6 h-6 text-[#20808D]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2V22M2 12H22M4.93 4.93L19.07 19.07M4.93 19.07L19.07 4.93" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <span className="text-xl font-bold tracking-tight text-white select-none">perplexity</span>
          </div>

          {/* New Thread */}
          <button 
            onClick={() => setQuery("")}
            className="flex items-center justify-between text-sm font-medium bg-[#131415] hover:bg-[#202222] border border-[#2d3131] text-slate-300 hover:text-white px-4 py-2.5 rounded-xl transition duration-150 shadow-inner group w-full cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span className="text-slate-400 group-hover:text-white transition">➕</span> New Thread
            </span>
            <span className="text-[10px] bg-[#2d3131] px-1.5 py-0.5 rounded text-slate-500 font-mono">Ctrl I</span>
          </button>

          {/* Nav links */}
          <nav className="flex flex-col gap-1">
            <Link to="/" className="flex items-center gap-3 text-sm font-semibold bg-[#20808D]/10 text-[#20808D] px-3.5 py-2.5 rounded-xl border border-[#20808D]/15 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </Link>
            <a href="#discover" className="flex items-center gap-3 text-sm font-semibold text-slate-400 hover:text-white hover:bg-[#202222]/60 px-3.5 py-2.5 rounded-xl transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Discover
            </a>
            <a href="#library" className="flex items-center gap-3 text-sm font-semibold text-slate-400 hover:text-white hover:bg-[#202222]/60 px-3.5 py-2.5 rounded-xl transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Library
            </a>
          </nav>

          {/* Library Threads History List */}
          {user && threads.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-2 border-t border-[#2d3131]/20 pt-4">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-3.5 mb-1">
                Recent Threads
              </div>
              <div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto px-1.5 no-scrollbar">
                {threads.map((thread) => (
                  <div key={thread._id} className="group flex items-center justify-between hover:bg-[#202222]/60 rounded-lg py-1.5 px-2 transition">
                    <Link
                      to={`/chat?id=${thread._id}`}
                      className="text-xs text-slate-400 group-hover:text-white truncate flex-grow text-left pr-2"
                    >
                      {thread.title}
                    </Link>
                    <button
                      onClick={() => setDeleteTargetId(thread._id)}
                      className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1 cursor-pointer shrink-0"
                      title="Delete Thread"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Section */}
        <div className="border-t border-[#2d3131]/30 pt-4 flex flex-col gap-3">
          {user ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 px-2 py-1.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#20808D] to-emerald-400 flex items-center justify-center font-bold text-white text-sm shadow-md">
                  {user.username ? user.username[0].toUpperCase() : "U"}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="text-xs font-bold text-white truncate">{user.username}</div>
                  <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full text-left text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 px-3.5 py-2 rounded-lg transition cursor-pointer"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link 
                to="/login"
                className="w-full text-center text-sm font-semibold bg-[#202222] border border-[#2d3131] hover:border-slate-600 text-slate-200 py-2.5 rounded-xl transition duration-150"
              >
                Sign In
              </Link>
              <Link 
                to="/register"
                className="w-full text-center text-sm font-semibold bg-[#20808D] hover:bg-[#1a6872] text-white py-2.5 rounded-xl transition duration-150 shadow-md shadow-[#20808D]/10"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#131415] relative">
        {/* Mobile Header */}
        <header className="w-full flex items-center justify-between px-6 py-4 border-b border-[#2d3131]/20 md:hidden bg-[#191a1a]">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#20808D]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2V22M2 12H22M4.93 4.93L19.07 19.07M4.93 19.07L19.07 4.93" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <span className="text-lg font-bold tracking-tight text-white select-none">perplexity</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <button 
                onClick={handleLogout}
                className="text-xs font-semibold text-slate-400 hover:text-white bg-[#202222] border border-[#2d3131] px-3 py-1.5 rounded-lg transition"
              >
                Log Out
              </button>
            ) : (
              <Link 
                to="/login"
                className="text-xs font-semibold bg-[#20808D] hover:bg-[#1a6872] text-white px-3 py-1.5 rounded-lg transition shadow-md shadow-[#20808D]/10"
              >
                Sign In
              </Link>
            )}
          </div>
        </header>

        {/* Main Search Panel */}
        <main className="flex-grow flex flex-col items-center justify-center px-4 md:px-8 max-w-2xl mx-auto w-full relative z-10 py-12">
          {/* Title */}
          <h1 className="text-3.5xl md:text-[42px] font-normal tracking-tight text-white mb-8 text-center select-none leading-tight font-serif">
            Where knowledge begins
          </h1>

          {/* Search Input Box */}
          <form 
            onSubmit={handleSearchSubmit} 
            className="w-full bg-[#1c1e1f] border border-[#2d3131] hover:border-[#3c4142] focus-within:border-[#20808D] focus-within:ring-1 focus-within:ring-[#20808D] rounded-2xl p-3 shadow-xl transition-all duration-200 relative"
          >
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything..."
              rows={2}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSearchSubmit(e);
                }
              }}
              className="w-full bg-transparent text-white outline-none placeholder-slate-500 text-[15px] resize-none px-2 py-1 leading-relaxed font-sans"
            />

            {/* Buttons Row */}
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#2d3131]/20">
              <div className="flex items-center gap-2 relative">
                {/* Focus Button */}
                <button
                  type="button"
                  onClick={() => setIsFocusOpen(!isFocusOpen)}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-[#131415]/60 hover:bg-[#202222] border border-[#2d3131]/60 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition duration-150 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 text-[#20808D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                  </svg>
                  <span>Focus:</span>
                  <span className="text-[#20808D] font-bold">{focusMode}</span>
                </button>

                {/* Focus Dropdown Menu */}
                {isFocusOpen && (
                  <>
                    <div className="fixed inset-0 z-25" onClick={() => setIsFocusOpen(false)} />
                    <div className="absolute bottom-10 left-0 w-64 bg-[#191a1a] border border-[#2d3131] rounded-xl shadow-2xl p-2 z-30 flex flex-col gap-0.5">
                      {focusOptions.map((opt) => (
                        <button
                          key={opt.name}
                          type="button"
                          onClick={() => {
                            setFocusMode(opt.name);
                            setIsFocusOpen(false);
                          }}
                          className={`w-full text-left p-2 rounded-lg transition duration-150 flex gap-2.5 items-start cursor-pointer ${
                            focusMode === opt.name 
                              ? "bg-[#20808D]/10 text-[#20808D]" 
                              : "hover:bg-[#202222] text-slate-400 hover:text-white"
                          }`}
                        >
                          <span className="mt-0.5">{opt.icon}</span>
                          <div>
                            <div className="text-xs font-bold text-white">{opt.name}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{opt.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Attach File Button */}
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-xs font-semibold bg-[#131415]/60 hover:bg-[#202222] border border-[#2d3131]/60 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition duration-150 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span>Attach</span>
                </button>
              </div>

              <div className="flex items-center gap-3.5">
                {/* Pro Toggle */}
                <div className="flex items-center gap-2 bg-[#131415]/60 border border-[#2d3131]/60 px-3 py-1.5 rounded-lg">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#20808D]">Pro</span>
                  <button
                    type="button"
                    onClick={() => setIsPro(!isPro)}
                    className={`w-7 h-4 rounded-full transition duration-200 relative focus:outline-none cursor-pointer ${
                      isPro ? "bg-[#20808D]" : "bg-[#2d3131]"
                    }`}
                  >
                    <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all duration-200 ${
                      isPro ? "left-3.5" : "left-0.5"
                    }`} />
                  </button>
                </div>

                {/* Submit Arrow Button */}
                <button
                  type="submit"
                  disabled={!query.trim()}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition duration-150 cursor-pointer ${
                    query.trim() 
                      ? "bg-[#20808D] hover:bg-[#1a6872] text-white shadow-md shadow-[#20808D]/10 active:scale-95" 
                      : "bg-[#2d3131]/60 text-slate-600 cursor-not-allowed"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                  </svg>
                </button>
              </div>
            </div>
          </form>

          {/* Suggestion Chips */}
          <div className="mt-8 flex flex-wrap gap-2 justify-center max-w-lg">
            {["AI search vs web search", "Standard deviation explained", "History of space travel"].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setQuery(suggestion)}
                className="text-xs font-semibold bg-[#1c1e1f] hover:bg-[#202222] border border-[#2d3131]/70 hover:border-slate-500 text-slate-300 hover:text-white px-3.5 py-1.5 rounded-xl transition duration-150 cursor-pointer"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full text-center py-6 text-[11px] text-slate-600 border-t border-[#2d3131]/10 mt-auto relative z-10">
          &copy; {new Date().getFullYear()} Perplexity Clone. Built with React & Tailwind.
        </footer>
      </div>

      {/* Confirm Delete Thread Modal */}
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
    </div>
  );
};

export default Home;
