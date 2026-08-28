import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "../lib/api";

interface AdminAuthState {
  accessToken: string | null;
  username: string | null;
  setTokens: (t: { accessToken: string; username?: string }) => void;
  clear: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      username: null,
      setTokens: ({ accessToken, username }) => set({ accessToken, username: username ?? null }),
      clear: () => set({ accessToken: null, username: null }),
    }),
    { name: "vibely-admin-auth" },
  ),
);

export async function adminLogin(username: string, password: string) {
  await api.post("/auth/login", { identifier: username, password });
  useAdminAuthStore.getState().setTokens({ accessToken: "placeholder", username });
}
