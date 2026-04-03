/**
 * Model Library
 *
 * Browse the Ollama model library and pull models directly.
 */

import { useState } from 'react';
import {
  Library,
  Download,
  ExternalLink,
  Globe,
  Loader2,
  Code,
  MessageSquare,
  Image,
  Binary,
  Brain,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ollamaClient } from '@/lib/ollama-client';

const CATEGORIES = [
  { icon: MessageSquare, label: 'Chat', query: 'chat', color: 'text-blue-500' },
  { icon: Code, label: 'Code', query: 'code', color: 'text-green-500' },
  { icon: Brain, label: 'Reasoning', query: 'reasoning', color: 'text-purple-500' },
  { icon: Image, label: 'Vision', query: 'vision', color: 'text-orange-500' },
  { icon: Binary, label: 'Embedding', query: 'embedding', color: 'text-cyan-500' },
  { icon: Sparkles, label: 'All Models', query: '', color: 'text-pink-500' },
];

export function ModelLibrary() {
  const [pullName, setPullName] = useState('');
  const [isPulling, setIsPulling] = useState(false);
  const { toast } = useToast();

  const handlePull = async () => {
    const name = pullName.trim();
    if (!name) return;
    setIsPulling(true);
    try {
      await ollamaClient.pull(name);
      toast({ title: 'Model Downloaded', description: `${name} is ready to use.` });
      setPullName('');
    } catch (error: any) {
      toast({ title: 'Download Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsPulling(false);
    }
  };

  const openLibrary = (query?: string) => {
    const url = query
      ? `https://ollama.com/search?q=${encodeURIComponent(query)}`
      : 'https://ollama.com/search';
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold dark:text-white mb-2">Model Library</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Explore and download models from the Ollama library
        </p>
      </div>

      {/* Quick Pull */}
      <Card className="p-5 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <h2 className="text-lg font-bold dark:text-white mb-3 flex items-center gap-2">
          <Download className="w-5 h-5 text-blue-500" />
          Quick Pull
        </h2>
        <div className="flex gap-3">
          <Input
            placeholder="Model name (e.g., llama3.2, deepseek-r1, qwen3)"
            value={pullName}
            onChange={(e) => setPullName(e.target.value)}
            className="flex-1 border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            onKeyDown={(e) => e.key === 'Enter' && handlePull()}
            disabled={isPulling}
          />
          <Button
            onClick={handlePull}
            disabled={isPulling || !pullName.trim()}
            className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
          >
            {isPulling ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Pulling...</>
            ) : (
              <><Download className="w-4 h-4 mr-2" /> Pull</>
            )}
          </Button>
        </div>
      </Card>

      {/* Browse by Category */}
      <div>
        <h2 className="text-lg font-bold dark:text-white mb-3">Browse by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => openLibrary(cat.query)}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <cat.icon className={`w-6 h-6 ${cat.color}`} />
              <span className="text-sm font-medium dark:text-white">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main CTA */}
      <Card className="p-8 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto">
            <Globe className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold dark:text-white">Ollama Model Library</h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
            Browse thousands of models — from general-purpose assistants to specialized tools
            for coding, vision, embeddings, and more. Find a model, copy its name, and pull it above.
          </p>
          <Button
            onClick={() => openLibrary()}
            size="lg"
            className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Browse All Models
          </Button>
        </div>
      </Card>

      {/* Tips */}
      <Card className="p-5 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <h3 className="font-bold dark:text-white mb-3">Tips</h3>
        <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <p className="font-medium dark:text-gray-300 mb-1">Specify a tag</p>
            <p>
              Use <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">model:tag</code> for specific versions,
              e.g. <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">llama3.2:1b</code> for the 1B variant.
            </p>
          </div>
          <div>
            <p className="font-medium dark:text-gray-300 mb-1">Quantization</p>
            <p>
              Many models offer quantized variants like{' '}
              <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">model:q4_K_M</code> for smaller file sizes
              with slightly reduced quality.
            </p>
          </div>
          <div>
            <p className="font-medium dark:text-gray-300 mb-1">CLI Alternative</p>
            <p>
              You can also pull models via terminal:{' '}
              <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">ollama pull model-name</code>
            </p>
          </div>
          <div>
            <p className="font-medium dark:text-gray-300 mb-1">Custom Models</p>
            <p>
              After downloading a base model, use the <strong>Create Model</strong> page to customize it
              with your own system prompt, parameters, and templates.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
