/**
 * useModelCreation Hook
 * 
 * Handles the model creation flow with validation and progress
 */

import { useCallback, useState } from 'react';
import { ollamaClient, ProgressResponse } from '@/lib/ollama-client';
import { useModelsStore } from '@/stores/models-store';
import { useActivityStore } from '@/stores/activity-store';
import { PARAMETER_RANGES } from '@/lib/constants';

interface ModelCreationConfig {
  name: string;
  baseModel: string;
  systemPrompt?: string;
  temperature?: number;
  topP?: number;
  topK?: number;
  repeatPenalty?: number;
  numCtx?: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface UseModelCreationReturn {
  // State
  isCreating: boolean;
  progress: string;
  error: string | null;
  
  // Actions
  createModel: (config: ModelCreationConfig) => Promise<boolean>;
  validateConfig: (config: ModelCreationConfig) => ValidationResult;
  generateModelFile: (config: ModelCreationConfig) => string;
  reset: () => void;
}

export function useModelCreation(): UseModelCreationReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const { fetchModels, models } = useModelsStore();
  const { addActivity } = useActivityStore();

  const validateConfig = useCallback((config: ModelCreationConfig): ValidationResult => {
    const errors: string[] = [];
    
    // Name validation
    if (!config.name || config.name.trim().length === 0) {
      errors.push('Model name is required');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(config.name)) {
      errors.push('Model name can only contain letters, numbers, hyphens, and underscores');
    } else if (config.name.length > 50) {
      errors.push('Model name must be 50 characters or less');
    }
    
    // Check if name already exists
    if (models.some(m => m.name.toLowerCase() === config.name.toLowerCase())) {
      errors.push('A model with this name already exists');
    }
    
    // Base model validation
    if (!config.baseModel || config.baseModel.trim().length === 0) {
      errors.push('Base model is required');
    }
    
    // Parameter validation
    if (config.temperature !== undefined) {
      const { min, max } = PARAMETER_RANGES.temperature;
      if (config.temperature < min || config.temperature > max) {
        errors.push(`Temperature must be between ${min} and ${max}`);
      }
    }
    
    if (config.topP !== undefined) {
      const { min, max } = PARAMETER_RANGES.topP;
      if (config.topP < min || config.topP > max) {
        errors.push(`Top P must be between ${min} and ${max}`);
      }
    }
    
    if (config.topK !== undefined) {
      const { min, max } = PARAMETER_RANGES.topK;
      if (config.topK < min || config.topK > max) {
        errors.push(`Top K must be between ${min} and ${max}`);
      }
    }
    
    if (config.repeatPenalty !== undefined) {
      const { min, max } = PARAMETER_RANGES.repeatPenalty;
      if (config.repeatPenalty < min || config.repeatPenalty > max) {
        errors.push(`Repeat penalty must be between ${min} and ${max}`);
      }
    }
    
    if (config.numCtx !== undefined) {
      const { min, max } = PARAMETER_RANGES.numCtx;
      if (config.numCtx < min || config.numCtx > max) {
        errors.push(`Context length must be between ${min} and ${max}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [models]);

  const generateModelFile = useCallback((config: ModelCreationConfig): string => {
    const lines: string[] = [];
    
    // FROM instruction
    lines.push(`FROM ${config.baseModel}`);
    lines.push('');
    
    // Parameters
    if (config.temperature !== undefined) {
      lines.push(`PARAMETER temperature ${config.temperature}`);
    }
    if (config.topP !== undefined) {
      lines.push(`PARAMETER top_p ${config.topP}`);
    }
    if (config.topK !== undefined) {
      lines.push(`PARAMETER top_k ${config.topK}`);
    }
    if (config.repeatPenalty !== undefined) {
      lines.push(`PARAMETER repeat_penalty ${config.repeatPenalty}`);
    }
    if (config.numCtx !== undefined) {
      lines.push(`PARAMETER num_ctx ${config.numCtx}`);
    }
    
    // System prompt
    if (config.systemPrompt && config.systemPrompt.trim().length > 0) {
      lines.push('');
      // Use triple quotes for multiline
      if (config.systemPrompt.includes('\n')) {
        lines.push(`SYSTEM """${config.systemPrompt}"""`);
      } else {
        lines.push(`SYSTEM """${config.systemPrompt}"""`);
      }
    }
    
    return lines.join('\n');
  }, []);

  const createModel = useCallback(async (config: ModelCreationConfig): Promise<boolean> => {
    // Validate first
    const validation = validateConfig(config);
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return false;
    }
    
    setIsCreating(true);
    setProgress('Preparing model creation...');
    setError(null);
    
    try {
      // Check if base model exists
      const baseModelExists = models.some(
        m => m.name === config.baseModel || m.name.startsWith(config.baseModel + ':')
      );
      
      if (!baseModelExists) {
        setError(`Base model "${config.baseModel}" is not installed. Please download it first.`);
        return false;
      }
      
      // Create the model using the SDK
      await ollamaClient.create(
        {
          model: config.name,
          from: config.baseModel,
          system: config.systemPrompt,
          parameters: {
            temperature: config.temperature,
            top_p: config.topP,
            top_k: config.topK,
            repeat_penalty: config.repeatPenalty,
            num_ctx: config.numCtx,
          },
        },
        (progressResponse: ProgressResponse) => {
          setProgress(progressResponse.status || 'Processing...');
        }
      );
      
      setProgress('Model created successfully!');
      
      // Refresh models list
      await fetchModels();
      
      // Log activity
      addActivity({
        type: 'model_created',
        title: `Created model: ${config.name}`,
        description: `Based on ${config.baseModel}`,
        metadata: {
          modelName: config.name,
          baseModel: config.baseModel,
        },
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create model';
      setError(errorMessage);
      
      addActivity({
        type: 'error',
        title: 'Model creation failed',
        description: errorMessage,
      });
      
      return false;
    } finally {
      setIsCreating(false);
    }
  }, [validateConfig, models, fetchModels, addActivity]);

  const reset = useCallback(() => {
    setIsCreating(false);
    setProgress('');
    setError(null);
  }, []);

  return {
    isCreating,
    progress,
    error,
    createModel,
    validateConfig,
    generateModelFile,
    reset,
  };
}
