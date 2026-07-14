import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../features/auth/hook/useAuth";
import { useChat } from "../features/chat/hooks/useChat.js";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
});

const Library = () => {
  const navigate = useNavigate();
  const { user, handleLogout, loading } = useAuth();
  const { threads } = useChat();

  const [collections, setCollections] = useState([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [newColDesc, setNewColDesc] = useState("");
  const [selectedCollection, setSelectedCollection] = useState(null);

  const [renameColItem, setRenameColItem] = useState(null);
  const [newColTitle, setNewColTitle] = useState("");
  const [newColDetailDesc, setNewColDetailDesc] = useState("");
  const loadCollections = async () => {
    try {
      const res = await api.get("/api/collections");
      if (res.data.success) {
        setCollections(res.data.collections);

        if (selectedCollection) {
          const synced = res.data.collections.find(
            (c) => c._id === selectedCollection._id,
          );
          setSelectedCollection(synced || null);
        }
      }
    } catch (err) {
      console.error("Failed to load collections", err);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    } else if (user) {
      loadCollections();
    }
  }, [user, loading, navigate]);

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!newColName.trim()) return;

    try {
      const res = await api.post("/api/collections", {
        name: newColName.trim(),
        description: newColDesc.trim(),
      });
      if (res.data.success) {
        setCollections((prev) => [res.data.collection, ...prev]);
        setNewColName("");
        setNewColDesc("");
        setIsCreateOpen(false);
      }
    } catch (err) {
      console.error("Failed to create collection", err);
      alert("Failed to create collection.");
    }
  };

  const handleDeleteCollection = async (colId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this folder? The threads inside will NOT be deleted.",
      )
    )
      return;

    try {
      const res = await api.delete(`/api/collections/${colId}`);
      if (res.data.success) {
        setCollections((prev) => prev.filter((c) => c._id !== colId));
        setSelectedCollection(null);
      }
    } catch (err) {
      console.error("Failed to delete collection", err);
    }
  };

  const handleRenameCollectionSubmit = async (e) => {
    e.preventDefault();
    if (!newColTitle.trim() || !renameColItem) return;

    try {
      const res = await api.put(`/api/collections/${renameColItem._id}`, {
        name: newColTitle.trim(),
        description: newColDetailDesc.trim(),
      });
      if (res.data.success) {
        setCollections((prev) =>
          prev.map((c) =>
            c._id === renameColItem._id ? res.data.collection : c,
          ),
        );
        setSelectedCollection(res.data.collection);
      }
    } catch (err) {
      console.error("Failed to rename collection", err);
    } finally {
      setRenameColItem(null);
    }
  };

  const handleRemoveThreadFromCollection = async (colId, threadId) => {
    try {
      const res = await api.post(`/api/collections/${colId}/threads`, {
        threadId,
        action: "remove",
      });
      if (res.data.success) {
        loadCollections();
      }
    } catch (err) {
      console.error("Failed to remove thread", err);
    }
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
          <span className="text-sm font-semibold">Loading library...</span>
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
              New Thread
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
              {selectedCollection
                ? `Folder: ${selectedCollection.name}`
                : "Library"}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {selectedCollection && (
              <button
                onClick={() => setSelectedCollection(null)}
                className="text-xs text-slate-400 hover:text-white font-bold transition cursor-pointer"
              >
                ← Back to Library
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

        <div className="flex-grow p-6 overflow-y-auto space-y-6 no-scrollbar">
          {!selectedCollection ? (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#2d3131]/30 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    📁 Curated Folders
                  </h3>
                  <p className="text-xs text-slate-400">
                    Organize your important chat sessions into folders for
                    future reference.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="bg-[#20808D] hover:bg-[#1a6872] text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md shadow-[#20808D]/10 transition cursor-pointer"
                >
                  📁 Create New Folder
                </button>
              </div>

              <div>
                {collections.length === 0 ? (
                  <div className="text-center py-16 bg-[#191a1a]/10 border border-dashed border-[#2d3131]/40 rounded-2xl text-slate-500">
                    <span className="text-3xl block mb-2 font-serif">📁</span>
                    <p className="text-sm font-semibold">
                      Your Library is empty.
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Create a folder here, then save important chats to it
                      directly from the chat page.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {collections.map((col) => (
                      <div
                        key={col._id}
                        onClick={() => setSelectedCollection(col)}
                        className="bg-[#191a1a]/40 border border-[#2d3131]/40 hover:border-[#20808D]/40 p-5 rounded-2xl shadow-md transition cursor-pointer flex flex-col justify-between h-44 group animate-fade-in"
                      >
                        <div className="space-y-1.5">
                          <span className="text-2xl">📁</span>
                          <h4 className="font-bold text-white group-hover:text-[#20808D] transition text-[15px] line-clamp-1">
                            {col.name}
                          </h4>
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {col.description || "No description provided."}
                          </p>
                        </div>
                        <div className="flex justify-between items-center border-t border-[#2d3131]/10 pt-3 mt-3">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            {col.threads?.length || 0} Saved Chats
                          </span>
                          <span className="text-xs text-[#20808D] opacity-0 group-hover:opacity-100 transition">
                            Open →
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-[#191a1a]/40 border border-[#2d3131]/40 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📁</span>
                    <h3 className="text-lg font-bold text-white">
                      {selectedCollection.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {selectedCollection.description ||
                      "No description provided."}
                  </p>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block pt-1">
                    Created on{" "}
                    {new Date(
                      selectedCollection.createdAt,
                    ).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setRenameColItem(selectedCollection);
                      setNewColTitle(selectedCollection.name);
                      setNewColDetailDesc(selectedCollection.description || "");
                    }}
                    className="text-slate-400 hover:text-white text-xs font-semibold bg-[#1c1e1f] border border-[#2d3131]/60 px-3.5 py-2 rounded-xl transition cursor-pointer"
                  >
                    ✏️ Edit Folder
                  </button>
                  <button
                    onClick={() =>
                      handleDeleteCollection(selectedCollection._id)
                    }
                    className="text-red-400 hover:bg-red-500/10 hover:border-red-500/20 text-xs font-semibold bg-[#1c1e1f] border border-transparent px-3.5 py-2 rounded-xl transition cursor-pointer"
                  >
                    🗑️ Delete Folder
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#20808D]">
                  Threads inside folder
                </h4>
                {!selectedCollection.threads ||
                selectedCollection.threads.length === 0 ? (
                  <div className="text-center py-12 bg-[#191a1a]/10 border border-dashed border-[#2d3131]/40 rounded-2xl text-slate-500">
                    <span className="text-2xl block mb-2">🔭</span>
                    <p className="text-sm">
                      No threads organized in this folder yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedCollection.threads.map((thread) => (
                      <div
                        key={thread._id}
                        className="bg-[#191a1a]/40 border border-[#2d3131]/40 hover:border-[#20808D]/40 p-4 rounded-xl shadow-md transition flex flex-col justify-between h-40"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-3">
                            <Link
                              to={`/chat?id=${thread._id}`}
                              className="font-bold text-white hover:text-[#20808D] text-[14.5px] line-clamp-1 transition"
                            >
                              {thread.title}
                            </Link>
                          </div>
                          <span className="text-[10px] text-slate-500 block mt-1">
                            Last updated:{" "}
                            {new Date(thread.updatedAt).toLocaleDateString(
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

                        <div className="flex justify-end items-center border-t border-[#2d3131]/20 pt-3 mt-4">
                          <button
                            onClick={() =>
                              handleRemoveThreadFromCollection(
                                selectedCollection._id,
                                thread._id,
                              )
                            }
                            className="text-red-400 hover:text-red-300 text-[11px] font-semibold bg-[#1c1e1f] border border-[#2d3131]/60 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                          >
                            Remove from folder
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateCollection}
            className="bg-[#191a1a] border border-[#2d3131] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center border-b border-[#2d3131]/30 pb-3">
              <h3 className="text-base font-bold text-white">
                📁 Create Folder
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="e.g. Science Project"
                  className="w-full bg-[#1c1e1f] border border-[#2d3131] focus:border-[#20808D] outline-none text-xs text-white p-2.5 rounded-xl transition"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  value={newColDesc}
                  onChange={(e) => setNewColDesc(e.target.value)}
                  placeholder="e.g. Research threads for chemistry project..."
                  rows={3}
                  className="w-full bg-[#1c1e1f] border border-[#2d3131] focus:border-[#20808D] outline-none text-xs text-white p-2.5 rounded-xl transition resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#2d3131]/20">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="bg-[#131415] hover:bg-[#202222] border border-[#2d3131] text-slate-300 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#20808D] hover:bg-[#1a6872] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md shadow-[#20808D]/10 cursor-pointer"
              >
                Create Folder
              </button>
            </div>
          </form>
        </div>
      )}

      {renameColItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleRenameCollectionSubmit}
            className="bg-[#191a1a] border border-[#2d3131] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center border-b border-[#2d3131]/30 pb-3">
              <h3 className="text-base font-bold text-white">
                ✏️ Edit Folder Details
              </h3>
              <button
                type="button"
                onClick={() => setRenameColItem(null)}
                className="text-slate-400 hover:text-white cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={newColTitle}
                  onChange={(e) => setNewColTitle(e.target.value)}
                  className="w-full bg-[#1c1e1f] border border-[#2d3131] focus:border-[#20808D] outline-none text-xs text-white p-2.5 rounded-xl transition"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  value={newColDetailDesc}
                  onChange={(e) => setNewColDetailDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-[#1c1e1f] border border-[#2d3131] focus:border-[#20808D] outline-none text-xs text-white p-2.5 rounded-xl transition resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#2d3131]/20">
              <button
                type="button"
                onClick={() => setRenameColItem(null)}
                className="bg-[#131415] hover:bg-[#202222] border border-[#2d3131] text-slate-300 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#20808D] hover:bg-[#1a6872] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md shadow-[#20808D]/10 cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Library;
