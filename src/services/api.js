import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// ── Helper: logout and redirect ───────────────────────────
function logout() {
  localStorage.removeItem("token");
  window.location.href = "/";
}

// ── Passive session check ─────────────────────────────────
// Runs every 60 seconds in the background
// Logs out automatically when the 24hr token expires
function startSessionWatcher() {
  setInterval(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      if (isExpired) logout();
    } catch {
      logout();
    }
  }, 60 * 1000); // check every 60 seconds
}

startSessionWatcher();

// ── Request interceptor — attach token only ───────────────
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor — handle 401 from server ────────
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      logout();
    }
    return Promise.reject(error);
  }
);

export default API;