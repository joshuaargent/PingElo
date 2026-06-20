/**
 * Zustand store for UI state management
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Sidebar state
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Theme (if needed beyond Tailwind)
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // Modal states
  matchModalOpen: boolean;
  setMatchModalOpen: (open: boolean) => void;

  // Leaderboard filters
  leaderboardType: 'forever' | 'season';
  setLeaderboardType: (type: 'forever' | 'season') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Sidebar
      sidebarOpen: false,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // Theme
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      // Modals
      matchModalOpen: false,
      setMatchModalOpen: (open) => set({ matchModalOpen: open }),

      // Leaderboard
      leaderboardType: 'forever',
      setLeaderboardType: (type) => set({ leaderboardType: type }),
    }),
    {
      name: 'pingelo-ui-storage',
    }
  )
);
