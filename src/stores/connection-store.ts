/**
 * Connection Store
 * 
 * Manages Ollama server connection state
 */

import { create } from 'zustand';
import { ollamaClient, ConnectionState, ConnectionStatus } from '@/lib/ollama-client';

interface ConnectionStore {
  // State
  status: ConnectionStatus;
  error: string | null;
  lastChecked: Date | null;
  version: string | null;
  host: string;
  isHealthCheckActive: boolean;

  // Actions
  checkConnection: () => Promise<boolean>;
  setHost: (host: string) => void;
  startHealthCheck: (interval?: number) => void;
  stopHealthCheck: () => void;
  reset: () => void;
}

const initialState = {
  status: 'disconnected' as ConnectionStatus,
  error: null,
  lastChecked: null,
  version: null,
  host: 'http://localhost:11434',
  isHealthCheckActive: false,
};

export const useConnectionStore = create<ConnectionStore>((set) => {
  // Subscribe to connection state changes from the client
  ollamaClient.onConnectionChange((state: ConnectionState) => {
    set({
      status: state.status,
      error: state.error || null,
      lastChecked: state.lastChecked,
      version: state.version || null,
    });
  });

  return {
    ...initialState,

    checkConnection: async () => {
      const success = await ollamaClient.checkConnection();
      return success;
    },

    setHost: (host: string) => {
      ollamaClient.setHost(host);
      set({ host });
    },

    startHealthCheck: (interval?: number) => {
      ollamaClient.startHealthCheck(interval);
      set({ isHealthCheckActive: true });
    },

    stopHealthCheck: () => {
      ollamaClient.stopHealthCheck();
      set({ isHealthCheckActive: false });
    },

    reset: () => {
      ollamaClient.stopHealthCheck();
      set(initialState);
    },
  };
});
