import axios from "axios";
const api = axios.create({
  baseURL: "http://localhost:3000",
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

