import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Cpu,
  MemoryStick as Memory,
  Clock,
  RefreshCw,
  Square,
  Play,
  AlertCircle,
  Activity,
  Upload,
  Loader2,
  Timer,
} from 'lucide-react';
import { ollamaService } from '@/services/ollama';
import { useModelsStore } from '@/stores/models-store';
import { useToast } from '@/hooks/use-toast';
import { KEEP_ALIVE_PRESETS } from '@/lib/constants';

interface RunningModel {
  name: string;
  model: string;
  size: number;
  size_vram: number;
  expires_at: string;
  digest: string;
}

export function RunningModels() {
  const [runningModels, setRunningModels] = useState<RunningModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [loadingModel, setLoadingModel] = useState<string | null>(null);
  const [unloadingModel, setUnloadingModel] = useState<string | null>(null);
  const [selectedModelToLoad, setSelectedModelToLoad] = useState('');
  const [selectedKeepAlive, setSelectedKeepAlive] = useState('5m');
  const { toast } = useToast();
  const { models, fetchModels } = useModelsStore();

  useEffect(() => {
    loadRunningModels();
    if (models.length === 0) fetchModels();
    const interval = setInterval(loadRunningModels, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadRunningModels = async () => {
    try {
      setHasError(false);
      const models = await ollamaService.getRunningModels();
      setRunningModels(models);
    } catch (error) {
      console.error('Error loading running models:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnloadModel = async (modelName: string) => {
    setUnloadingModel(modelName);
    try {
      await ollamaService.unloadModel(modelName);
      toast({
        title: 'Model Unloaded',
        description: `${modelName} has been unloaded from memory.`,
      });
      // Give Ollama a moment to update, then refresh
      setTimeout(loadRunningModels, 1000);
    } catch (error: any) {
      toast({
        title: 'Unload Failed',
        description: `Failed to unload ${modelName}: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setUnloadingModel(null);
    }
  };

  const handleLoadModel = async () => {
    if (!selectedModelToLoad) return;
    setLoadingModel(selectedModelToLoad);
    try {
      await ollamaService.loadModel(selectedModelToLoad, selectedKeepAlive);
      toast({
        title: 'Model Loaded',
        description: `${selectedModelToLoad} has been loaded into memory (keep alive: ${selectedKeepAlive}).`,
      });
      setSelectedModelToLoad('');
      setTimeout(loadRunningModels, 1000);
    } catch (error: any) {
      toast({
        title: 'Load Failed',
        description: `Failed to load ${selectedModelToLoad}: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoadingModel(null);
    }
  };

  const formatSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTimeUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const getMemoryUsagePercentage = (sizeVram: number, totalSize: number) => {
    if (totalSize === 0) return 0;
    return Math.round((sizeVram / totalSize) * 100);
  };

  // Models available to load (installed but not currently running)
  const modelsAvailableToLoad = models.filter(
    m => !runningModels.some(r => r.name === m.name)
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold dark:text-white mb-2">Running Models</h1>
          <p className="text-gray-600 dark:text-gray-400">Loading running models...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 animate-pulse">
              <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold dark:text-white mb-2">Running Models</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor and manage currently loaded models</p>
        </div>
        <Button
          onClick={loadRunningModels}
          variant="outline"
          className="border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Load Model Section */}
      <Card className="p-5 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <h2 className="text-lg font-bold dark:text-white mb-3 flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-500" />
          Load Model into Memory
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedModelToLoad} onValueChange={setSelectedModelToLoad}>
            <SelectTrigger className="flex-1 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800">
              <SelectValue placeholder="Select a model to load..." />
            </SelectTrigger>
            <SelectContent>
              {modelsAvailableToLoad.length === 0 ? (
                <SelectItem value="_none" disabled>
                  {models.length === 0 ? 'No models installed' : 'All models are already running'}
                </SelectItem>
              ) : (
                modelsAvailableToLoad.map(model => (
                  <SelectItem key={model.name} value={model.name}>
                    {model.name} ({formatSize(model.size)})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <Select value={selectedKeepAlive} onValueChange={setSelectedKeepAlive}>
            <SelectTrigger className="w-48 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800">
              <Timer className="w-4 h-4 mr-1 text-gray-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KEEP_ALIVE_PRESETS.map(preset => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleLoadModel}
            disabled={!selectedModelToLoad || !!loadingModel}
            className="bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-600"
          >
            {loadingModel ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Load Model
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Pre-load a model into memory so it responds instantly. The keep-alive timer controls how long the model stays loaded after its last use.
        </p>
      </Card>

      {hasError && (
        <Card className="p-6 border-2 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-bold text-red-800 dark:text-red-400">Connection Error</h3>
              <p className="text-sm text-red-600 dark:text-red-400">
                Unable to connect to Ollama service. Make sure it's running.
              </p>
            </div>
            <Button
              onClick={loadRunningModels}
              size="sm"
              variant="outline"
              className="border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 ml-auto"
            >
              Retry
            </Button>
          </div>
        </Card>
      )}

      {runningModels.length === 0 && !hasError ? (
        <Card className="p-8 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
              <Cpu className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold dark:text-white">No Models Running</h3>
            <p className="text-gray-600 dark:text-gray-400">
              No models are currently loaded in memory. Use the load section above to pre-load a model, or start a chat to load one automatically.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {runningModels.map((model, index) => {
            const isUnloading = unloadingModel === model.name;
            return (
              <Card key={`${model.name}-${index}`} className="p-6 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold dark:text-white">{model.name}</h3>
                      <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20">
                        Running
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600 dark:text-gray-400">VRAM Usage</span>
                      <span className="font-medium dark:text-white">{formatSize(model.size_vram)}</span>
                    </div>
                    <Progress
                      value={getMemoryUsagePercentage(model.size_vram, model.size)}
                      className="h-2"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {getMemoryUsagePercentage(model.size_vram, model.size)}% of {formatSize(model.size)} total
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                        <Memory className="w-4 h-4" />
                        <span>Total Size</span>
                      </div>
                      <p className="font-medium dark:text-white">{formatSize(model.size)}</p>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>Expires In</span>
                      </div>
                      <p className="font-medium dark:text-white">{formatTimeUntilExpiry(model.expires_at)}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t-2 border-gray-100 dark:border-gray-800">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-2 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => handleUnloadModel(model.name)}
                      disabled={isUnloading}
                    >
                      {isUnloading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Unloading...
                        </>
                      ) : (
                        <>
                          <Square className="w-4 h-4 mr-2" />
                          Unload Model
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* System Resource Overview */}
      <Card className="p-6 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <h2 className="text-xl font-bold dark:text-white mb-4">System Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-black dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <Cpu className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-bold dark:text-white">Active Models</h3>
            <p className="text-2xl font-bold dark:text-white">{runningModels.length}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Currently loaded</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-black dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <Memory className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-bold dark:text-white">Memory Usage</h3>
            <p className="text-2xl font-bold dark:text-white">
              {formatSize(runningModels.reduce((acc, model) => acc + model.size_vram, 0))}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">VRAM allocated</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-black dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-bold dark:text-white">Status</h3>
            <p className={`text-2xl font-bold ${hasError ? 'text-red-600' : 'text-green-600'}`}>
              {hasError ? 'Error' : 'Active'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Service status</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
