/**
 * Models Store
 * 
 * Manages available and running Ollama models
 */

import { create } from 'zustand';
import { ollamaClient } from '@/lib/ollama-client';
import type { OllamaModel, RunningModel, DownloadProgress } from '@/types';

// Re-export types for convenience
export type { OllamaModel, RunningModel, DownloadProgress };

interface ModelsStore {
  // State
  models: OllamaModel[];
  runningModels: RunningModel[];
  isLoading: boolean;
  isLoadingRunning: boolean;
  isPulling: boolean;
  pullProgress: DownloadProgress | null;
  error: string | null;
  lastFetched: Date | null;
  downloads: Map<string, DownloadProgress>;

  // Actions
  fetchModels: () => Promise<void>;
  fetchRunningModels: () => Promise<void>;
  refreshAll: () => Promise<void>;
  pullModel: (modelId: string, onProgress?: (progress: number) => void) => Promise<void>;
  deleteModel: (modelId: string) => Promise<void>;
  copyModel: (source: string, destination: string) => Promise<void>;
  cancelDownload: (modelId: string) => void;
  getModelByName: (name: string) => OllamaModel | undefined;
  reset: () => void;
}

const initialState = {
  models: [] as OllamaModel[],
  runningModels: [] as RunningModel[],
  isLoading: false,
  isLoadingRunning: false,
  isPulling: false,
  pullProgress: null as DownloadProgress | null,
  error: null as string | null,
  lastFetched: null as Date | null,
  downloads: new Map<string, DownloadProgress>(),
};

export const useModelsStore = create<ModelsStore>((set, get) => ({
  ...initialState,

  fetchModels: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await ollamaClient.list();
      const models = (response.models || []).map(m => ({
        name: m.name,
        model: m.model,
        modified_at: m.modified_at?.toString() || new Date().toISOString(),
        size: m.size,
        digest: m.digest,
        details: m.details || {
          parent_model: '',
          format: '',
          family: '',
          families: [],
          parameter_size: '',
          quantization_level: '',
        },
      }));
      
      set({
        models,
        isLoading: false,
        lastFetched: new Date(),
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch models',
      });
    }
  },

  fetchRunningModels: async () => {
    set({ isLoadingRunning: true });
    
    try {
      const models = await ollamaClient.ps();
      set({
        runningModels: models.map(m => ({
          ...m,
          expires_at: m.expires_at instanceof Date ? m.expires_at.toISOString() : m.expires_at as string
        })) as RunningModel[],
        isLoadingRunning: false,
      });
    } catch (error) {
      set({
        isLoadingRunning: false,
        error: error instanceof Error ? error.message : 'Failed to fetch running models',
      });
    }
  },

  refreshAll: async () => {
    await Promise.all([
      get().fetchModels(),
      get().fetchRunningModels(),
    ]);
  },

  pullModel: async (modelId: string, onProgress?: (progress: number) => void) => {
    const downloadProgress: DownloadProgress = {
      modelId,
      modelName: modelId,
      status: 'downloading',
      progress: 0,
      total: 0,
      completed: 0,
      startedAt: new Date().toISOString(),
    };

    set(state => ({
      downloads: new Map(state.downloads).set(modelId, downloadProgress),
    }));

    try {
      await ollamaClient.pull(modelId, (progress) => {
        const percent = progress.total > 0 
          ? Math.round((progress.completed / progress.total) * 100)
          : 0;
        
        onProgress?.(percent);

        set(state => {
          const downloads = new Map(state.downloads);
          const current = downloads.get(modelId);
          if (current) {
            downloads.set(modelId, {
              ...current,
              progress: percent,
              total: progress.total,
              completed: progress.completed,
              status: progress.status === 'success' ? 'completed' : 'downloading',
            });
          }
          return { downloads };
        });
      });

      // Mark as completed
      set(state => {
        const downloads = new Map(state.downloads);
        const current = downloads.get(modelId);
        if (current) {
          downloads.set(modelId, {
            ...current,
            status: 'completed',
            progress: 100,
            completedAt: new Date().toISOString(),
          });
        }
        return { downloads };
      });

      // Refresh models list
      await get().fetchModels();
    } catch (error) {
      set(state => {
        const downloads = new Map(state.downloads);
        const current = downloads.get(modelId);
        if (current) {
          downloads.set(modelId, {
            ...current,
            status: 'error',
            error: error instanceof Error ? error.message : 'Download failed',
          });
        }
        return { downloads };
      });
      throw error;
    }
  },

  deleteModel: async (modelId: string) => {
    try {
      await ollamaClient.delete(modelId);
      await get().fetchModels();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete model',
      });
      throw error;
    }
  },

  copyModel: async (source: string, destination: string) => {
    try {
      await ollamaClient.copy(source, destination);
      await get().fetchModels();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to copy model',
      });
      throw error;
    }
  },

  cancelDownload: (modelId: string) => {
    ollamaClient.abort();
    
    set(state => {
      const downloads = new Map(state.downloads);
      const current = downloads.get(modelId);
      if (current) {
        downloads.set(modelId, {
          ...current,
          status: 'cancelled',
        });
      }
      return { downloads };
    });
  },

  getModelByName: (name: string) => {
    return get().models.find(m => m.name === name);
  },

  reset: () => {
    set(initialState);
  },
}));
