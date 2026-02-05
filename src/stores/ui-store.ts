import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Sidebar
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  
  // Command palette
  commandPaletteOpen: boolean;
  
  // Chat sidebar
  chatSidebarOpen: boolean;
  
  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleChatSidebar: () => void;
  setChatSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Initial state
      sidebarCollapsed: false,
      sidebarMobileOpen: false,
      commandPaletteOpen: false,
      chatSidebarOpen: true,
      
      // Sidebar actions
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleMobileSidebar: () => set((state) => ({ sidebarMobileOpen: !state.sidebarMobileOpen })),
      setMobileSidebarOpen: (open) => set({ sidebarMobileOpen: open }),
      
      // Command palette actions
      toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      
      // Chat sidebar actions
      toggleChatSidebar: () => set((state) => ({ chatSidebarOpen: !state.chatSidebarOpen })),
      setChatSidebarOpen: (open) => set({ chatSidebarOpen: open }),
    }),
    {
      name: 'ollama-ui-settings',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        chatSidebarOpen: state.chatSidebarOpen,
      }),
    }
  )
);
