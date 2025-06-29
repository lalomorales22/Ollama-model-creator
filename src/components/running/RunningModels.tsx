import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Cpu, MemoryStick as Memory, Clock, RefreshCw, Square, Play, AlertCircle, Activity } from 'lucide-react';
import { ollamaService } from '@/services/ollama';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  useEffect(() => {
    loadRunningModels();
    const interval = setInterval(loadRunningModels, 5000); // Refresh every 5 seconds
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
      toast({
        title: "Connection Error",
        description: "Failed to load running models. Please ensure Ollama is running.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTimeUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const getMemoryUsagePercentage = (sizeVram: number, totalSize: number) => {
    if (totalSize === 0) return 0;
    return Math.round((sizeVram / totalSize) * 100);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Running Models</h1>
          <p className="text-gray-600">Loading running models...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6 border-4 border-black bg-white animate-pulse">
              <div className="h-32 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-black mb-2">Running Models</h1>
          <p className="text-gray-600">Monitor and manage currently loaded models</p>
        </div>
        <Button 
          onClick={loadRunningModels}
          variant="outline"
          className="border-2 border-black hover:bg-black hover:text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {hasError && (
        <Card className="p-6 border-4 border-red-300 bg-red-50">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-bold text-red-800">Connection Error</h3>
              <p className="text-sm text-red-600">Unable to connect to Ollama service. Make sure it's running on localhost:11434</p>
            </div>
            <Button 
              onClick={loadRunningModels}
              size="sm"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100 ml-auto"
            >
              Retry
            </Button>
          </div>
        </Card>
      )}

      {runningModels.length === 0 && !hasError ? (
        <Card className="p-8 border-4 border-black bg-white text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
              <Cpu className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-black">No Models Running</h3>
            <p className="text-gray-600">
              No models are currently loaded in memory. Models will appear here when they're being used.
            </p>
            <Button 
              onClick={() => window.location.href = '/models'}
              className="bg-black text-white hover:bg-gray-800 border-2 border-black"
            >
              <Play className="w-4 h-4 mr-2" />
              View Available Models
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {runningModels.map((model, index) => (
            <Card key={`${model.name}-${index}`} className="p-6 border-4 border-black bg-white">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-black">{model.name}</h3>
                    <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
                      Running
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Memory Usage</span>
                    <span className="font-medium">{formatSize(model.size_vram)}</span>
                  </div>
                  <Progress 
                    value={getMemoryUsagePercentage(model.size_vram, model.size)} 
                    className="h-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {getMemoryUsagePercentage(model.size_vram, model.size)}% of model size
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Memory className="w-4 h-4" />
                      <span>Total Size</span>
                    </div>
                    <p className="font-medium text-black">{formatSize(model.size)}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Expires In</span>
                    </div>
                    <p className="font-medium text-black">{formatTimeUntilExpiry(model.expires_at)}</p>
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-gray-100">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-2 border-red-300 text-red-700 hover:bg-red-50"
                    onClick={() => {
                      toast({
                        title: "Model Management",
                        description: "Model unloading will be implemented in a future update.",
                      });
                    }}
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Unload Model
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* System Resource Overview */}
      <Card className="p-6 border-4 border-black bg-white">
        <h2 className="text-xl font-bold text-black mb-4">System Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-3">
              <Cpu className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-bold text-black">Active Models</h3>
            <p className="text-2xl font-bold text-black">{runningModels.length}</p>
            <p className="text-sm text-gray-600">Currently loaded</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-3">
              <Memory className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-bold text-black">Memory Usage</h3>
            <p className="text-2xl font-bold text-black">
              {formatSize(runningModels.reduce((acc, model) => acc + model.size_vram, 0))}
            </p>
            <p className="text-sm text-gray-600">VRAM allocated</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-bold text-black">Status</h3>
            <p className="text-2xl font-bold text-green-600">
              {hasError ? 'Error' : 'Active'}
            </p>
            <p className="text-sm text-gray-600">Service status</p>
          </div>
        </div>
      </Card>
    </div>
  );
}