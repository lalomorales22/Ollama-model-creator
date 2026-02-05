/**
 * useOllama Hook
 * 
 * Provides easy access to Ollama operations with loading states
 */

import { useCallback, useState } from 'react';
import { ollamaClient, ProgressResponse } from '@/lib/ollama-client';
import { useModelsStore, OllamaModel, RunningModel } from '@/stores/models-store';
import { useConnectionStore } from '@/stores/connection-store';
import { useActivityStore } from '@/stores/activity-store';

interface UseOllamaReturn {
  // Connection
  isConnected: boolean;
  connectionError: string | null;
  checkConnection: () => Promise<boolean>;
  
  // Models
  models: OllamaModel[];
  runningModels: RunningModel[];
  isLoadingModels: boolean;
  fetchModels: () => Promise<void>;
  fetchRunningModels: () => Promise<void>;
  
  // Model Operations
  pullModel: (modelId: string) => Promise<void>;
  deleteModel: (modelId: string) => Promise<void>;
  copyModel: (source: string, destination: string) => Promise<void>;
  createModel: (name: string, modelfile: string) => Promise<void>;
  showModel: (name: string) => Promise<any>;
  
  // Progress
  pullProgress: number;
  createProgress: string;
  
  // Loading states
  isPulling: boolean;
  isCreating: boolean;
  isDeleting: boolean;
}

export function useOllama(): UseOllamaReturn {
  const [pullProgress, setPullProgress] = useState(0);
  const [createProgress, setCreateProgress] = useState('');
  const [isPulling, setIsPulling] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { 
    status, 
    error: connectionError, 
    checkConnection 
  } = useConnectionStore();
  
  const {
    models,
    runningModels,
    isLoading: isLoadingModels,
    fetchModels,
    fetchRunningModels,
    deleteModel: storeDeleteModel,
    copyModel: storeCopyModel,
  } = useModelsStore();
  
  const { addActivity } = useActivityStore();

  const pullModel = useCallback(async (modelId: string) => {
    setIsPulling(true);
    setPullProgress(0);
    
    try {
      await ollamaClient.pull(modelId, (progress: ProgressResponse) => {
        const percent = progress.total > 0
          ? Math.round((progress.completed / progress.total) * 100)
          : 0;
        setPullProgress(percent);
      });
      
      await fetchModels();
      
      addActivity({
        type: 'model_downloaded',
        title: `Downloaded ${modelId}`,
        description: 'Model is ready to use',
      });
    } finally {
      setIsPulling(false);
      setPullProgress(0);
    }
  }, [fetchModels, addActivity]);

  const deleteModel = useCallback(async (modelId: string) => {
    setIsDeleting(true);
    
    try {
      await storeDeleteModel(modelId);
      
      addActivity({
        type: 'model_deleted',
        title: `Deleted ${modelId}`,
      });
    } finally {
      setIsDeleting(false);
    }
  }, [storeDeleteModel, addActivity]);

  const copyModel = useCallback(async (source: string, destination: string) => {
    await storeCopyModel(source, destination);
    
    addActivity({
      type: 'model_created',
      title: `Copied ${source} to ${destination}`,
    });
  }, [storeCopyModel, addActivity]);

  const createModel = useCallback(async (name: string, modelfile: string) => {
    setIsCreating(true);
    setCreateProgress('Starting...');
    
    try {
      // Parse the modelfile to extract base model
      const fromMatch = modelfile.match(/FROM\s+([^\s\n]+)/i);
      const baseModel = fromMatch?.[1];
      
      await ollamaClient.create(
        {
          model: name,
          from: baseModel,
          // Extract other properties if needed
        },
        (progress: ProgressResponse) => {
          setCreateProgress(progress.status || 'Processing...');
        }
      );
      
      await fetchModels();
      
      addActivity({
        type: 'model_created',
        title: `Created ${name}`,
        description: `Based on ${baseModel || 'unknown'}`,
      });
    } finally {
      setIsCreating(false);
      setCreateProgress('');
    }
  }, [fetchModels, addActivity]);

  const showModel = useCallback(async (name: string) => {
    return await ollamaClient.show(name);
  }, []);

  return {
    // Connection
    isConnected: status === 'connected',
    connectionError,
    checkConnection,
    
    // Models
    models,
    runningModels,
    isLoadingModels,
    fetchModels,
    fetchRunningModels,
    
    // Model Operations
    pullModel,
    deleteModel,
    copyModel,
    createModel,
    showModel,
    
    // Progress
    pullProgress,
    createProgress,
    
    // Loading states
    isPulling,
    isCreating,
    isDeleting,
  };
}
