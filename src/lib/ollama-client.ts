/**
 * Ollama Client Wrapper
 *
 * A wrapper around the official ollama-js SDK that provides:
 * - Singleton instance management
 * - Connection status tracking
 * - Full Ollama API coverage (generate, chat, create, pull, push, load/unload, embed)
 * - Error normalization
 * - Event emitters for connection state changes
 */

import { Ollama } from 'ollama/browser';
import type {
  ChatRequest,
  ChatResponse,
  GenerateRequest,
  GenerateResponse,
  CreateRequest,
  ProgressResponse,
  ListResponse,
  ShowResponse,
  ModelResponse,
  EmbedRequest,
  EmbedResponse,
  Message,
  Tool,
} from 'ollama/browser';

// Re-export types for convenience
export type {
  ChatRequest,
  ChatResponse,
  GenerateRequest,
  GenerateResponse,
  CreateRequest,
  ProgressResponse,
  ListResponse,
  ShowResponse,
  ModelResponse,
  EmbedRequest,
  EmbedResponse,
  Message,
  Tool,
};

// Connection state types
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

export interface ConnectionState {
  status: ConnectionStatus;
  error?: string;
  lastChecked: Date | null;
  version?: string;
}

// Event types for connection state changes
type ConnectionListener = (state: ConnectionState) => void;

// Default configuration
const DEFAULT_HOST = 'http://localhost:11434';
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const CONNECTION_TIMEOUT = 10000; // 10 seconds

class OllamaClient {
  private client: Ollama;
  private _connectionState: ConnectionState = {
    status: 'disconnected',
    lastChecked: null,
  };
  private connectionListeners: Set<ConnectionListener> = new Set();
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null;
  private _host: string;

  constructor(host: string = DEFAULT_HOST) {
    this._host = host;
    this.client = new Ollama({ host });
  }

  // ============================================
  // Connection Management
  // ============================================

  get host(): string {
    return this._host;
  }

  get connectionState(): ConnectionState {
    return { ...this._connectionState };
  }

  /**
   * Update the host URL and reinitialize the client
   */
  setHost(host: string): void {
    this._host = host;
    this.client = new Ollama({ host });
    this.updateConnectionState({ status: 'disconnected', lastChecked: null });
  }

  /**
   * Subscribe to connection state changes
   */
  onConnectionChange(listener: ConnectionListener): () => void {
    this.connectionListeners.add(listener);
    // Immediately call with current state
    listener(this._connectionState);
    return () => this.connectionListeners.delete(listener);
  }

  private updateConnectionState(updates: Partial<ConnectionState>): void {
    this._connectionState = { ...this._connectionState, ...updates };
    this.connectionListeners.forEach(listener => listener(this._connectionState));
  }

  /**
   * Check connection to Ollama server
   */
  async checkConnection(): Promise<boolean> {
    this.updateConnectionState({ status: 'connecting' });

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT);

