/**
 * Model Comparison Suite
 * 
 * Side-by-side comparison of multiple models with the same prompt
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Send, 
  StopCircle, 
  Plus, 
  X, 
  Trash2,
  Download,
  GitCompare,
  Clock,
  Zap,
  Hash,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useModelsStore } from '@/stores/models-store';
import { ollamaClient } from '@/lib/ollama-client';
import { ChatMessageContent } from '@/components/ChatMessageContent';
import { cn } from '@/lib/utils';

interface ModelComparison {
  id: string;
  modelName: string;
  content: string;
  isStreaming: boolean;
  error?: string;
  stats?: {
    totalTokens: number;
    tokensPerSecond: number;
    totalDuration: number;
  };
}

interface ComparisonRound {
  id: string;
  prompt: string;
  responses: ModelComparison[];
  timestamp: Date;
}

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

export function ModelComparison() {
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [rounds, setRounds] = useState<ComparisonRound[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [blindMode, setBlindMode] = useState(false);
  const [revealedModels, setRevealedModels] = useState<Set<string>>(new Set());
  
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const { toast } = useToast();
  const { models, fetchModels } = useModelsStore();

  useEffect(() => {
    if (models.length === 0) {
      fetchModels();
    }
  }, [models.length, fetchModels]);

  const addModel = useCallback((modelName: string) => {
    if (!selectedModels.includes(modelName) && selectedModels.length < 4) {
      setSelectedModels([...selectedModels, modelName]);
    }
  }, [selectedModels]);

  const removeModel = useCallback((modelName: string) => {
    setSelectedModels(selectedModels.filter(m => m !== modelName));
  }, [selectedModels]);

  const handleCompare = useCallback(async () => {
    if (!prompt.trim() || selectedModels.length < 2 || isGenerating) return;

    const roundId = generateId();
    const newRound: ComparisonRound = {
      id: roundId,
      prompt: prompt.trim(),
      responses: selectedModels.map(modelName => ({
        id: generateId(),
        modelName,
        content: '',
        isStreaming: true,
      })),
      timestamp: new Date(),
    };

    setRounds(prev => [newRound, ...prev]);
    setPrompt('');
    setIsGenerating(true);
    setRevealedModels(new Set());

    // Start all model requests in parallel
    const promises = selectedModels.map(async (modelName) => {
      const controller = new AbortController();
      abortControllersRef.current.set(modelName, controller);

      try {
        let fullContent = '';
        const startTime = Date.now();
        let lastChunk: any = null;

        const stream = ollamaClient.chatStream({
          model: modelName,
          messages: [{ role: 'user', content: prompt.trim() }],
        });

        for await (const chunk of stream) {
          if (controller.signal.aborted) break;
          
          fullContent += chunk.message?.content || '';
          lastChunk = chunk;

          // Update content in state
          setRounds(prev => prev.map(r => {
            if (r.id !== roundId) return r;
            return {
              ...r,
              responses: r.responses.map(resp => {
                if (resp.modelName !== modelName) return resp;
                return { ...resp, content: fullContent };
              }),
            };
          }));
        }

        const endTime = Date.now();
        const totalDuration = (endTime - startTime) / 1000;

        // Final update with stats
        setRounds(prev => prev.map(r => {
          if (r.id !== roundId) return r;
          return {
            ...r,
            responses: r.responses.map(resp => {
              if (resp.modelName !== modelName) return resp;
              return {
                ...resp,
                content: fullContent,
                isStreaming: false,
                stats: {
                  totalTokens: (lastChunk?.prompt_eval_count || 0) + (lastChunk?.eval_count || 0),
                  tokensPerSecond: lastChunk?.eval_count ? lastChunk.eval_count / totalDuration : 0,
                  totalDuration,
                },
              };
            }),
          };
        }));

      } catch (error) {
        if (error instanceof Error && error.message !== 'aborted') {
          setRounds(prev => prev.map(r => {
            if (r.id !== roundId) return r;
            return {
              ...r,
              responses: r.responses.map(resp => {
                if (resp.modelName !== modelName) return resp;
                return {
                  ...resp,
                  isStreaming: false,
                  error: error.message,
                };
              }),
            };
          }));
        }
      } finally {
        abortControllersRef.current.delete(modelName);
      }
    });

    await Promise.all(promises);
    setIsGenerating(false);
  }, [prompt, selectedModels, isGenerating]);

  const handleStop = useCallback(() => {
    abortControllersRef.current.forEach(controller => controller.abort());
    abortControllersRef.current.clear();
    ollamaClient.abort();
    
    setRounds(prev => prev.map(r => ({
      ...r,
      responses: r.responses.map(resp => ({
        ...resp,
        isStreaming: false,
      })),
    })));
    
    setIsGenerating(false);
  }, []);

  const handleClear = useCallback(() => {
    setRounds([]);
  }, []);

  const toggleReveal = useCallback((modelName: string) => {
    setRevealedModels(prev => {
      const next = new Set(prev);
      if (next.has(modelName)) {
        next.delete(modelName);
      } else {
        next.add(modelName);
      }
      return next;
    });
  }, []);

  const revealAll = useCallback(() => {
    setRevealedModels(new Set(selectedModels));
  }, [selectedModels]);

  const exportComparison = useCallback(() => {
    const data = {
      models: selectedModels,
      rounds: rounds.map(r => ({
        prompt: r.prompt,
        timestamp: r.timestamp.toISOString(),
        responses: r.responses.map(resp => ({
          model: resp.modelName,
          content: resp.content,
          stats: resp.stats,
          error: resp.error,
        })),
      })),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `model-comparison-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Comparison exported' });
  }, [selectedModels, rounds, toast]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && e.metaKey) {
      e.preventDefault();
      handleCompare();
    }
  };

  const availableModels = models.filter(m => !selectedModels.includes(m.name));

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b-2 border-black dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-blue-500" />
            <h1 className="text-xl font-bold">Model Comparison</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={blindMode}
                onCheckedChange={setBlindMode}
                id="blind-mode"
              />
              <Label htmlFor="blind-mode" className="text-sm cursor-pointer">
                Blind Mode
              </Label>
            </div>
            {blindMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={revealAll}
                className="border-2 border-black dark:border-gray-700"
              >
                <Eye className="w-4 h-4 mr-1" />
                Reveal All
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={exportComparison}
              disabled={rounds.length === 0}
              className="border-2 border-black dark:border-gray-700"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={rounds.length === 0}
              className="border-2 border-black dark:border-gray-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Model Selection */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">Models:</span>
          <div className="flex flex-wrap items-center gap-2">
            {selectedModels.map((modelName, index) => (
              <Badge
                key={modelName}
                variant="secondary"
                className="flex items-center gap-1 px-3 py-1"
              >
                <span className="w-3 h-3 rounded-full" style={{ 
                  backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index % 4] 
                }} />
                {modelName}
                <button
                  onClick={() => removeModel(modelName)}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            {selectedModels.length < 4 && availableModels.length > 0 && (
              <Select onValueChange={addModel}>
                <SelectTrigger className="w-[180px] h-8 border-2 border-dashed border-gray-300 dark:border-gray-700">
                  <Plus className="w-4 h-4 mr-1" />
                  <span>Add Model</span>
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map(model => (
                    <SelectItem key={model.name} value={model.name}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <span className="text-xs text-gray-500">
            ({selectedModels.length}/4 models)
          </span>
        </div>
      </div>

      {/* Comparison Results */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {rounds.length === 0 && (
            <div className="text-center py-20">
              <GitCompare className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
              <h3 className="text-lg font-semibold text-gray-500">
                Compare Models Side-by-Side
              </h3>
              <p className="text-sm text-gray-400 mt-2">
                Select at least 2 models and enter a prompt to compare responses
              </p>
            </div>
          )}

          {rounds.map((round) => (
            <Card key={round.id} className="border-2 border-black dark:border-gray-700 overflow-hidden">
              {/* Prompt */}
              <div className="p-4 bg-gray-100 dark:bg-gray-800 border-b-2 border-black dark:border-gray-700">
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="shrink-0">Prompt</Badge>
                  <p className="text-sm whitespace-pre-wrap">{round.prompt}</p>
                </div>
              </div>

              {/* Responses Grid */}
              <div className={cn(
                "grid gap-0",
                round.responses.length === 2 && "grid-cols-2",
                round.responses.length === 3 && "grid-cols-3",
                round.responses.length === 4 && "grid-cols-2 md:grid-cols-4"
              )}>
                {round.responses.map((response, index) => {
                  const isRevealed = !blindMode || revealedModels.has(response.modelName);
                  const color = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index % 4];
                  
                  return (
                    <div
                      key={response.id}
                      className={cn(
                        "p-4 min-h-[200px] border-r-2 border-b-2 last:border-r-0 border-gray-200 dark:border-gray-700",
                        index >= 2 && round.responses.length > 2 && "md:border-b-0"
                      )}
                    >
                      {/* Model Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: color }} 
                          />
                          {isRevealed ? (
                            <span className="font-semibold text-sm">{response.modelName}</span>
                          ) : (
                            <span className="font-semibold text-sm text-gray-400">
                              Model {String.fromCharCode(65 + index)}
                            </span>
                          )}
                          {response.isStreaming && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                          )}
                        </div>
                        {blindMode && !isRevealed && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleReveal(response.modelName)}
                            className="h-6 px-2"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        )}
                      </div>

                      {/* Response Content */}
                      {response.error ? (
                        <div className="text-red-500 text-sm">
                          Error: {response.error}
                        </div>
                      ) : (
                        <div className="text-sm">
                          <ChatMessageContent content={response.content} />
                          {response.isStreaming && (
                            <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1" />
                          )}
                        </div>
                      )}

                      {/* Stats */}
                      {response.stats && !response.isStreaming && (
                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            {response.stats.totalTokens}
                          </span>
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {response.stats.tokensPerSecond.toFixed(1)} t/s
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {response.stats.totalDuration.toFixed(2)}s
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t-2 border-black dark:border-gray-700">
        <div className="flex gap-2">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedModels.length < 2 
              ? "Select at least 2 models to compare..."
              : "Enter a prompt to compare models... (⌘+Enter to send)"
            }
            className="flex-1 min-h-[60px] resize-none border-2 border-black dark:border-gray-700"
            disabled={isGenerating || selectedModels.length < 2}
          />
          {isGenerating ? (
            <Button
              onClick={handleStop}
              className="h-auto px-6 bg-red-500 hover:bg-red-600 text-white border-2 border-black"
            >
              <StopCircle className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              onClick={handleCompare}
              disabled={!prompt.trim() || selectedModels.length < 2}
              className="h-auto px-6 bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black border-2 border-black"
            >
              <Send className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
