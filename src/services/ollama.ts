/**
 * Ollama Service
 * 
 * Legacy compatibility layer that wraps the new SDK-based client.
 * This allows existing components to work while migration happens.
 * 
 * @deprecated Use hooks (useOllama, useStreamingChat) or stores directly
 */

import { ollamaClient } from '@/lib/ollama-client';
import type { OllamaModel } from '@/types';

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

class OllamaService {
  /**
   * Get all available models
   */
  async getModels(): Promise<OllamaModel[]> {
    try {
      const response = await ollamaClient.list();
      return (response.models || []).map(m => ({
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
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }

  /**
   * Generate a response (non-streaming)
   * @deprecated Use useStreamingChat hook for streaming responses
   */
  async generateResponse(model: string, prompt: string, stream: boolean = false): Promise<OllamaResponse> {
    try {
      if (stream) {
        // For backward compatibility, collect all chunks
        let fullResponse = '';
        const streamGenerator = ollamaClient.generateStream({ model, prompt });
        
        for await (const chunk of streamGenerator) {
          fullResponse += chunk.response || '';
        }
        
        return {
          model,
          created_at: new Date().toISOString(),
          response: fullResponse,
          done: true,
        };
      }
      
      const response = await ollamaClient.generate({ model, prompt, stream: false });
      
      return {
        model: response.model,
        created_at: response.created_at?.toString() || new Date().toISOString(),
        response: response.response || '',
        done: response.done,
        context: response.context,
        total_duration: response.total_duration,
        load_duration: response.load_duration,
        prompt_eval_count: response.prompt_eval_count,
        prompt_eval_duration: response.prompt_eval_duration,
        eval_count: response.eval_count,
        eval_duration: response.eval_duration,
      };
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }

  /**
   * Stream a response token by token
   */
  async *streamResponse(model: string, prompt: string): AsyncGenerator<string, void, unknown> {
    const stream = ollamaClient.generateStream({ model, prompt });
    for await (const chunk of stream) {
      yield chunk.response || '';
    }
  }

  /**
   * Chat with a model (streaming)
   */
  async *streamChat(
    model: string,
    messages: Array<{ role: string; content: string; images?: string[] }>
  ): AsyncGenerator<string, void, unknown> {
    const stream = ollamaClient.chatStream({ model, messages });
    for await (const chunk of stream) {
      yield chunk.message?.content || '';
    }
  }

  /**
   * Create a custom model
   */
  async createModel(name: string, modelfile: string, onProgress?: (progress: string) => void): Promise<void> {
    try {
      // Validate first
      const validation = this.validateModelFile(modelfile);
      if (!validation.isValid) {
        throw new Error(`ModelFile validation failed: ${validation.errors.join(', ')}`);
      }

      // Parse modelfile to extract configuration
      const fromMatch = modelfile.match(/FROM\s+([^\s\n]+)/i);
      const baseModel = fromMatch?.[1] || 'llama3.2';
      
      // Check if base model exists
      const modelExists = await this.checkModelExists(baseModel);
      if (!modelExists) {
        throw new Error(`Base model "${baseModel}" is not installed. Please download it first.`);
      }
      
      // Extract system prompt
      const systemMatch = modelfile.match(/SYSTEM\s+"""([^]*)"""/i) ||
                         modelfile.match(/SYSTEM\s+"([^"]*)"/i);
      const system = systemMatch?.[1];
      
      // Extract parameters
      const parameters: Record<string, unknown> = {};
      const paramMatches = modelfile.matchAll(/PARAMETER\s+(\w+)\s+([^\n]+)/gi);
      for (const match of paramMatches) {
        const value = parseFloat(match[2]);
        parameters[match[1]] = isNaN(value) ? match[2] : value;
      }
      
      onProgress?.('Starting model creation...');
      
      await ollamaClient.create(
        {
          model: name,
          from: baseModel,
          system,
          parameters: Object.keys(parameters).length > 0 ? parameters : undefined,
        },
        (progress) => {
          onProgress?.(progress.status || 'Processing...');
        }
      );
      
      onProgress?.('Model created successfully!');
    } catch (error) {
      console.error('Error creating model:', error);
      throw error;
    }
  }

  /**
   * Delete a model
   */
  async deleteModel(name: string): Promise<void> {
    try {
      await ollamaClient.delete(name);
    } catch (error) {
      console.error('Error deleting model:', error);
      throw error;
    }
  }

  /**
   * Copy a model
   */
  async copyModel(source: string, destination: string): Promise<void> {
    try {
      await ollamaClient.copy(source, destination);
    } catch (error) {
      console.error('Error copying model:', error);
      throw error;
    }
  }

  /**
   * Pull a model from the registry
   */
  async pullModel(name: string, onProgress?: (progress: string) => void): Promise<void> {
    try {
      await ollamaClient.pull(name, (progress) => {
        const percent = progress.total > 0
          ? Math.round((progress.completed / progress.total) * 100)
          : 0;
        onProgress?.(progress.status ? `${progress.status}: ${percent}%` : `Downloading: ${percent}%`);
      });
    } catch (error) {
      console.error('Error pulling model:', error);
      throw error;
    }
  }

  /**
   * Get model information
   */
  async getModelInfo(name: string): Promise<any> {
    try {
      return await ollamaClient.show(name);
    } catch (error) {
      console.error('Error getting model info:', error);
      throw error;
    }
  }

  /**
   * Get running models
   */
  async getRunningModels(): Promise<any[]> {
    try {
      return await ollamaClient.ps();
    } catch (error) {
      console.error('Error fetching running models:', error);
      return [];
    }
  }

  /**
   * Get Ollama version
   */
  async getVersion(): Promise<string> {
    try {
      const connected = await ollamaClient.checkConnection();
      if (connected) {
        return ollamaClient.connectionState.version || 'Unknown';
      }
      return 'Unknown';
    } catch (error) {
      console.error('Error fetching version:', error);
      return 'Unknown';
    }
  }

  /**
   * Check if a model exists
   */
  async checkModelExists(modelName: string): Promise<boolean> {
    try {
      const models = await this.getModels();
      return models.some(m => m.name === modelName || m.name.startsWith(modelName + ':'));
    } catch (error) {
      console.error('Error checking model:', error);
      return false;
    }
  }

  /**
   * Validate ModelFile syntax
   */
  validateModelFile(modelfile: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const lines = modelfile.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

    // Check for FROM
    const fromLines = lines.filter(l => l.toUpperCase().startsWith('FROM '));
    if (fromLines.length === 0) {
      errors.push('ModelFile must contain a FROM instruction');
    } else if (fromLines.length > 1) {
      errors.push('ModelFile can only contain one FROM instruction');
    } else {
      const parts = fromLines[0].split(/\s+/);
      if (parts.length < 2 || !parts[1].trim()) {
        errors.push('FROM instruction must specify a base model');
      }
    }

    // Validate parameters
    const paramLines = lines.filter(l => l.toUpperCase().startsWith('PARAMETER '));
    for (const line of paramLines) {
      const parts = line.split(/\s+/);
      if (parts.length < 3) {
        errors.push(`Invalid PARAMETER: ${line}`);
      } else {
        const paramName = parts[1].toLowerCase();
        const paramValue = parts[2];
        
        // Validate numeric parameters
        const numericParams = ['temperature', 'top_p', 'top_k', 'repeat_penalty', 'num_ctx', 'num_predict'];
        if (numericParams.includes(paramName)) {
          const num = parseFloat(paramValue);
          if (isNaN(num)) {
            errors.push(`Invalid numeric value for ${paramName}: ${paramValue}`);
          }
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Abort all ongoing requests
   */
  abort(): void {
    ollamaClient.abort();
  }
}

export const ollamaService = new OllamaService();
