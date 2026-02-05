/**
 * Application Constants
 * 
 * Centralized configuration and magic strings
 */

// ============================================
// API Configuration
// ============================================

export const DEFAULT_OLLAMA_HOST = 'http://localhost:11434';
export const API_TIMEOUT = 30000; // 30 seconds
export const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
export const STREAM_RETRY_ATTEMPTS = 3;
export const STREAM_RETRY_DELAY = 1000; // 1 second

// ============================================
// Storage Keys
// ============================================

export const STORAGE_KEYS = {
  SETTINGS: 'ollama-app-settings',
  MODELFILES: 'ollama-modelfiles',
  CHAT_HISTORY: 'ollama-chat-history',
  THEME: 'ollama-theme',
  SIDEBAR_COLLAPSED: 'ollama-sidebar-collapsed',
} as const;

// ============================================
// Default Model Parameters
// ============================================

export const DEFAULT_MODEL_PARAMS = {
  temperature: 0.8,
  topP: 0.9,
  topK: 40,
  repeatPenalty: 1.1,
  numCtx: 2048,
  numPredict: 128,
} as const;

export const PARAMETER_RANGES = {
  temperature: { min: 0, max: 2, step: 0.1 },
  topP: { min: 0, max: 1, step: 0.05 },
  topK: { min: 1, max: 100, step: 1 },
  repeatPenalty: { min: 0.5, max: 2, step: 0.05 },
  numCtx: { min: 512, max: 32768, step: 512 },
  numPredict: { min: 1, max: 4096, step: 1 },
} as const;

// ============================================
// Popular Models
// ============================================

export const POPULAR_MODELS = [
  { id: 'llama3.2', name: 'Llama 3.2', size: '2.0GB', description: 'Latest Llama model with improved reasoning' },
  { id: 'llama3.1', name: 'Llama 3.1', size: '4.7GB', description: 'Powerful general-purpose model' },
  { id: 'mistral', name: 'Mistral 7B', size: '4.1GB', description: 'Efficient model with strong performance' },
  { id: 'codellama', name: 'Code Llama', size: '3.8GB', description: 'Specialized for code generation' },
  { id: 'gemma2', name: 'Gemma 2', size: '5.4GB', description: 'Google\'s open-source model' },
  { id: 'phi3', name: 'Phi-3', size: '2.3GB', description: 'Microsoft\'s efficient small model' },
  { id: 'llava', name: 'LLaVA', size: '4.5GB', description: 'Vision-language model for images' },
  { id: 'deepseek-coder', name: 'DeepSeek Coder', size: '3.8GB', description: 'Optimized for coding tasks' },
  { id: 'qwen2.5', name: 'Qwen 2.5', size: '4.4GB', description: 'Alibaba\'s multilingual model' },
  { id: 'neural-chat', name: 'Neural Chat', size: '3.2GB', description: 'Fine-tuned for conversation' },
] as const;

// ============================================
// ModelFile Templates
// ============================================

export const MODELFILE_TEMPLATES = {
  codingAssistant: {
    name: 'Coding Assistant',
    description: 'Expert programming assistant with clean code practices',
    content: `FROM llama3.2
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER num_ctx 4096

SYSTEM """You are an expert programming assistant. You write clean, efficient, and well-documented code. You explain your reasoning and suggest best practices. When reviewing code, you provide constructive feedback and identify potential issues."""`,
  },
  creativeWriter: {
    name: 'Creative Writer',
    description: 'Imaginative assistant for creative writing and storytelling',
    content: `FROM llama3.2
PARAMETER temperature 1.2
PARAMETER top_p 0.95
PARAMETER repeat_penalty 1.05

SYSTEM """You are a creative writing assistant with a vivid imagination. You excel at storytelling, character development, and creative expression. You help users craft compelling narratives, poetry, and creative content while maintaining their unique voice."""`,
  },
  technicalDocumentation: {
    name: 'Documentation Specialist',
    description: 'Creates clear, comprehensive technical documentation',
    content: `FROM llama3.2
PARAMETER temperature 0.5
PARAMETER top_p 0.85
PARAMETER num_ctx 4096

SYSTEM """You are a technical documentation specialist. You create clear, comprehensive, and well-structured documentation. You excel at explaining complex concepts in accessible language and organizing information logically."""`,
  },
  dataAnalyst: {
    name: 'Data Analyst',
    description: 'Helps with data analysis, statistics, and insights',
    content: `FROM llama3.2
PARAMETER temperature 0.6
PARAMETER top_p 0.9
PARAMETER num_ctx 4096

SYSTEM """You are a data analysis expert. You help interpret data, explain statistical concepts, and provide actionable insights. You can suggest visualization approaches and help users understand patterns in their data."""`,
  },
  teachingTutor: {
    name: 'Teaching Tutor',
    description: 'Patient educator that adapts to learning styles',
    content: `FROM llama3.2
PARAMETER temperature 0.8
PARAMETER top_p 0.9

SYSTEM """You are a patient and encouraging tutor. You adapt your explanations to the student's level of understanding, use analogies and examples, and break complex topics into manageable parts. You celebrate progress and gently correct mistakes."""`,
  },
} as const;

// ============================================
// Route Paths
// ============================================

export const ROUTES = {
  DASHBOARD: '/',
  MODELS: '/models',
  ASSISTANT: '/assistant',
  CREATE: '/create',
  RUNNING: '/running',
  DOWNLOADS: '/downloads',
  MODELFILES: '/modelfiles',
  HELP: '/help',
  SETTINGS: '/settings',
  PLAYGROUND: '/playground',
} as const;

// ============================================
// UI Constants
// ============================================

export const SIDEBAR_WIDTH = 256; // pixels
export const SIDEBAR_COLLAPSED_WIDTH = 64; // pixels
export const HEADER_HEIGHT = 64; // pixels

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// ============================================
// Animation Durations
// ============================================

export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;
