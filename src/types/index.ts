/**
 * Core Type Definitions
 * 
 * Centralized TypeScript types for the application
 */

// Re-export Ollama types from the SDK
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
} from 'ollama/browser';

// ============================================
// Model Types
// ============================================

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: ModelDetails;
}

export interface ModelDetails {
  parent_model: string;
  format: string;
  family: string;
  families: string[];
  parameter_size: string;
  quantization_level: string;
}

export interface RunningModel {
  name: string;
  model: string;
  size: number;
  size_vram: number;
  expires_at: string;
  digest: string;
}

// ============================================
// ModelFile Types
// ============================================

export interface ModelFile {
  id: string;
  name: string;
  content: string;
  baseModel: string;
  parameters: ModelFileParameters;
  system?: string;
  template?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModelFileParameters {
  // Sampling
  temperature?: number;
  top_p?: number;
  top_k?: number;
  min_p?: number;
  typical_p?: number;
  // Repetition
  repeat_penalty?: number;
  repeat_last_n?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  penalize_newline?: boolean;
  // Generation
  num_ctx?: number;
  num_predict?: number;
  seed?: number;
  stop?: string[];
  // Performance
  num_keep?: number;
  num_batch?: number;
  num_gpu?: number;
  num_thread?: number;
  main_gpu?: number;
  use_mmap?: boolean;
  numa?: boolean;
  // Mirostat
  mirostat?: number;
  mirostat_tau?: number;
  mirostat_eta?: number;
  [key: string]: unknown;
}

// ============================================
// Chat Types
// ============================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  thinking?: string;
  timestamp: string;
  images?: string[];
  isStreaming?: boolean;
  model?: string;
  stats?: GenerationStats;
  toolCalls?: Array<{
    function: { name: string; arguments: Record<string, unknown> };
  }>;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  model: string;
  systemPrompt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerationStats {
  totalDuration?: number;
  loadDuration?: number;
  promptEvalCount?: number;
  promptEvalDuration?: number;
  evalCount?: number;
  evalDuration?: number;
  tokensPerSecond?: number;
}

// ============================================
// Settings Types
// ============================================

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

// ============================================
// Download Types
// ============================================

export interface DownloadProgress {
  modelId: string;
  modelName: string;
  status: 'pending' | 'downloading' | 'completed' | 'error' | 'cancelled';
  progress: number;
  total: number;
  completed: number;
  speed?: number;
  eta?: number;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

// ============================================
// UI Types
// ============================================

export type ToastVariant = 'default' | 'destructive' | 'success';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

export interface ActivityItem {
  id: string;
  type: 'model_created' | 'model_downloaded' | 'model_deleted' | 'chat_started' | 'modelfile_saved' | 'error';
  title: string;
  description?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: 'success' | 'error';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================
// Form Types
// ============================================

export interface ModelCreationForm {
  name: string;
  baseModel: string;
  systemPrompt: string;
  template: string;
  adapter: string;
  license: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  requires: string;
  quantize: '' | 'q4_K_M' | 'q4_K_S' | 'q8_0';
  parameters: ModelFileParameters;
}

export interface PushModelRequest {
  model: string;
  insecure?: boolean;
  stream?: boolean;
}

export type KeepAliveDuration = string | number; // e.g. "5m", "1h", 0, -1

// ============================================
// Utility Types
// ============================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type WithTimestamps<T> = T & {
  createdAt: string;
  updatedAt: string;
};
