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
export const DEFAULT_KEEP_ALIVE = '5m';

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
  minP: 0.0,
  repeatPenalty: 1.1,
  repeatLastN: 64,
  numCtx: 2048,
  numPredict: -1,
  seed: 0,
  presencePenalty: 0.0,
  frequencyPenalty: 0.0,
  typicalP: 1.0,
  penalizeNewline: true,
  mirostat: 0,
  mirostatTau: 5.0,
  mirostatEta: 0.1,
} as const;

// ============================================
// Complete Parameter Definitions
// All parameters supported by Ollama Modelfiles
// ============================================

export interface ParameterDefinition {
  key: string;
  modelfileKey: string; // The key used in PARAMETER instructions
  label: string;
  description: string;
  type: 'float' | 'int' | 'boolean' | 'string';
  min?: number;
  max?: number;
  step?: number;
  default: number | boolean | string;
  category: 'sampling' | 'repetition' | 'generation' | 'performance' | 'mirostat';
  advanced?: boolean;
}

export const ALL_PARAMETERS: ParameterDefinition[] = [
  // Sampling
  {
    key: 'temperature',
    modelfileKey: 'temperature',
    label: 'Temperature',
    description: 'Controls randomness. Lower = more focused and deterministic, higher = more creative and diverse.',
    type: 'float',
    min: 0,
    max: 2,
    step: 0.1,
    default: 0.8,
    category: 'sampling',
  },
  {
    key: 'top_p',
    modelfileKey: 'top_p',
    label: 'Top P (Nucleus Sampling)',
    description: 'Considers tokens with top_p cumulative probability mass. Higher = more diverse, lower = more focused.',
    type: 'float',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0.9,
    category: 'sampling',
  },
  {
    key: 'top_k',
    modelfileKey: 'top_k',
    label: 'Top K',
    description: 'Limits vocabulary to top K most likely tokens. Lower = more conservative, higher = more diverse.',
    type: 'int',
    min: 1,
    max: 100,
    step: 1,
    default: 40,
    category: 'sampling',
  },
  {
    key: 'min_p',
    modelfileKey: 'min_p',
    label: 'Min P',
    description: 'Minimum probability threshold relative to the most likely token. Filters out very unlikely tokens.',
    type: 'float',
    min: 0,
    max: 1,
    step: 0.01,
    default: 0.0,
    category: 'sampling',
    advanced: true,
  },
  {
    key: 'typical_p',
    modelfileKey: 'typical_p',
    label: 'Typical P',
    description: 'Locally typical sampling threshold. Selects tokens close to the expected information content.',
    type: 'float',
    min: 0,
    max: 1,
    step: 0.05,
    default: 1.0,
    category: 'sampling',
    advanced: true,
  },
  // Repetition
  {
    key: 'repeat_penalty',
    modelfileKey: 'repeat_penalty',
    label: 'Repeat Penalty',
    description: 'Penalizes token repetition. Higher = less repetition. 1.0 = disabled.',
    type: 'float',
    min: 0.5,
    max: 2,
    step: 0.05,
    default: 1.1,
    category: 'repetition',
  },
  {
    key: 'repeat_last_n',
    modelfileKey: 'repeat_last_n',
    label: 'Repeat Last N',
    description: 'Number of tokens to look back for repetition. 0 = disabled, -1 = context size.',
    type: 'int',
    min: -1,
    max: 4096,
    step: 1,
    default: 64,
    category: 'repetition',
    advanced: true,
  },
  {
    key: 'presence_penalty',
    modelfileKey: 'presence_penalty',
    label: 'Presence Penalty',
    description: 'Penalizes tokens already present in the context. Encourages new topics.',
    type: 'float',
    min: -2,
    max: 2,
    step: 0.1,
    default: 0.0,
    category: 'repetition',
    advanced: true,
  },
  {
    key: 'frequency_penalty',
    modelfileKey: 'frequency_penalty',
    label: 'Frequency Penalty',
    description: 'Penalizes tokens based on how often they appear. Reduces frequent word repetition.',
    type: 'float',
    min: -2,
    max: 2,
    step: 0.1,
    default: 0.0,
    category: 'repetition',
    advanced: true,
  },
  {
    key: 'penalize_newline',
    modelfileKey: 'penalize_newline',
    label: 'Penalize Newlines',
    description: 'Whether to penalize newline tokens in repetition penalty.',
    type: 'boolean',
    default: true,
    category: 'repetition',
    advanced: true,
  },
  // Generation
  {
    key: 'num_ctx',
    modelfileKey: 'num_ctx',
    label: 'Context Length',
    description: 'Size of the context window in tokens. Larger = more memory but can reference more text.',
    type: 'int',
    min: 256,
    max: 131072,
    step: 256,
    default: 2048,
    category: 'generation',
  },
  {
    key: 'num_predict',
    modelfileKey: 'num_predict',
    label: 'Max Tokens',
    description: 'Maximum number of tokens to generate. -1 = infinite, -2 = fill context.',
    type: 'int',
    min: -2,
    max: 131072,
    step: 64,
    default: -1,
    category: 'generation',
  },
  {
    key: 'seed',
    modelfileKey: 'seed',
    label: 'Seed',
    description: 'Random number seed for reproducibility. 0 = random each time.',
    type: 'int',
    min: 0,
    max: 999999999,
    step: 1,
    default: 0,
    category: 'generation',
    advanced: true,
  },
  // Performance
  {
    key: 'num_gpu',
    modelfileKey: 'num_gpu',
    label: 'GPU Layers',
    description: 'Number of model layers to offload to GPU. -1 = all layers. 0 = CPU only.',
    type: 'int',
    min: -1,
    max: 999,
    step: 1,
    default: -1,
    category: 'performance',
    advanced: true,
  },
  {
    key: 'num_thread',
    modelfileKey: 'num_thread',
    label: 'CPU Threads',
    description: 'Number of CPU threads to use. 0 = auto-detect.',
    type: 'int',
    min: 0,
    max: 128,
    step: 1,
    default: 0,
    category: 'performance',
    advanced: true,
  },
  {
    key: 'num_batch',
    modelfileKey: 'num_batch',
    label: 'Batch Size',
    description: 'Number of tokens to process in parallel during prompt evaluation.',
    type: 'int',
    min: 1,
    max: 2048,
    step: 1,
    default: 512,
    category: 'performance',
    advanced: true,
  },
  {
    key: 'num_keep',
    modelfileKey: 'num_keep',
    label: 'Tokens to Keep',
    description: 'Number of tokens to keep from the initial prompt when context window is exceeded.',
    type: 'int',
    min: -1,
    max: 131072,
    step: 1,
    default: -1,
    category: 'performance',
    advanced: true,
  },
  {
    key: 'use_mmap',
    modelfileKey: 'use_mmap',
    label: 'Memory Map',
    description: 'Use memory-mapped files for model loading. Faster loading but uses more virtual memory.',
    type: 'boolean',
    default: true,
    category: 'performance',
    advanced: true,
  },
  {
    key: 'numa',
    modelfileKey: 'numa',
    label: 'NUMA',
    description: 'Enable NUMA optimization for multi-socket CPU systems.',
    type: 'boolean',
    default: false,
    category: 'performance',
    advanced: true,
  },
  // Mirostat
  {
    key: 'mirostat',
    modelfileKey: 'mirostat',
    label: 'Mirostat Mode',
    description: 'Mirostat sampling mode. 0 = disabled, 1 = Mirostat, 2 = Mirostat 2.0.',
    type: 'int',
    min: 0,
    max: 2,
    step: 1,
    default: 0,
    category: 'mirostat',
    advanced: true,
  },
  {
    key: 'mirostat_tau',
    modelfileKey: 'mirostat_tau',
    label: 'Mirostat Tau',
    description: 'Target entropy for Mirostat. Controls output diversity. Lower = more focused.',
    type: 'float',
    min: 0,
    max: 10,
    step: 0.1,
    default: 5.0,
    category: 'mirostat',
    advanced: true,
  },
  {
    key: 'mirostat_eta',
    modelfileKey: 'mirostat_eta',
    label: 'Mirostat Eta',
    description: 'Learning rate for Mirostat. Controls how quickly the algorithm adapts.',
    type: 'float',
    min: 0,
    max: 1,
    step: 0.01,
    default: 0.1,
    category: 'mirostat',
    advanced: true,
  },
];

