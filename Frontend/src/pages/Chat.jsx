import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../features/auth/hook/useAuth";

const Chat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const { user, handleLogout, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { text: input, isUser: true }]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { text: `I am a clone of Perplexity. You asked: "${input}". How else can I help you?`, isUser: false }
      ]);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#131415] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-[#20808D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm font-semibold">Loading session...</span>
        </div>
      </div>
    );
  }

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

          {/* New Thread Button */}
          <Link 
            to="/"
            className="flex items-center justify-between text-sm font-medium bg-[#131415] hover:bg-[#202222] border border-[#2d3131] text-slate-300 hover:text-white px-4 py-2.5 rounded-xl transition duration-150 shadow-inner group w-full"
          >
            <span className="flex items-center gap-2">
              <span className="text-slate-400 group-hover:text-white transition">➕</span> New Thread
            </span>
          </Link>

          {/* Nav links */}
          <nav className="flex flex-col gap-1">
            <Link to="/" className="flex items-center gap-3 text-sm font-semibold text-slate-400 hover:text-white hover:bg-[#202222]/60 px-3.5 py-2.5 rounded-xl transition">
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
        </div>

        {/* Profile Section */}
        <div className="border-t border-[#2d3131]/30 pt-4 flex flex-col gap-3">
          {user && (
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
          )}
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#131415]">
        {/* Top Header */}
        <header className="px-6 py-4 border-b border-[#2d3131]/20 flex justify-between items-center bg-[#191a1a]/40 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <Link to="/" className="md:hidden text-slate-400 hover:text-white mr-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h2 className="text-sm font-semibold text-slate-300">Thread Session</h2>
          </div>
          <Link to="/" className="text-xs text-[#20808D] hover:text-[#3ab2bf] font-bold transition">Back to Home</Link>
        </header>

        {/* Chat Area */}
        <div className="flex-grow p-6 overflow-y-auto space-y-5 max-w-3xl mx-auto w-full">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 py-16">
              <svg className="w-12 h-12 text-[#20808D]/30 mb-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2V22M2 12H22M4.93 4.93L19.07 19.07M4.93 19.07L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <p className="text-sm text-slate-400">Ask any question to begin the conversation thread.</p>
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
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-1">
                    {msg.isUser ? "You" : "Perplexity AI"}
                  </div>
                  <div
                    className={`p-4 rounded-2xl leading-relaxed text-[14.5px] border ${
                      msg.isUser
                        ? "bg-[#20808D]/10 border-[#20808D]/20 text-slate-100"
                        : "bg-[#1c1e1f] border-[#2d3131]/60 text-slate-200 shadow-md"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-6 max-w-3xl mx-auto w-full sticky bottom-0 bg-[#131415]/85 backdrop-blur-sm z-10">
          <form
            onSubmit={handleSend}
            className="w-full bg-[#1c1e1f] border border-[#2d3131] hover:border-[#3c4142] focus-within:border-[#20808D] focus-within:ring-1 focus-within:ring-[#20808D] rounded-2xl p-3 shadow-xl flex items-center gap-3 transition"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a follow up..."
              className="flex-grow bg-transparent text-white outline-none placeholder-slate-500 text-[14.5px] py-1 px-1 font-sans"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition duration-150 cursor-pointer ${
                input.trim()
                  ? "bg-[#20808D] hover:bg-[#1a6872] text-white shadow-md shadow-[#20808D]/10 active:scale-95"
                  : "bg-[#2d3131]/60 text-slate-600 cursor-not-allowed"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
