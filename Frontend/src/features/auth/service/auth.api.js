import axios from "axios";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export async function register({ email, username, password }) {
  const response = await api.post("/api/auth/register", {
    email,
    username,
    password,
  });
  return response.data;
}

export async function login({ email, password }) {
  const response = await api.post("/api/auth/login", {
    email,
    password,
  });
  return response.data;
}

export async function getMyProfile() {
  const response = await api.get("/api/auth/get-me", {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.data;
}

export async function logout() {
  // If there's no backend logout endpoint, we just return success to clear state on client
  return { data: { success: true } };
}

