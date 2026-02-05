/**
 * Vision Model Detection Utility
 * 
 * Detects and provides info about vision-capable models
 */

// Known vision-capable model families
const VISION_MODEL_PATTERNS = [
  'llava',
  'bakllava',
  'moondream',
  'minicpm-v',
  'llama3.2-vision',
  'llama-3.2-vision',
  'cogvlm',
  'fuyu',
  'qwen-vl',
  'qwen2-vl',
  'internvl',
  'yi-vl',
  'phi-3-vision',
  'phi3-vision',
];

export interface VisionModelInfo {
  isVisionModel: boolean;
  supportsMultipleImages: boolean;
  maxImages: number;
  modelFamily: string | null;
}

/**
 * Check if a model name indicates vision capabilities
 */
export function isVisionModel(modelName: string): boolean {
  const lowerName = modelName.toLowerCase();
  return VISION_MODEL_PATTERNS.some(pattern => lowerName.includes(pattern));
}

/**
 * Get detailed info about a model's vision capabilities
 */
export function getVisionModelInfo(modelName: string): VisionModelInfo {
  const lowerName = modelName.toLowerCase();
  
  // Find matching pattern
  const matchedPattern = VISION_MODEL_PATTERNS.find(pattern => 
    lowerName.includes(pattern)
  );

  if (!matchedPattern) {
    return {
      isVisionModel: false,
      supportsMultipleImages: false,
      maxImages: 0,
      modelFamily: null,
    };
  }

  // Model-specific configurations
  const modelConfigs: Record<string, Partial<VisionModelInfo>> = {
    'llava': { supportsMultipleImages: true, maxImages: 4 },
    'bakllava': { supportsMultipleImages: true, maxImages: 4 },
    'moondream': { supportsMultipleImages: false, maxImages: 1 },
    'minicpm-v': { supportsMultipleImages: true, maxImages: 4 },
    'llama3.2-vision': { supportsMultipleImages: true, maxImages: 4 },
    'llama-3.2-vision': { supportsMultipleImages: true, maxImages: 4 },
    'cogvlm': { supportsMultipleImages: false, maxImages: 1 },
    'fuyu': { supportsMultipleImages: false, maxImages: 1 },
    'qwen-vl': { supportsMultipleImages: true, maxImages: 4 },
    'qwen2-vl': { supportsMultipleImages: true, maxImages: 4 },
    'internvl': { supportsMultipleImages: true, maxImages: 4 },
    'yi-vl': { supportsMultipleImages: false, maxImages: 1 },
    'phi-3-vision': { supportsMultipleImages: true, maxImages: 4 },
    'phi3-vision': { supportsMultipleImages: true, maxImages: 4 },
  };

  const config = modelConfigs[matchedPattern] || {};

  return {
    isVisionModel: true,
    supportsMultipleImages: config.supportsMultipleImages ?? true,
    maxImages: config.maxImages ?? 4,
    modelFamily: matchedPattern,
  };
}

/**
 * Filter models list to only vision-capable models
 */
export function filterVisionModels<T extends { name: string }>(models: T[]): T[] {
  return models.filter(model => isVisionModel(model.name));
}

/**
 * Sort models with vision models first
 */
export function sortModelsVisionFirst<T extends { name: string }>(models: T[]): T[] {
  return [...models].sort((a, b) => {
    const aIsVision = isVisionModel(a.name);
    const bIsVision = isVisionModel(b.name);
    
    if (aIsVision && !bIsVision) return -1;
    if (!aIsVision && bIsVision) return 1;
    return a.name.localeCompare(b.name);
  });
}
