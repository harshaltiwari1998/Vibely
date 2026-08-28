import { create } from "zustand";
import { persist } from "zustand/middleware";
import api, { unwrap } from "../lib/api";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  username: string | null;
  setTokens: (tokens: { accessToken: string; refreshToken: string; userId?: string; username?: string }) => void;
  clear: () => void;
  isAuthenticated: () => boolean;
  fetchMe: () => Promise<void>;
  updateProfile: (data: { bio?: string; interests?: string[] }) => Promise<void>;
  updatePreferences: (data: { preferredGender?: string; preferredAgeMin?: number; preferredAgeMax?: number; preferredCountries?: string[]; preferredLanguages?: string[] }) => Promise<void>;
  updateAvatar: (avatarUrl: string) => Promise<void>;
  favorite: (userId: string) => Promise<void>;
  unfavorite: (userId: string) => Promise<void>;
  fetchFavorites: () => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      userId: null,
      username: null,
      setTokens: ({ accessToken, refreshToken, userId, username }) =>
        set({ accessToken, refreshToken, userId: userId ?? null, username: username ?? null }),
      clear: () => set({ accessToken: null, refreshToken: null, userId: null, username: null }),
      isAuthenticated: () => Boolean(get().accessToken),

      fetchMe: async () => {
        try {
          const { data } = await api.get("/users/me");
          const user = unwrap<{ id: string; username: string }>(data);
          set({ userId: user.id, username: user.username });
        } catch {
          // ignore
        }
      },

      updateProfile: async (data) => {
        await api.post("/users/me/profile", data);
      },

      updatePreferences: async (data) => {
        await api.post("/users/me/preferences", data);
      },

      updateAvatar: async (avatarUrl) => {
        await api.post("/users/me/avatar", { avatarUrl });
      },

      favorite: async (userId) => {
        await api.post(`/favorites/${userId}`);
      },

      unfavorite: async (userId) => {
        await api.delete(`/favorites/${userId}`);
      },

      fetchFavorites: async () => {
        const { data } = await api.get("/favorites");
        return unwrap(data);
      },

      changePassword: async (oldPassword, newPassword) => {
        await api.post("/auth/change-password", { oldPassword, newPassword });
      },

      forgotPassword: async (email) => {
        await api.post("/auth/forgot-password", { email });
      },

      resetPassword: async (token, password) => {
        await api.post("/auth/reset-password", { token, password });
      },
    }),
    { name: "vibely-auth" },
  ),
);

export async function login(identifier: string, password: string) {
  const { data } = await api.post("/auth/login", { identifier, password });
  const result = unwrap<{ accessToken: string; refreshToken: string; user: { username: string } }>(data);
  useAuthStore.getState().setTokens({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    username: result.user?.username,
  });
  await useAuthStore.getState().fetchMe();
  return result;
}

export async function register(payload: {
  username: string;
  email: string;
  password: string;
  dateOfBirth: string;
  gender: string;
  country: string;
  language: string;
}) {
  const { data } = await api.post("/auth/register", payload);
  return unwrap(data);
}

export async function logout() {
  await api.post("/auth/logout").catch(() => undefined);
  useAuthStore.getState().clear();
}