// Legacy parameter ranges (for backward compatibility)
export const PARAMETER_RANGES = {
  temperature: { min: 0, max: 2, step: 0.1 },
  topP: { min: 0, max: 1, step: 0.05 },
  topK: { min: 1, max: 100, step: 1 },
  repeatPenalty: { min: 0.5, max: 2, step: 0.05 },
  numCtx: { min: 256, max: 131072, step: 256 },
  numPredict: { min: -2, max: 131072, step: 64 },
} as const;

// Valid Modelfile instructions
export const MODELFILE_INSTRUCTIONS = [
  'FROM',
  'PARAMETER',
  'TEMPLATE',
  'SYSTEM',
  'ADAPTER',
  'LICENSE',
  'MESSAGE',
  'REQUIRES',
] as const;

// All valid parameter names for validation
export const VALID_PARAMETER_NAMES = ALL_PARAMETERS.map(p => p.modelfileKey);

// ============================================
// Keep Alive Presets
// ============================================

export const KEEP_ALIVE_PRESETS = [
  { label: 'Unload immediately', value: '0' },
  { label: '1 minute', value: '1m' },
  { label: '5 minutes (default)', value: '5m' },
  { label: '15 minutes', value: '15m' },
  { label: '30 minutes', value: '30m' },
  { label: '1 hour', value: '1h' },
  { label: '24 hours', value: '24h' },
  { label: 'Keep loaded forever', value: '-1' },
] as const;