      const response = await fetch(`${this._host}/api/version`, {
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        this.updateConnectionState({
          status: 'connected',
          lastChecked: new Date(),
          version: data.version,
          error: undefined,
        });
        return true;
      } else {
        throw new Error(`Server returned ${response.status}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateConnectionState({
        status: 'error',
        lastChecked: new Date(),
        error: errorMessage.includes('abort') ? 'Connection timeout' : errorMessage,
      });
      return false;
    }
  }

  /**
   * Start periodic health checks
   */
  startHealthCheck(interval: number = HEALTH_CHECK_INTERVAL): void {
    this.stopHealthCheck();
    this.checkConnection();
    this.healthCheckInterval = setInterval(() => this.checkConnection(), interval);
  }

  /**
   * Stop periodic health checks
   */
  stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  // ============================================
  // Model Operations
  // ============================================

  /**
   * List all available models
   */
  async list(): Promise<ListResponse> {
    try {
      return await this.client.list();
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get model information
   * @param verbose - Include full model info (tensors, etc.)
   */
  async show(model: string, verbose?: boolean): Promise<ShowResponse> {
    try {
      return await this.client.show({ model, verbose });
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Pull a model from the registry
   */
  async pull(
    model: string,
    onProgress?: (progress: ProgressResponse) => void
  ): Promise<void> {
    try {
      const stream = await this.client.pull({ model, stream: true });

      for await (const progress of stream) {
        onProgress?.(progress);
      }
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Push a model to the registry
   */
  async push(
    model: string,
    onProgress?: (progress: ProgressResponse) => void,
    insecure?: boolean
  ): Promise<void> {
    try {
      const stream = await this.client.push({ model, insecure, stream: true });

      for await (const progress of stream) {
        onProgress?.(progress);
      }
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Create a new model
   */
  async create(
    request: CreateRequest,
    onProgress?: (progress: ProgressResponse) => void
  ): Promise<void> {
    try {
      const stream = await this.client.create({ ...request, stream: true });

      for await (const progress of stream) {
        onProgress?.(progress);
      }
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Delete a model
   */
  async delete(model: string): Promise<void> {
    try {
      // Use direct fetch — the SDK's delete can 404 on some Ollama versions
      const response = await fetch(`${this._host}/api/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: model }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Delete failed with status ${response.status}`);
      }
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Copy a model
   */
  async copy(source: string, destination: string): Promise<void> {
    try {
      await this.client.copy({ source, destination });
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get running models
   */
  async ps(): Promise<ModelResponse[]> {
    try {
      const response = await fetch(`${this._host}/api/ps`);
      if (!response.ok) {
        throw new Error('Failed to fetch running models');
      }
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Load a model into memory by sending an empty generate request.
   * @param keepAlive - How long to keep the model loaded (e.g. "5m", "1h", "-1" for forever)
   */
  async loadModel(model: string, keepAlive: string = '5m'): Promise<void> {
    try {
      await this.client.generate({ model, prompt: '', keep_alive: keepAlive, stream: false } as any);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Unload a model from memory by setting keep_alive to 0.
   */
  async unloadModel(model: string): Promise<void> {
    try {
      await this.client.generate({ model, prompt: '', keep_alive: '0', stream: false } as any);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // ============================================
  // Chat & Generation
  // ============================================

  /**
   * Chat with a model (non-streaming)
   */
  async chat(request: ChatRequest & { stream?: false }): Promise<ChatResponse> {
    try {
      return await this.client.chat({ ...request, stream: false });
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Chat with a model (streaming)
   */
  async *chatStream(
    request: Omit<ChatRequest, 'stream'>
  ): AsyncGenerator<ChatResponse, void, unknown> {
    try {
      const stream = await this.client.chat({ ...request, stream: true });

      for await (const chunk of stream) {
        yield chunk;
      }
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Generate a response (non-streaming)
   */
  async generate(request: GenerateRequest & { stream?: false }): Promise<GenerateResponse> {
    try {
      return await this.client.generate({ ...request, stream: false });
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Generate a response (streaming)
   */
  async *generateStream(
    request: Omit<GenerateRequest, 'stream'>
  ): AsyncGenerator<GenerateResponse, void, unknown> {
    try {
      const stream = await this.client.generate({ ...request, stream: true });

      for await (const chunk of stream) {
        yield chunk;
      }
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // ============================================
  // Embeddings
  // ============================================

  /**
   * Generate embeddings
   */
  async embed(request: EmbedRequest): Promise<EmbedResponse> {
    try {
      return await this.client.embed(request);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // ============================================
  // Blob Operations
  // ============================================

  /**
   * Check if a blob exists on the server
   */
  async checkBlob(digest: string): Promise<boolean> {
    try {
      const response = await fetch(`${this._host}/api/blobs/${digest}`, {
        method: 'HEAD',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // ============================================
  // Utilities
  // ============================================

  /**
   * Abort all ongoing requests
   */
  abort(): void {
    this.client.abort();
  }

  /**
   * Handle and normalize errors
   */
  private handleError(error: unknown): void {
    // Check if it's a connection error and update state
    if (error instanceof Error) {
      if (
        error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('ECONNREFUSED')
      ) {
        this.updateConnectionState({
          status: 'error',
          error: 'Connection to Ollama server failed',
          lastChecked: new Date(),
        });
      }
    }
  }

  /**
   * Get the underlying Ollama client for advanced usage
   */
  getClient(): Ollama {
    return this.client;
  }
}

// Singleton instance
export const ollamaClient = new OllamaClient();

// Export the class for testing or custom instances
export { OllamaClient };
