import axios from "axios";
import { useAdminAuthStore } from "../store/auth";

export const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = useAdminAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
