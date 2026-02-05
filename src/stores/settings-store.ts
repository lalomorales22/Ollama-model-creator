/**
 * Settings Store
 * 
 * Manages application settings with localStorage persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_KEYS, DEFAULT_MODEL_PARAMS, DEFAULT_OLLAMA_HOST } from '@/lib/constants';

// Export the settings type directly from here for convenience
export interface AppSettings {
  // Connection
  ollamaUrl: string;
  connectionTimeout: number;
  autoReconnect: boolean;
  
  // UI
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  compactMode: boolean;
  showTooltips: boolean;
  animationsEnabled: boolean;
  
  // Model Defaults
  defaultModel: string;
  defaultTemperature: number;
  defaultContextLength: number;
  autoLoadModels: boolean;
  
  // Notifications
  showNotifications: boolean;
  notifyOnDownload: boolean;
  notifyOnModelCreation: boolean;
  notifyOnErrors: boolean;
  
  // Advanced
  enableDebugMode: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  maxLogEntries: number;
  streamingEnabled: boolean;
}

interface SettingsStore {
  settings: AppSettings;
  // Actions
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  setTheme: (theme: AppSettings['theme']) => void;
  toggleSidebar: () => void;
  setDefaultModel: (model: string) => void;
}

const defaultSettings: AppSettings = {
  // Connection
  ollamaUrl: DEFAULT_OLLAMA_HOST,
  connectionTimeout: 30000,
  autoReconnect: true,
  
  // UI
  theme: 'system',
  sidebarCollapsed: false,
  compactMode: false,
  showTooltips: true,
  animationsEnabled: true,
  
  // Model Defaults
  defaultModel: 'gpt-oss:20b',
  defaultTemperature: DEFAULT_MODEL_PARAMS.temperature,
  defaultContextLength: DEFAULT_MODEL_PARAMS.numCtx,
  autoLoadModels: true,
  
  // Notifications
  showNotifications: true,
  notifyOnDownload: true,
  notifyOnModelCreation: true,
  notifyOnErrors: true,
  
  // Advanced
  enableDebugMode: false,
  logLevel: 'info',
  maxLogEntries: 1000,
  streamingEnabled: true,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,

      updateSettings: (newSettings: Partial<AppSettings>) => {
        set((state) => ({ 
          settings: { ...state.settings, ...newSettings }
        }));
      },

      resetSettings: () => {
        set({ settings: defaultSettings });
      },

      setTheme: (theme: AppSettings['theme']) => {
        set((state) => ({ 
          settings: { ...state.settings, theme }
        }));
        
        // Apply theme to document
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        
        if (theme === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches 
            ? 'dark' 
            : 'light';
          root.classList.add(systemTheme);
        } else {
          root.classList.add(theme);
        }
      },

      toggleSidebar: () => {
        set((state) => ({ 
          settings: { ...state.settings, sidebarCollapsed: !state.settings.sidebarCollapsed }
        }));
      },

      setDefaultModel: (model: string) => {
        set((state) => ({ 
          settings: { ...state.settings, defaultModel: model }
        }));
      },
    }),
    {
      name: STORAGE_KEYS.SETTINGS,
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Initialize theme on load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      const theme = parsed.state?.settings?.theme || 'system';
      const root = document.documentElement;
      
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches 
          ? 'dark' 
          : 'light';
        root.classList.add(systemTheme);
      } else {
        root.classList.add(theme);
      }
    } catch {
      // Ignore parse errors
    }
  }
}