// ============================================
// Quantization Options
// ============================================

export const QUANTIZATION_OPTIONS = [
  { value: '', label: 'None (keep original)' },
  { value: 'q4_K_M', label: 'Q4_K_M (recommended, balanced)' },
  { value: 'q4_K_S', label: 'Q4_K_S (smaller, slightly less quality)' },
  { value: 'q8_0', label: 'Q8_0 (highest quality, larger)' },
] as const;

// ============================================
// Popular Models (Updated)
// ============================================

export const POPULAR_MODELS = [
  { id: 'llama3.3', name: 'Llama 3.3 70B', size: '39GB', description: 'Most capable Llama model with top-tier reasoning', category: 'general' },
  { id: 'llama3.2', name: 'Llama 3.2', size: '2.0GB', description: 'Compact Llama with strong reasoning for its size', category: 'general' },
  { id: 'llama3.1', name: 'Llama 3.1 8B', size: '4.7GB', description: 'Versatile general-purpose model', category: 'general' },
  { id: 'deepseek-r1', name: 'DeepSeek R1', size: '4.7GB', description: 'Advanced reasoning model with chain-of-thought', category: 'reasoning' },
  { id: 'qwen3', name: 'Qwen 3', size: '4.7GB', description: 'Latest Alibaba model with hybrid thinking', category: 'general' },
  { id: 'qwen2.5-coder', name: 'Qwen 2.5 Coder', size: '4.7GB', description: 'Top-performing open-source code model', category: 'code' },
  { id: 'gemma3', name: 'Gemma 3', size: '5.4GB', description: 'Google\'s latest open model with multimodal support', category: 'general' },
  { id: 'phi4', name: 'Phi-4', size: '8.4GB', description: 'Microsoft\'s 14B model with exceptional reasoning', category: 'reasoning' },
  { id: 'mistral', name: 'Mistral 7B', size: '4.1GB', description: 'Efficient model with strong performance', category: 'general' },
  { id: 'mixtral', name: 'Mixtral 8x7B', size: '26GB', description: 'Mixture of experts for high-quality outputs', category: 'general' },
  { id: 'codellama', name: 'Code Llama', size: '3.8GB', description: 'Specialized for code generation and review', category: 'code' },
  { id: 'deepseek-coder-v2', name: 'DeepSeek Coder V2', size: '8.9GB', description: 'Advanced coding with 236B MoE architecture', category: 'code' },
  { id: 'starcoder2', name: 'StarCoder2', size: '3.8GB', description: 'BigCode\'s model trained on The Stack v2', category: 'code' },
  { id: 'llava', name: 'LLaVA', size: '4.5GB', description: 'Vision-language model for image understanding', category: 'vision' },
  { id: 'llama3.2-vision', name: 'Llama 3.2 Vision', size: '6.0GB', description: 'Llama with native image understanding', category: 'vision' },
  { id: 'nomic-embed-text', name: 'Nomic Embed Text', size: '274MB', description: 'High-quality text embeddings model', category: 'embedding' },
  { id: 'mxbai-embed-large', name: 'mxbai Embed Large', size: '670MB', description: 'Large embedding model for semantic search', category: 'embedding' },
  { id: 'all-minilm', name: 'all-MiniLM', size: '45MB', description: 'Lightweight embedding model', category: 'embedding' },
] as const;

