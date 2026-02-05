/**
 * Model Library
 * 
 * Browse and discover models from the Ollama library
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Library, 
  Search, 
  Download, 
  Check, 
  Star,
  HardDrive,
  ExternalLink,
  X,
  RefreshCw,
  Code,
  MessageSquare,
  Image
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useModelsStore } from '@/stores/models-store';
import { ollamaClient } from '@/lib/ollama-client';
import { cn } from '@/lib/utils';

// Model catalog - curated list of popular Ollama models
interface CatalogModel {
  name: string;
  description: string;
  tags: string[];
  variants: string[];
  capabilities: string[];
  parameterSizes: string[];
  pulls?: string;
  updated?: string;
  featured?: boolean;
}

const MODEL_CATALOG: CatalogModel[] = [
  {
    name: 'llama3.2',
    description: "Meta's Llama 3.2 collection of multilingual large language models with improved reasoning",
    tags: ['chat', 'general', 'reasoning'],
    variants: ['1b', '3b', '11b-vision', '90b-vision'],
    capabilities: ['text', 'vision', 'multilingual'],
    parameterSizes: ['1B', '3B', '11B', '90B'],
    pulls: '10M+',
    featured: true,
  },
  {
    name: 'llama3.1',
    description: "Meta's flagship LLM with 128k context and strong instruction following",
    tags: ['chat', 'coding', 'reasoning'],
    variants: ['8b', '70b', '405b'],
    capabilities: ['text', 'tool-use'],
    parameterSizes: ['8B', '70B', '405B'],
    pulls: '15M+',
    featured: true,
  },
  {
    name: 'mistral',
    description: 'Fast, high-quality model from Mistral AI with 32k context',
    tags: ['chat', 'general', 'fast'],
    variants: ['7b', 'instruct'],
    capabilities: ['text'],
    parameterSizes: ['7B'],
    pulls: '8M+',
    featured: true,
  },
  {
    name: 'mixtral',
    description: 'Mixture of Experts model from Mistral with excellent performance',
    tags: ['chat', 'coding', 'expert'],
    variants: ['8x7b', '8x22b'],
    capabilities: ['text'],
    parameterSizes: ['47B', '141B'],
    pulls: '3M+',
  },
  {
    name: 'codellama',
    description: 'Code-specialized LLM from Meta with infilling and instruction tuning',
    tags: ['coding', 'completion', 'instruct'],
    variants: ['7b', '13b', '34b', '70b'],
    capabilities: ['text', 'code', 'infilling'],
    parameterSizes: ['7B', '13B', '34B', '70B'],
    pulls: '5M+',
    featured: true,
  },
  {
    name: 'deepseek-coder-v2',
    description: 'State-of-the-art code model with MoE architecture',
    tags: ['coding', 'expert'],
    variants: ['16b', '236b'],
    capabilities: ['text', 'code'],
    parameterSizes: ['16B', '236B'],
    pulls: '2M+',
  },
  {
    name: 'qwen2.5',
    description: 'Alibaba\'s powerful multilingual model with strong benchmarks',
    tags: ['chat', 'multilingual', 'reasoning'],
    variants: ['0.5b', '1.5b', '3b', '7b', '14b', '32b', '72b'],
    capabilities: ['text', 'multilingual'],
    parameterSizes: ['0.5B', '1.5B', '3B', '7B', '14B', '32B', '72B'],
    pulls: '4M+',
    featured: true,
  },
  {
    name: 'phi3',
    description: 'Microsoft\'s compact but capable small language model',
    tags: ['small', 'efficient', 'reasoning'],
    variants: ['mini', 'small', 'medium', 'vision'],
    capabilities: ['text', 'vision'],
    parameterSizes: ['3.8B', '7B', '14B'],
    pulls: '3M+',
  },
  {
    name: 'gemma2',
    description: 'Google\'s open model built from Gemini research',
    tags: ['chat', 'general', 'google'],
    variants: ['2b', '9b', '27b'],
    capabilities: ['text'],
    parameterSizes: ['2B', '9B', '27B'],
    pulls: '2M+',
  },
  {
    name: 'llava',
    description: 'Multimodal vision-language model for image understanding',
    tags: ['vision', 'multimodal'],
    variants: ['7b', '13b', '34b'],
    capabilities: ['text', 'vision'],
    parameterSizes: ['7B', '13B', '34B'],
    pulls: '4M+',
  },
  {
    name: 'nomic-embed-text',
    description: 'High-quality text embedding model for semantic search',
    tags: ['embedding', 'search'],
    variants: ['v1', 'v1.5'],
    capabilities: ['embedding'],
    parameterSizes: ['137M'],
    pulls: '2M+',
  },
  {
    name: 'mxbai-embed-large',
    description: 'Large embedding model with state-of-the-art performance',
    tags: ['embedding', 'search'],
    variants: ['v1'],
    capabilities: ['embedding'],
    parameterSizes: ['335M'],
    pulls: '1M+',
  },
  {
    name: 'starcoder2',
    description: 'BigCode\'s code LLM trained on The Stack v2',
    tags: ['coding', 'completion'],
    variants: ['3b', '7b', '15b'],
    capabilities: ['text', 'code'],
    parameterSizes: ['3B', '7B', '15B'],
    pulls: '1M+',
  },
  {
    name: 'command-r',
    description: 'Cohere\'s enterprise RAG and tool-use optimized model',
    tags: ['rag', 'tool-use', 'enterprise'],
    variants: ['35b', 'plus'],
    capabilities: ['text', 'tool-use', 'rag'],
    parameterSizes: ['35B', '104B'],
    pulls: '500K+',
  },
  {
    name: 'dolphin-mixtral',
    description: 'Uncensored Mixtral fine-tune with expanded capabilities',
    tags: ['uncensored', 'general'],
    variants: ['8x7b'],
    capabilities: ['text'],
    parameterSizes: ['47B'],
    pulls: '1M+',
  },
  {
    name: 'neural-chat',
    description: 'Intel\'s fine-tuned model optimized for dialogue',
    tags: ['chat', 'intel'],
    variants: ['7b'],
    capabilities: ['text'],
    parameterSizes: ['7B'],
    pulls: '500K+',
  },
];

const CATEGORIES = ['All', 'Featured', 'Chat', 'Coding', 'Vision', 'Embedding'];

interface PullProgress {
  model: string;
  status: string;
  completed: number;
  total: number;
}

export function ModelLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedModel, setSelectedModel] = useState<CatalogModel | null>(null);
  const [pullProgress, setPullProgress] = useState<Map<string, PullProgress>>(new Map());
  
  const { toast } = useToast();
  const { models: installedModels, fetchModels } = useModelsStore();

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // Filter models
  const filteredModels = useMemo(() => {
    return MODEL_CATALOG.filter(model => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!model.name.toLowerCase().includes(query) &&
            !model.description.toLowerCase().includes(query) &&
            !model.tags.some(t => t.toLowerCase().includes(query))) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'All') {
        if (selectedCategory === 'Featured' && !model.featured) return false;
        if (selectedCategory === 'Chat' && !model.tags.includes('chat')) return false;
        if (selectedCategory === 'Coding' && !model.tags.includes('coding')) return false;
        if (selectedCategory === 'Vision' && !model.capabilities.includes('vision')) return false;
        if (selectedCategory === 'Embedding' && !model.capabilities.includes('embedding')) return false;
      }

      return true;
    });
  }, [searchQuery, selectedCategory]);

  // Check if model is installed
  const isInstalled = useCallback((modelName: string) => {
    return installedModels.some(m => m.name.startsWith(modelName));
  }, [installedModels]);

  // Pull model
  const handlePull = useCallback(async (modelName: string, variant?: string) => {
    const fullName = variant ? `${modelName}:${variant}` : modelName;
    
    setPullProgress(prev => new Map(prev).set(fullName, {
      model: fullName,
      status: 'Starting...',
      completed: 0,
      total: 100,
    }));

    try {
      await ollamaClient.pull(fullName, (progress) => {
        setPullProgress(prev => {
          const updated = new Map(prev);
          updated.set(fullName, {
            model: fullName,
            status: progress.status || 'Downloading...',
            completed: progress.completed || 0,
            total: progress.total || 100,
          });
          return updated;
        });
      });

      toast({ title: 'Model pulled successfully!', description: fullName });
      fetchModels();
      
    } catch (error) {
      toast({
        title: 'Failed to pull model',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setPullProgress(prev => {
        const updated = new Map(prev);
        updated.delete(fullName);
        return updated;
      });
    }
  }, [toast, fetchModels]);

  const getCapabilityIcon = (capability: string) => {
    switch (capability) {
      case 'vision': return <Image className="w-3 h-3" />;
      case 'code': return <Code className="w-3 h-3" />;
      case 'text': return <MessageSquare className="w-3 h-3" />;
      case 'tool-use': return <Code className="w-3 h-3" />;
      case 'embedding': return <HardDrive className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b-2 border-black dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Library className="w-5 h-5 text-purple-500" />
            <h1 className="text-xl font-bold">Model Library</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchModels()}
            className="border-2 border-black dark:border-gray-700"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search models..."
              className="pl-10 border-2 border-black dark:border-gray-700"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {CATEGORIES.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "border-2 border-black dark:border-gray-700",
                  selectedCategory === cat && "bg-black text-white dark:bg-white dark:text-black"
                )}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Model Grid */}
      <ScrollArea className="flex-1 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredModels.map((model) => {
              const installed = isInstalled(model.name);
              const progress = pullProgress.get(model.name);
              
              return (
                <motion.div
                  key={model.name}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card 
                    className={cn(
                      "border-2 p-4 cursor-pointer transition-all hover:shadow-lg",
                      model.featured 
                        ? "border-purple-500 dark:border-purple-400" 
                        : "border-black dark:border-gray-700",
                      installed && "bg-green-50 dark:bg-green-900/10"
                    )}
                    onClick={() => setSelectedModel(model)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">{model.name}</h3>
                        {model.featured && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                      {installed && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <Check className="w-3 h-3 mr-1" />
                          Installed
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {model.description}
                    </p>

                    {/* Capabilities */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {model.capabilities.map(cap => (
                        <Badge key={cap} variant="outline" className="text-xs">
                          {getCapabilityIcon(cap)}
                          <span className="ml-1">{cap}</span>
                        </Badge>
                      ))}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {model.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Sizes */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{model.parameterSizes.join(', ')}</span>
                      {model.pulls && <span>{model.pulls} pulls</span>}
                    </div>

                    {/* Progress */}
                    {progress && (
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-blue-600">{progress.status}</span>
                          <span>{Math.round((progress.completed / progress.total) * 100)}%</span>
                        </div>
                        <Progress 
                          value={(progress.completed / progress.total) * 100} 
                          className="h-1"
                        />
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredModels.length === 0 && (
          <div className="text-center py-20">
            <Search className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
            <p className="text-gray-500">No models found matching your criteria</p>
          </div>
        )}
      </ScrollArea>

      {/* Model Detail Dialog */}
      <Dialog open={!!selectedModel} onOpenChange={() => setSelectedModel(null)}>
        {selectedModel && (
          <DialogContent className="max-w-2xl border-2 border-black dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                {selectedModel.name}
                {selectedModel.featured && (
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                )}
                {isInstalled(selectedModel.name) && (
                  <Badge className="bg-green-500">Installed</Badge>
                )}
              </DialogTitle>
              <DialogDescription>{selectedModel.description}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* Capabilities */}
              <div>
                <h4 className="font-semibold mb-2">Capabilities</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedModel.capabilities.map(cap => (
                    <Badge key={cap} variant="outline" className="px-3 py-1">
                      {getCapabilityIcon(cap)}
                      <span className="ml-1 capitalize">{cap}</span>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Variants */}
              <div>
                <h4 className="font-semibold mb-2">Available Variants</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {selectedModel.variants.map(variant => {
                    const fullName = `${selectedModel.name}:${variant}`;
                    const variantInstalled = installedModels.some(m => m.name === fullName);
                    const progress = pullProgress.get(fullName);

                    return (
                      <Card key={variant} className="border-2 border-black dark:border-gray-700 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono font-semibold">{variant}</span>
                          {variantInstalled && (
                            <Check className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        
                        {progress ? (
                          <div className="space-y-1">
                            <Progress 
                              value={(progress.completed / progress.total) * 100} 
                              className="h-1"
                            />
                            <span className="text-xs text-gray-500">{progress.status}</span>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant={variantInstalled ? 'outline' : 'default'}
                            onClick={() => handlePull(selectedModel.name, variant)}
                            disabled={!!pullProgress.get(fullName)}
                            className="w-full"
                          >
                            {variantInstalled ? (
                              'Re-pull'
                            ) : (
                              <>
                                <Download className="w-4 h-4 mr-1" />
                                Pull
                              </>
                            )}
                          </Button>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Tags */}
              <div>
                <h4 className="font-semibold mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedModel.tags.map(tag => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>

              {/* External Link */}
              <Button
                variant="outline"
                className="w-full border-2 border-black dark:border-gray-700"
                asChild
              >
                <a 
                  href={`https://ollama.com/library/${selectedModel.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Ollama Library
                </a>
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
