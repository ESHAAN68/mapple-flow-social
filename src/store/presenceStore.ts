import { create } from 'zustand';

interface UserPresence {
  user_id: string;
  username: string;
  avatar_url?: string;
  cursor_x: number;
  cursor_y: number;
  status: 'active' | 'away' | 'offline';
}

interface PresenceState {
  users: UserPresence[];
  setUsers: (users: UserPresence[]) => void;
  updateUser: (user: UserPresence) => void;
  removeUser: (userId: string) => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  users: [],
  setUsers: (users) => set({ users }),
  updateUser: (user) => set((state) => ({
    users: state.users.filter(u => u.user_id !== user.user_id).concat(user)
  })),
  removeUser: (userId) => set((state) => ({
    users: state.users.filter(u => u.user_id !== userId)
  })),
}));