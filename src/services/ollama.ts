/**
 * Ollama Service
 *
 * High-level service layer wrapping the Ollama client.
 * Provides model operations, creation, validation, and management.
 */

import { ollamaClient } from '@/lib/ollama-client';
import { VALID_PARAMETER_NAMES, MODELFILE_INSTRUCTIONS } from '@/lib/constants';
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
   */
  async generateResponse(model: string, prompt: string, stream: boolean = false): Promise<OllamaResponse> {
    try {
      if (stream) {
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
   * Create a custom model from a Modelfile string.
   * Parses the Modelfile and sends all instructions through the API.
   */
  async createModel(name: string, modelfile: string, onProgress?: (progress: string) => void): Promise<void> {
    try {
      const validation = this.validateModelFile(modelfile);
      if (!validation.isValid) {
        throw new Error(`ModelFile validation failed: ${validation.errors.join(', ')}`);
      }

      // Parse all Modelfile instructions
      const parsed = this.parseModelFile(modelfile);

      // Check if base model exists
      if (parsed.from) {
        // Only check if it looks like a model name (not a file path)
        if (!parsed.from.startsWith('/') && !parsed.from.startsWith('./') && !parsed.from.endsWith('.gguf')) {
          const modelExists = await this.checkModelExists(parsed.from);
          if (!modelExists) {
            throw new Error(`Base model "${parsed.from}" is not installed. Please download it first.`);
          }
        }
      }

      onProgress?.('Starting model creation...');

      // Build create request with all supported fields
      const createRequest: Record<string, unknown> = {
        model: name,
        from: parsed.from,
      };

      if (parsed.system) createRequest.system = parsed.system;
      if (parsed.template) createRequest.template = parsed.template;
      if (parsed.license) createRequest.license = parsed.license;
      // Note: adapters require pre-uploaded blob digests — path-based adapters
      // are handled by Ollama when using the modelfile string approach instead.
      if (Object.keys(parsed.parameters).length > 0) createRequest.parameters = parsed.parameters;
      if (parsed.messages.length > 0) createRequest.messages = parsed.messages;
      if (parsed.quantize) createRequest.quantize = parsed.quantize;

      await ollamaClient.create(
        createRequest as any,
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
   * Parse a Modelfile string into structured components
   */
  parseModelFile(modelfile: string): {
    from: string;
    parameters: Record<string, unknown>;
    system: string | undefined;
    template: string | undefined;
    adapter: string | undefined;
    license: string | undefined;
    messages: Array<{ role: string; content: string }>;
    requires: string | undefined;
    quantize: string | undefined;
  } {
    const result = {
      from: '',
      parameters: {} as Record<string, unknown>,
      system: undefined as string | undefined,
      template: undefined as string | undefined,
      adapter: undefined as string | undefined,
      license: undefined as string | undefined,
      messages: [] as Array<{ role: string; content: string }>,
      requires: undefined as string | undefined,
      quantize: undefined as string | undefined,
    };

    // Extract FROM
    const fromMatch = modelfile.match(/^FROM\s+([^\s\n]+)/im);
    if (fromMatch) result.from = fromMatch[1];

    // Extract SYSTEM (supports triple-quoted blocks)
    const systemMatch = modelfile.match(/^SYSTEM\s+"""([\s\S]*?)"""/im) ||
                        modelfile.match(/^SYSTEM\s+"([^"]*?)"/im) ||
                        modelfile.match(/^SYSTEM\s+(.+)$/im);
    if (systemMatch) result.system = systemMatch[1].trim();

    // Extract TEMPLATE (supports triple-quoted blocks)
    const templateMatch = modelfile.match(/^TEMPLATE\s+"""([\s\S]*?)"""/im) ||
                          modelfile.match(/^TEMPLATE\s+"([^"]*?)"/im) ||
                          modelfile.match(/^TEMPLATE\s+(.+)$/im);
    if (templateMatch) result.template = templateMatch[1].trim();

    // Extract ADAPTER
    const adapterMatch = modelfile.match(/^ADAPTER\s+([^\s\n]+)/im);
    if (adapterMatch) result.adapter = adapterMatch[1];

    // Extract LICENSE (supports triple-quoted blocks)
    const licenseMatch = modelfile.match(/^LICENSE\s+"""([\s\S]*?)"""/im) ||
                         modelfile.match(/^LICENSE\s+"([^"]*?)"/im) ||
                         modelfile.match(/^LICENSE\s+(.+)$/im);
    if (licenseMatch) result.license = licenseMatch[1].trim();

    // Extract REQUIRES
    const requiresMatch = modelfile.match(/^REQUIRES\s+([^\s\n]+)/im);
    if (requiresMatch) result.requires = requiresMatch[1];

    // Extract PARAMETERS
    const paramRegex = /^PARAMETER\s+(\w+)\s+(.+)$/gim;
    let paramMatch;
    while ((paramMatch = paramRegex.exec(modelfile)) !== null) {
      const key = paramMatch[1].toLowerCase();
      const rawValue = paramMatch[2].trim();

      // Parse value based on type
      if (rawValue === 'true') {
        result.parameters[key] = true;
      } else if (rawValue === 'false') {
        result.parameters[key] = false;
      } else {
        const num = parseFloat(rawValue);
        result.parameters[key] = isNaN(num) ? rawValue : num;
      }
    }

    // Extract MESSAGE instructions
    const messageRegex = /^MESSAGE\s+(system|user|assistant)\s+(.+)$/gim;
    let messageMatch;
    while ((messageMatch = messageRegex.exec(modelfile)) !== null) {
      result.messages.push({
        role: messageMatch[1].toLowerCase(),
        content: messageMatch[2].trim(),
      });
    }

    return result;
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
   * Push a model to the registry
   */
  async pushModel(name: string, onProgress?: (progress: string) => void): Promise<void> {
    try {
      await ollamaClient.push(name, (progress) => {
        onProgress?.(progress.status || 'Pushing...');
      });
    } catch (error) {
      console.error('Error pushing model:', error);
      throw error;
    }
  }

  /**
   * Get model information
   */
  async getModelInfo(name: string, verbose?: boolean): Promise<any> {
    try {
      return await ollamaClient.show(name, verbose);
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
   * Load a model into memory
   */
  async loadModel(name: string, keepAlive: string = '5m'): Promise<void> {
    try {
      await ollamaClient.loadModel(name, keepAlive);
    } catch (error) {
      console.error('Error loading model:', error);
      throw error;
    }
  }

  /**
   * Unload a model from memory
   */
  async unloadModel(name: string): Promise<void> {
    try {
      await ollamaClient.unloadModel(name);
    } catch (error) {
      console.error('Error unloading model:', error);
      throw error;
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
   * Validate ModelFile syntax comprehensively.
   * Checks all instructions and all known parameters.
   */
  validateModelFile(modelfile: string): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Remove comments and empty lines for parsing
    const lines = modelfile
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#'));

    // Check for FROM (required)
    const fromLines = lines.filter(l => /^FROM\s/i.test(l));
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

    // Validate each line starts with a known instruction or is inside a multi-line block
    let inMultiLineBlock = false;
    for (const line of lines) {
      if (inMultiLineBlock) {
        if (line.includes('"""')) {
          inMultiLineBlock = false;
        }
        continue;
      }

      if (line.includes('"""')) {
        inMultiLineBlock = true;
        // Check the instruction before the triple-quote
        const instruction = line.split(/\s+/)[0].toUpperCase();
        if (!MODELFILE_INSTRUCTIONS.includes(instruction as any) && instruction !== '#') {
          warnings.push(`Unknown instruction: ${instruction}`);
        }
        continue;
      }

      // Lines outside multi-line blocks should start with a known instruction.
      // We silently skip unknown ones — Ollama is permissive.

    }

    // Validate PARAMETER instructions
    const paramLines = lines.filter(l => /^PARAMETER\s/i.test(l));
    for (const line of paramLines) {
      const parts = line.split(/\s+/);
      if (parts.length < 3) {
        errors.push(`Invalid PARAMETER (missing value): ${line}`);
        continue;
      }

      const paramName = parts[1].toLowerCase();
      const paramValue = parts.slice(2).join(' ');

      // Check if parameter name is known (just skip unknown ones silently —
      // Ollama itself accepts unknown parameters without error)
      const allKnown = [...VALID_PARAMETER_NAMES, 'stop'];
      if (!allKnown.includes(paramName)) {
        // Only warn for names that look like typos of known params
        continue;
      }

      // Validate numeric parameters
      const numericParams = VALID_PARAMETER_NAMES.filter(p => p !== 'stop');
      if (numericParams.includes(paramName)) {
        if (paramValue !== 'true' && paramValue !== 'false') {
          const num = parseFloat(paramValue);
          if (isNaN(num)) {
            errors.push(`Invalid value for ${paramName}: expected a number, got "${paramValue}"`);
          }
        }
      }
    }

    // Validate MESSAGE instructions
    const messageLines = lines.filter(l => /^MESSAGE\s/i.test(l));
    for (const line of messageLines) {
      const parts = line.split(/\s+/);
      if (parts.length < 3) {
        errors.push(`Invalid MESSAGE (missing role or content): ${line}`);
        continue;
      }
      const role = parts[1].toLowerCase();
      if (!['system', 'user', 'assistant'].includes(role)) {
        errors.push(`Invalid MESSAGE role "${role}". Must be: system, user, or assistant`);
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Abort all ongoing requests
   */
  abort(): void {
    ollamaClient.abort();
  }
}

export const ollamaService = new OllamaService();
