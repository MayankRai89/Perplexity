import React from "react";
import { useSelector } from "react-redux";
import { useChat } from "../hooks/useChat.js";

export default function Dashboard() {
  const { isConnected } = useChat();
  const user = useSelector((state) => state.auth.user);
  console.log(user);
  return (
    <div className="p-6 bg-[#131415] text-white min-h-screen">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2 text-slate-400">Welcome, {user?.username}!</p>
      <p className="mt-1 text-slate-500">
        Connection status:{" "}
        <span className={isConnected ? "text-emerald-400" : "text-red-400"}>
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </p>
    </div>
  );
}
