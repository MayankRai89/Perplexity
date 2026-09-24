import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export async function fetchThreads() {
  const response = await api.get("/api/chat/threads");
  return response.data;
}

export async function fetchThreadMessages(chatId) {
  const response = await api.get(`/api/chat/threads/${chatId}`);
  return response.data;
}

export async function deleteThread(chatId) {
  const response = await api.delete(`/api/chat/threads/${chatId}`);
  return response.data;
}
