import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../features/auth/hook/useAuth";
import { useChat } from "../features/chat/hooks/useChat.js";
import ConfirmModal from "../features/chat/components/ConfirmModal";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

const Discover = () => {
  const navigate = useNavigate();
  const { user, handleLogout, loading } = useAuth();
  const { threads, deleteChat } = useChat();
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const [prompt, setPrompt] = useState("");
  const [imageCount, setImageCount] = useState(4);
  const [aspectRatio, setAspectRatio] = useState("1:1");

  const [generating, setGenerating] = useState(false);
  const [newPost, setNewPost] = useState(null);
  const [feed, setFeed] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  const loadFeed = async () => {
    try {
      const res = await api.get("/api/discover");
      if (res.data.success) {
        setFeed(res.data.feed);
      }
    } catch (err) {
      console.error("Failed to load discover feed", err);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    } else if (user) {
      loadFeed();
    }
  }, [user, loading, navigate]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || generating) return;

    setGenerating(true);
    setErrorMsg("");
    setNewPost(null);

    try {
      const res = await api.post("/api/discover/generate", {
        prompt: prompt.trim(),
        count: imageCount,
        aspectRatio: aspectRatio,
      });

      if (res.data.success) {
        setNewPost(res.data.post);
        // Add to local feed
        setFeed((prev) => [res.data.post, ...prev]);
        setPrompt(""); // Clear input on success
      }
    } catch (err) {
      console.error("Error generating images", err);
      setErrorMsg(
        err.response?.data?.message ||
          "Failed to generate images. Please try again.",
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (base64String, idx, promptText) => {
    const cleanPrompt = promptText
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()
      .substring(0, 30);
    const link = document.createElement("a");
    link.href = base64String;
    link.download = `imagen-${cleanPrompt}-${idx + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      {/* Sidebar */}
      <aside className="w-64 bg-[#191a1a] border-r border-[#2d3131]/30 flex flex-col p-4 justify-between hidden md:flex shrink-0 h-full overflow-hidden">
        <div className="flex flex-col gap-6 flex-1 min-h-0">
          {/* Logo */}
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

          {/* New Thread Button */}
          <Link
            to="/"
            className="flex items-center justify-between text-sm font-medium bg-[#131415] hover:bg-[#202222] border border-[#2d3131] text-slate-300 hover:text-white px-4 py-2.5 rounded-xl transition duration-150 shadow-inner group w-full shrink-0"
          >
            <span className="flex items-center gap-2">
              <span className="text-slate-400 group-hover:text-white transition">
                ➕
              </span>{" "}
              New Thread
            </span>
          </Link>

          {/* Nav links */}
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
              className="flex items-center gap-3 text-sm font-semibold bg-[#20808D]/10 text-[#20808D] px-3.5 py-2.5 rounded-xl border border-[#20808D]/15 transition"
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
                    className="group flex items-center justify-between hover:bg-[#202222]/60 rounded-lg py-1.5 px-2 transition shrink-0"
                  >
                    <Link
                      to={`/chat?id=${thread._id}`}
                      className="text-xs truncate flex-grow text-left pr-2 text-slate-400 group-hover:text-white"
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
              Discover - Imagen 4 Playground
            </h2>
          </div>
          <Link
            to="/"
            className="text-xs text-[#20808D] hover:text-[#3ab2bf] font-bold transition"
          >
            Back to Home
          </Link>
        </header>

        <div className="flex-grow p-6 overflow-y-auto space-y-12 no-scrollbar">
          {/* Playground Panel */}
          <section className="max-w-4xl mx-auto bg-[#191a1a]/40 border border-[#2d3131]/40 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                🎨 Image Generation
                <span className="text-[10px] bg-[#20808D]/20 text-[#20808D] px-2 py-0.5 rounded font-mono font-bold tracking-wider">
                  IMAGEN 4.0
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Enter a description to generate photorealistic or artistic
                images using Google's latest image model.
              </p>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A futuristic library floating in space, high fantasy art, volumetric lighting, photorealistic..."
                  rows={3}
                  className="w-full bg-[#1c1e1f] border border-[#2d3131] hover:border-[#3c4142] focus:border-[#20808D] focus:ring-1 focus:ring-[#20808D] rounded-xl p-3 text-white placeholder-slate-500 text-sm outline-none resize-none leading-relaxed transition font-sans"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Aspect Ratio
                  </label>
                  <div className="flex gap-2">
                    {[
                      { value: "1:1", label: "1:1", desc: "Square", icon: "▢" },
                      {
                        value: "16:9",
                        label: "16:9",
                        desc: "Landscape",
                        icon: "▭",
                      },
                      {
                        value: "9:16",
                        label: "9:16",
                        desc: "Portrait",
                        icon: "▯",
                      },
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setAspectRatio(item.value)}
                        className={`flex-1 py-2 px-3 border rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer transition ${
                          aspectRatio === item.value
                            ? "bg-[#20808D]/10 border-[#20808D] text-white"
                            : "bg-[#1c1e1f] border-[#2d3131] text-slate-400 hover:border-slate-500"
                        }`}
                      >
                        <span className="text-base font-bold leading-none">
                          {item.icon}
                        </span>
                        <span className="text-[10px] font-bold">
                          {item.label}
                        </span>
                        <span className="text-[9px] text-slate-500 leading-none">
                          {item.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Number of Images
                  </label>
                  <div className="flex gap-2 h-[58px] items-center">
                    {[1, 2, 3, 4].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setImageCount(count)}
                        className={`flex-1 h-10 border rounded-xl font-bold flex items-center justify-center cursor-pointer transition ${
                          imageCount === count
                            ? "bg-[#20808D]/10 border-[#20808D] text-white"
                            : "bg-[#1c1e1f] border-[#2d3131] text-slate-400 hover:border-slate-500"
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl">
                  ⚠️ {errorMsg}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={generating || !prompt.trim()}
                  className={`px-6 py-3 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-[#20808D]/10 transition-all ${
                    generating || !prompt.trim()
                      ? "bg-[#2d3131] text-slate-500 cursor-not-allowed"
                      : "bg-[#20808D] hover:bg-[#1a6872] text-white cursor-pointer active:scale-95"
                  }`}
                >
                  {generating ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-white"
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
                      <span>Generating with Imagen 4...</span>
                    </>
                  ) : (
                    <>
                      <span>✨ Generate Images</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {newPost && (
              <div className="border-t border-[#2d3131]/30 pt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#20808D]">
                    Your Generated Result
                  </h4>
                  <span className="text-[10px] text-slate-500">
                    Aspect Ratio: {newPost.aspectRatio}
                  </span>
                </div>
                <div
                  className={`grid gap-4 ${
                    newPost.images.length === 1
                      ? "grid-cols-1"
                      : newPost.images.length === 2
                        ? "grid-cols-2"
                        : "grid-cols-2 sm:grid-cols-4"
                  }`}
                >
                  {newPost.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="group relative rounded-xl border border-[#2d3131] overflow-hidden bg-[#1c1e1f] aspect-square"
                    >
                      <img
                        src={img}
                        alt={newPost.prompt}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition duration-300"
                        onClick={() =>
                          setSelectedImage({ img, prompt: newPost.prompt, idx })
                        }
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                        <button
                          onClick={() =>
                            setSelectedImage({
                              img,
                              prompt: newPost.prompt,
                              idx,
                            })
                          }
                          className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#20808D] text-white flex items-center justify-center transition cursor-pointer"
                          title="Zoom In"
                        >
                          🔍
                        </button>
                        <button
                          onClick={() =>
                            handleDownload(img, idx, newPost.prompt)
                          }
                          className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#20808D] text-white flex items-center justify-center transition cursor-pointer"
                          title="Download"
                        >
                          ⬇️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="max-w-4xl mx-auto space-y-6">
            <div className="border-b border-[#2d3131]/30 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">
                  ✨ Discover Feed
                </h3>
                <p className="text-xs text-slate-400">
                  Explore and search community generations from other creators.
                </p>
              </div>
              <button
                onClick={loadFeed}
                className="text-xs text-slate-400 hover:text-white bg-[#191a1a] border border-[#2d3131]/60 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                🔄 Refresh Feed
              </button>
            </div>

            {feed.length === 0 ? (
              <div className="text-center py-12 bg-[#191a1a]/10 border border-dashed border-[#2d3131]/40 rounded-2xl text-slate-500">
                <span className="text-2xl block mb-2">🔭</span>
                <p className="text-sm">
                  No community image generations found. Be the first to
                  generate!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {feed.map((post) => (
                  <div
                    key={post._id}
                    className="bg-[#191a1a]/50 border border-[#2d3131]/50 rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:border-[#20808D]/40 transition duration-150 shadow-md"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <p
                          className="text-xs font-bold text-slate-300 line-clamp-2 leading-relaxed"
                          title={post.prompt}
                        >
                          "{post.prompt}"
                        </p>
                      </div>

                      <div
                        className={`grid gap-2 overflow-hidden rounded-xl ${
                          post.images.length === 1
                            ? "grid-cols-1"
                            : post.images.length === 2
                              ? "grid-cols-2"
                              : "grid-cols-2 sm:grid-cols-4"
                        }`}
                      >
                        {post.images.map((img, idx) => (
                          <div
                            key={idx}
                            className="group relative bg-[#131415] aspect-square overflow-hidden rounded-lg"
                          >
                            <img
                              src={img}
                              alt={post.prompt}
                              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition duration-300"
                              onClick={() =>
                                setSelectedImage({
                                  img,
                                  prompt: post.prompt,
                                  idx,
                                })
                              }
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                              <button
                                onClick={() =>
                                  setSelectedImage({
                                    img,
                                    prompt: post.prompt,
                                    idx,
                                  })
                                }
                                className="w-6.5 h-6.5 text-[10px] rounded-full bg-white/10 hover:bg-[#20808D] text-white flex items-center justify-center transition cursor-pointer"
                                title="Zoom"
                              >
                                🔍
                              </button>
                              <button
                                onClick={() =>
                                  handleDownload(img, idx, post.prompt)
                                }
                                className="w-6.5 h-6.5 text-[10px] rounded-full bg-white/10 hover:bg-[#20808D] text-white flex items-center justify-center transition cursor-pointer"
                                title="Download"
                              >
                                ⬇️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-[#2d3131]/20">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                          {post.user?.Username ? post.user.Username[0] : "U"}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          By {post.user?.Username || "Anonymous User"}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-500">
                        {new Date(post.createdAt).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="max-w-4xl w-full flex flex-col md:flex-row bg-[#191a1a] border border-[#2d3131] rounded-2xl overflow-hidden shadow-2xl animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="md:w-2/3 bg-black flex items-center justify-center relative aspect-video md:aspect-auto">
              <img
                src={selectedImage.img}
                alt={selectedImage.prompt}
                className="max-h-[80vh] md:max-h-[85vh] object-contain w-full h-full"
              />
            </div>
            <div className="md:w-1/3 p-6 flex flex-col justify-between bg-[#191a1a] border-t md:border-t-0 md:border-l border-[#2d3131]">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#20808D]">
                    Image Details
                  </span>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Prompt
                  </h4>
                  <p className="text-sm text-white leading-relaxed italic font-serif">
                    "{selectedImage.prompt}"
                  </p>
                </div>
              </div>
              <div className="pt-6 border-t border-[#2d3131]/60 flex flex-col gap-2">
                <button
                  onClick={() =>
                    handleDownload(
                      selectedImage.img,
                      selectedImage.idx,
                      selectedImage.prompt,
                    )
                  }
                  className="w-full bg-[#20808D] hover:bg-[#1a6872] text-white py-2.5 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-[#20808D]/10 cursor-pointer"
                >
                  <span>⬇️ Download Image</span>
                </button>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="w-full bg-[#131415] hover:bg-[#202222] border border-[#2d3131] text-slate-300 hover:text-white py-2.5 rounded-xl font-semibold text-xs transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default Discover;
