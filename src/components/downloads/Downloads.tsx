import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Download,
  CheckCircle,
  AlertCircle,
  Trash2,
  RefreshCw,
  ExternalLink,
  Globe,
  Loader2,
} from 'lucide-react';
import { ollamaService } from '@/services/ollama';
import { useToast } from '@/hooks/use-toast';

interface ActiveDownload {
  id: string;
  name: string;
  status: 'downloading' | 'completed' | 'error';
  progress: number;
}

export function Downloads() {
  const [pullModelName, setPullModelName] = useState('');
  const [downloads, setDownloads] = useState<ActiveDownload[]>([]);
  const [isPulling, setIsPulling] = useState(false);
  const { toast } = useToast();

  const handlePullModel = async () => {
    const name = pullModelName.trim();
    if (!name) return;

    setIsPulling(true);

    const download: ActiveDownload = {
      id: name + '-' + Date.now(),
      name,
      status: 'downloading',
      progress: 0,
    };
    setDownloads(prev => [...prev, download]);

    try {
      await ollamaService.pullModel(name, (status) => {
        const pctMatch = status.match(/(\d+)%/);
        if (pctMatch) {
          setDownloads(prev =>
            prev.map(d => (d.id === download.id ? { ...d, progress: parseInt(pctMatch[1]) } : d))
          );
        }
      });

      setDownloads(prev =>
        prev.map(d => (d.id === download.id ? { ...d, status: 'completed', progress: 100 } : d))
      );
      toast({ title: 'Download Complete', description: `${name} is ready to use.` });
      setPullModelName('');
    } catch (error: any) {
      setDownloads(prev =>
        prev.map(d => (d.id === download.id ? { ...d, status: 'error', progress: 0 } : d))
      );
      toast({
        title: 'Download Failed',
        description: error.message || `Failed to download ${name}.`,
        variant: 'destructive',
      });
    } finally {
      setIsPulling(false);
    }
  };

  const removeDownload = (id: string) => {
    setDownloads(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold dark:text-white mb-2">Download Models</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Download models from the Ollama library to use locally
        </p>
      </div>

      {/* Quick Download */}
      <Card className="p-6 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <h2 className="text-lg font-bold dark:text-white mb-3">Pull a Model</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Enter the exact model name from the{' '}
          <a
            href="https://ollama.com/search"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
          >
            Ollama Library
          </a>
          . Examples: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs">llama3.2</code>,{' '}
          <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs">mistral</code>,{' '}
          <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs">deepseek-r1</code>,{' '}
          <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs">qwen3</code>
        </p>
        <div className="flex gap-3">
          <Input
            placeholder="Enter model name (e.g., llama3.2:latest)"
            value={pullModelName}
            onChange={(e) => setPullModelName(e.target.value)}
            className="flex-1 border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            onKeyDown={(e) => e.key === 'Enter' && handlePullModel()}
            disabled={isPulling}
          />
          <Button
            onClick={handlePullModel}
            disabled={isPulling || !pullModelName.trim()}
            className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
          >
            {isPulling ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Pulling...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Active / Recent Downloads */}
      {downloads.length > 0 && (
        <Card className="p-6 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <h2 className="text-lg font-bold dark:text-white mb-4">Downloads</h2>
          <div className="space-y-3">
            {downloads.map((dl) => (
              <div
                key={dl.id}
                className="flex items-center gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium dark:text-white truncate">{dl.name}</span>
                    <Badge
                      variant="outline"
                      className={
                        dl.status === 'completed'
                          ? 'border-green-500 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                          : dl.status === 'error'
                          ? 'border-red-500 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                          : 'border-blue-500 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      }
                    >
                      {dl.status === 'downloading' ? `${dl.progress}%` : dl.status === 'completed' ? 'Done' : 'Failed'}
                    </Badge>
                  </div>
                  {dl.status === 'downloading' && <Progress value={dl.progress} className="h-1.5" />}
                </div>
                <div className="flex-shrink-0">
                  {dl.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-600" />}
                  {dl.status === 'error' && (
                    <Button variant="ghost" size="sm" onClick={() => removeDownload(dl.id)} className="h-8 w-8 p-0">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Browse Ollama Library */}
      <Card className="p-6 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="text-center space-y-4 py-6">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto">
            <Globe className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-xl font-bold dark:text-white">Browse the Ollama Model Library</h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto text-sm">
            Explore thousands of models for chat, coding, vision, embeddings, and more.
            Find the model name, then use the pull field above to download it.
          </p>
          <Button
            onClick={() => window.open('https://ollama.com/search', '_blank')}
            className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Ollama Library
          </Button>
        </div>

        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h4 className="font-medium dark:text-white mb-2 text-sm">How it works</h4>
          <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>1. Click "Open Ollama Library" to browse available models</li>
            <li>2. Copy the model name (e.g. <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">llama3.2</code>)</li>
            <li>3. Paste it in the pull field above and click Download</li>
            <li>4. Or use the CLI: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">ollama pull model-name</code></li>
          </ol>
        </div>
      </Card>
    </div>
  );
}
