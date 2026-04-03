/**
 * Embeddings Playground
 * 
 * Generate and visualize text embeddings, similarity search
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Binary, 
  Plus, 
  Trash2, 
  Download, 
  Search,
  Loader2,
  Copy,
  Check,
  Sparkles,
  BarChart3,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useModelsStore } from '@/stores/models-store';
import { ollamaClient } from '@/lib/ollama-client';
import { cn } from '@/lib/utils';

interface EmbeddingEntry {
  id: string;
  text: string;
  embedding?: number[];
  isLoading: boolean;
  error?: string;
}

interface SimilarityResult {
  id: string;
  text: string;
  similarity: number;
}

// Cosine similarity calculation
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Known embedding models
const EMBEDDING_MODELS = [
  'nomic-embed-text',
  'mxbai-embed-large',
  'all-minilm',
  'snowflake-arctic-embed',
];

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

export function EmbeddingsPlayground() {
  const [entries, setEntries] = useState<EmbeddingEntry[]>([
    { id: generateId(), text: '', isLoading: false },
  ]);
  const [selectedModel, setSelectedModel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SimilarityResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const { toast } = useToast();
  const { models, fetchModels } = useModelsStore();

  // Filter to embedding-capable models
  const embeddingModels = useMemo(() => {
    const available = models.filter(m => 
      EMBEDDING_MODELS.some(em => m.name.toLowerCase().includes(em))
    );
    // Also include any model (embeddings work with most models)
    return available.length > 0 ? available : models;
  }, [models]);

  useEffect(() => {
    if (models.length === 0) {
      fetchModels();
    }
  }, [models.length, fetchModels]);

  useEffect(() => {
    if (!selectedModel && embeddingModels.length > 0) {
      // Prefer known embedding models
      const preferred = embeddingModels.find(m => 
        EMBEDDING_MODELS.some(em => m.name.toLowerCase().includes(em))
      );
      setSelectedModel(preferred?.name || embeddingModels[0].name);
    }
  }, [embeddingModels, selectedModel]);

  const addEntry = useCallback(() => {
    setEntries(prev => [...prev, { id: generateId(), text: '', isLoading: false }]);
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  const updateEntryText = useCallback((id: string, text: string) => {
    setEntries(prev => prev.map(e => 
      e.id === id ? { ...e, text, embedding: undefined } : e
    ));
  }, []);

  const generateEmbedding = useCallback(async (id: string) => {
    const entry = entries.find(e => e.id === id);
    if (!entry || !entry.text.trim() || !selectedModel) return;

    setEntries(prev => prev.map(e => 
      e.id === id ? { ...e, isLoading: true, error: undefined } : e
    ));

    try {
      const response = await ollamaClient.embed({
        model: selectedModel,
        input: entry.text.trim(),
      });

      setEntries(prev => prev.map(e => 
        e.id === id ? { 
          ...e, 
          isLoading: false, 
          embedding: response.embeddings?.[0]
        } : e
      ));

    } catch (error) {
      setEntries(prev => prev.map(e => 
        e.id === id ? { 
          ...e, 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Failed to generate embedding'
        } : e
      ));
    }
  }, [entries, selectedModel]);

  const generateAllEmbeddings = useCallback(async () => {
    const toGenerate = entries.filter(e => e.text.trim() && !e.embedding);
    
    for (const entry of toGenerate) {
      await generateEmbedding(entry.id);
    }
  }, [entries, generateEmbedding]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !selectedModel) return;

    const entriesWithEmbeddings = entries.filter(e => e.embedding);
    if (entriesWithEmbeddings.length === 0) {
      toast({
        title: 'No embeddings',
        description: 'Generate embeddings for your texts first',
        variant: 'destructive',
      });
      return;
    }

    setIsSearching(true);

    try {
      // Generate embedding for search query
      const response = await ollamaClient.embed({
        model: selectedModel,
        input: searchQuery.trim(),
      });
      
      const queryEmbedding = response.embeddings?.[0];
      if (!queryEmbedding) throw new Error('Failed to get query embedding');

      // Calculate similarities
      const results: SimilarityResult[] = entriesWithEmbeddings
        .map(entry => ({
          id: entry.id,
          text: entry.text,
          similarity: cosineSimilarity(queryEmbedding, entry.embedding!),
        }))
        .sort((a, b) => b.similarity - a.similarity);

      setSearchResults(results);

    } catch (error) {
      toast({
        title: 'Search failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, selectedModel, entries, toast]);

  const handleCopy = useCallback((id: string, embedding: number[]) => {
    navigator.clipboard.writeText(JSON.stringify(embedding));
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const handleExport = useCallback(() => {
    const data = entries
      .filter(e => e.embedding)
      .map(e => ({
        text: e.text,
        embedding: e.embedding,
        dimensions: e.embedding?.length,
      }));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `embeddings-${selectedModel}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Embeddings exported' });
  }, [entries, selectedModel, toast]);

  const embeddedCount = entries.filter(e => e.embedding).length;

  return (
    <div className="h-full flex">
      {/* Main Panel */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-black dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Binary className="w-5 h-5 text-cyan-500" />
              <h1 className="text-xl font-bold">Embeddings</h1>
            </div>

            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-[220px] border-2 border-black dark:border-gray-700">
                <SelectValue placeholder="Select embedding model" />
              </SelectTrigger>
              <SelectContent>
                {embeddingModels.map(model => (
                  <SelectItem key={model.name} value={model.name}>
                    {model.name}
                    {EMBEDDING_MODELS.some(em => model.name.includes(em)) && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Embed
                      </Badge>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {embeddedCount}/{entries.length} embedded
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={generateAllEmbeddings}
              disabled={entries.every(e => !e.text.trim() || e.embedding || e.isLoading)}
              className="border-2 border-black dark:border-gray-700"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              Generate All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={embeddedCount === 0}
              className="border-2 border-black dark:border-gray-700"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Entries */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-4xl mx-auto">
            <AnimatePresence mode="popLayout">
              {entries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className="border-2 border-black dark:border-gray-700 p-4">
                    <div className="flex items-start gap-4">
                      <Badge variant="outline" className="shrink-0 mt-2">
                        #{index + 1}
                      </Badge>
                      
                      <div className="flex-1 space-y-3">
                        <Textarea
                          value={entry.text}
                          onChange={(e) => updateEntryText(entry.id, e.target.value)}
                          placeholder="Enter text to embed..."
                          className="min-h-[80px] resize-none border-2 border-black dark:border-gray-700"
                        />

                        {/* Embedding Info */}
                        {entry.embedding && (
                          <div className="flex items-center gap-3 p-2 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                            <BarChart3 className="w-4 h-4 text-cyan-600" />
                            <span className="text-sm">
                              <span className="font-semibold">{entry.embedding.length}</span> dimensions
                            </span>
                            <div className="flex-1 flex items-center gap-1">
                              {entry.embedding.slice(0, 10).map((val, i) => (
                                <div
                                  key={i}
                                  className="w-1 bg-cyan-500 rounded"
                                  style={{ 
                                    height: `${Math.abs(val) * 20 + 4}px`,
                                    opacity: 0.5 + Math.abs(val) * 0.5
                                  }}
                                />
                              ))}
                              <span className="text-xs text-gray-400">...</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(entry.id, entry.embedding!)}
                              className="h-6 px-2"
                            >
                              {copied === entry.id ? (
                                <Check className="w-3 h-3 text-green-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        )}

                        {/* Error */}
                        {entry.error && (
                          <div className="text-sm text-red-500">
                            {entry.error}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateEmbedding(entry.id)}
                          disabled={!entry.text.trim() || entry.isLoading || !selectedModel}
                          className="border-2 border-black dark:border-gray-700"
                        >
                          {entry.isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : entry.embedding ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                        </Button>
                        {entries.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEntry(entry.id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            <Button
              variant="outline"
              onClick={addEntry}
              className="w-full border-2 border-dashed border-gray-300 dark:border-gray-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Text
            </Button>
          </div>
        </ScrollArea>
      </div>

      {/* Similarity Search Panel */}
      <div className="w-[400px] border-l-2 border-black dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b-2 border-black dark:border-gray-700">
          <h3 className="font-bold flex items-center gap-2 mb-4">
            <Target className="w-4 h-4" />
            Similarity Search
          </h3>
          
          <div className="space-y-3">
            <Textarea
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter query to find similar texts..."
              className="min-h-[80px] resize-none border-2 border-black dark:border-gray-700"
            />
            <Button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isSearching || embeddedCount === 0}
              className="w-full bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black border-2 border-black"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Search
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          {searchResults.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                {embeddedCount === 0 
                  ? 'Generate embeddings first'
                  : 'Enter a query to search'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map((result, index) => (
                <Card key={result.id} className="border-2 border-black dark:border-gray-700 p-3">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant={index === 0 ? 'default' : 'secondary'}>
                      #{index + 1}
                    </Badge>
                    <span className={cn(
                      "text-sm font-mono",
                      result.similarity > 0.8 ? "text-green-600" :
                      result.similarity > 0.5 ? "text-yellow-600" : "text-gray-600"
                    )}>
                      {(result.similarity * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-sm line-clamp-3">{result.text}</p>
                  <Progress 
                    value={result.similarity * 100} 
                    className="h-1 mt-2"
                  />
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Legend */}
        <div className="p-4 border-t-2 border-black dark:border-gray-700">
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>High similarity ({'>'}80%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-500" />
              <span>Medium (50-80%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gray-400" />
              <span>Low ({'<'}50%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