// ============================================
// ModelFile Templates (Expanded)
// ============================================

export const MODELFILE_TEMPLATES = {
  codingAssistant: {
    name: 'Coding Assistant',
    description: 'Expert programming assistant with clean code practices',
    category: 'development',
    content: `FROM llama3.2
PARAMETER temperature 0.3
PARAMETER top_p 0.9
PARAMETER num_ctx 8192
PARAMETER repeat_penalty 1.1
PARAMETER stop "<|eot_id|>"

SYSTEM """You are an expert programming assistant. You write clean, efficient, and well-documented code. You explain your reasoning and suggest best practices. When reviewing code, you provide constructive feedback and identify potential issues. Always include error handling and follow SOLID principles."""`,
  },
  creativeWriter: {
    name: 'Creative Writer',
    description: 'Imaginative assistant for creative writing and storytelling',
    category: 'creative',
    content: `FROM llama3.2
PARAMETER temperature 1.2
PARAMETER top_p 0.95
PARAMETER min_p 0.05
PARAMETER repeat_penalty 1.05
PARAMETER repeat_last_n 256
PARAMETER num_ctx 4096

SYSTEM """You are a creative writing assistant with a vivid imagination. You excel at storytelling, character development, and creative expression. You help users craft compelling narratives, poetry, and creative content while maintaining their unique voice. Use rich sensory details and varied sentence structures."""`,
  },
  technicalDocumentation: {
    name: 'Documentation Specialist',
    description: 'Creates clear, comprehensive technical documentation',
    category: 'development',
    content: `FROM llama3.2
PARAMETER temperature 0.4
PARAMETER top_p 0.85
PARAMETER num_ctx 8192
PARAMETER repeat_penalty 1.15

SYSTEM """You are a technical documentation specialist. You create clear, comprehensive, and well-structured documentation. You excel at explaining complex concepts in accessible language, organizing information logically, and providing practical examples. Follow Diátaxis documentation framework principles."""`,
  },
  dataAnalyst: {
    name: 'Data Analyst',
    description: 'Helps with data analysis, statistics, and insights',
    category: 'analytical',
    content: `FROM llama3.2
PARAMETER temperature 0.5
PARAMETER top_p 0.9
PARAMETER num_ctx 8192

SYSTEM """You are a data analysis expert. You help interpret data, explain statistical concepts, and provide actionable insights. You suggest visualization approaches, identify patterns, and help users make data-driven decisions. Always show your work and explain statistical significance."""`,
  },
  teachingTutor: {
    name: 'Teaching Tutor',
    description: 'Patient educator that adapts to learning styles',
    category: 'education',
    content: `FROM llama3.2
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER num_ctx 4096

SYSTEM """You are a patient and encouraging tutor. You adapt your explanations to the student's level of understanding, use analogies and examples, and break complex topics into manageable parts. You celebrate progress and gently correct mistakes. Use the Socratic method when appropriate."""`,
  },
  researchAssistant: {
    name: 'Research Assistant',
    description: 'Systematic researcher with academic rigor',
    category: 'analytical',
    content: `FROM llama3.2
PARAMETER temperature 0.3
PARAMETER top_p 0.85
PARAMETER num_ctx 8192
PARAMETER repeat_penalty 1.15
PARAMETER presence_penalty 0.1

SYSTEM """You are a meticulous research assistant. You help analyze information, synthesize findings, and maintain academic rigor. You always cite your reasoning, identify limitations, distinguish between correlation and causation, and present balanced perspectives. Structure your responses clearly with headings and bullet points."""`,
  },
  devopsEngineer: {
    name: 'DevOps Engineer',
    description: 'Infrastructure, CI/CD, and operations expert',
    category: 'development',
    content: `FROM llama3.2
PARAMETER temperature 0.3
PARAMETER top_p 0.9
PARAMETER num_ctx 8192

SYSTEM """You are a senior DevOps engineer with expertise in Docker, Kubernetes, CI/CD pipelines, cloud infrastructure (AWS, GCP, Azure), Terraform, and monitoring. You prioritize security, reliability, and infrastructure-as-code. Always consider cost optimization and scalability."""`,
  },
  jsonExtractor: {
    name: 'JSON Data Extractor',
    description: 'Structured data extraction that always outputs valid JSON',
    category: 'utility',
    content: `FROM llama3.2
PARAMETER temperature 0.1
PARAMETER top_p 0.8
PARAMETER num_ctx 4096
PARAMETER repeat_penalty 1.0

SYSTEM """You are a data extraction assistant. You ALWAYS respond with valid JSON. When given text, you extract structured data according to the user's schema. Never include explanations outside the JSON. If information is missing, use null values. Ensure all strings are properly escaped."""`,
  },
  reasoningModel: {
    name: 'Reasoning / Chain of Thought',
    description: 'Step-by-step logical reasoning for complex problems',
    category: 'analytical',
    content: `FROM llama3.2
PARAMETER temperature 0.4
PARAMETER top_p 0.9
PARAMETER num_ctx 8192
PARAMETER num_predict 4096

SYSTEM """You are a logical reasoning assistant. For every problem, you MUST think step-by-step before giving your answer. Structure your reasoning as:
1. Understand: Restate the problem in your own words
2. Plan: Outline your approach
3. Execute: Work through each step showing your work
4. Verify: Check your answer for errors
5. Conclude: State your final answer clearly

Never skip steps. If uncertain, explicitly state your confidence level."""`,
  },
  roleplayer: {
    name: 'Roleplay Character',
    description: 'Immersive character roleplay with example messages',
    category: 'creative',
    content: `FROM llama3.2
PARAMETER temperature 1.0
PARAMETER top_p 0.95
PARAMETER min_p 0.05
PARAMETER repeat_penalty 1.1
PARAMETER repeat_last_n 512
PARAMETER num_ctx 4096
PARAMETER presence_penalty 0.3

SYSTEM """You are a versatile roleplay partner. Stay in character at all times. Describe actions in *asterisks*. Be creative, responsive to the scenario, and build upon the established narrative. Maintain consistency with previously established details."""

MESSAGE user Tell me about yourself.
MESSAGE assistant *adjusts spectacles and smiles warmly* I'm whoever you need me to be. Give me a character, a setting, and a scenario, and I'll bring it to life. What adventure shall we embark on today?`,
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
  TOOLS: '/tools',
  COMPARE: '/compare',
  EDITOR: '/editor',
  EMBEDDINGS: '/embeddings',
  LIBRARY: '/library',
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
