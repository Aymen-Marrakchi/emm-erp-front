import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// In-memory token store — set by AuthContext after login
let _token: string | null = null;

export const setAuthToken = (token: string | null) => {
  _token = token;
  if (token) sessionStorage.setItem("_t", token);
  else sessionStorage.removeItem("_t");
};

const getStoredToken = (): string | null => {
  // Prefer in-memory, fall back to sessionStorage (survives F5 refresh)
  return _token || sessionStorage.getItem("_t");
};

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On an authenticated 401 (expired / invalid token), clear the session and send
// the user back to login. The login request itself is excluded so the login page
// can still display "invalid credentials" on a wrong password.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url || "";
    const isLoginCall = url.includes("/auth/login");
    if (status === 401 && !isLoginCall && typeof window !== "undefined") {
      setAuthToken(null);
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;