import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",
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
