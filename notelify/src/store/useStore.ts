import { create } from 'zustand';

interface AppState {
  // Cluster Context
  currentClusterId: string | null;
  setClusterId: (id: string) => void;

  // Selection Context
  activePinId: string | null;
  setActivePin: (pinId: string | null) => void;

  // UI State
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;

  // Theme State
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useStore = create<AppState>((set) => ({
  currentClusterId: null,
  setClusterId: (id) => set({ currentClusterId: id }),

  activePinId: null,
  setActivePin: (pinId) => set({ 
    activePinId: pinId,
    // Ensure sidebar is open to show details or general chat
    isSidebarOpen: true 
  }),

  isSidebarOpen: true, // Defaults to open for "General Chat"
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    return { theme: newTheme };
  }),
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    set({ theme });
  },
}));