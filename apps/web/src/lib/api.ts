import axios from "axios";
import { useAuthStore } from "../store/auth";

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error?.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) throw new Error("No refresh token");
        const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken });
        const { accessToken } = data.data ?? data;
        useAuthStore.getState().setTokens({ accessToken, refreshToken });
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        useAuthStore.getState().clear();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);

export const unwrap = <T>(payload: unknown): T => {
  if (payload && typeof payload === "object" && "success" in payload && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

export default api;
