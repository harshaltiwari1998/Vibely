import { create } from "zustand";

export interface IncomingMatchRequest {
  matchId: string;
  requesterId: string;
  requesterUsername: string;
  requesterAvatarUrl?: string | null;
}

interface IncomingMatchState {
  request: IncomingMatchRequest | null;
  setRequest: (request: IncomingMatchRequest) => void;
  clearIfMatches: (matchId: string) => void;
  clear: () => void;
}

export const useIncomingMatchStore = create<IncomingMatchState>((set, get) => ({
  request: null,
  setRequest: (request) => set({ request }),
  clearIfMatches: (matchId) => {
    if (get().request?.matchId === matchId) set({ request: null });
  },
  clear: () => set({ request: null }),
}));
