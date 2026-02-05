import { useState, useEffect, useMemo } from 'react';
import { ModelCard } from './ModelCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { RefreshCw, Search, Plus, Download, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useModelsStore } from '@/stores/models-store';
import { useConnectionStore } from '@/stores/connection-store';
import { useActivityStore } from '@/stores/activity-store';
import { ConnectionStatus } from '@/components/ConnectionStatus';

export function ModelList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [pullModelName, setPullModelName] = useState('');
  const { toast } = useToast();
  
  // Use stores
  const { 
    models, 
    isLoading, 
    isPulling,
    pullProgress,
    fetchModels, 
    pullModel,
    deleteModel 
  } = useModelsStore();
  const { status } = useConnectionStore();
  const { addActivity } = useActivityStore();

  const hasError = status === 'error' || status === 'disconnected';

  // Filter models based on search
  const filteredModels = useMemo(() => {
    if (!searchTerm.trim()) return models;
    const term = searchTerm.toLowerCase();
    return models.filter(model =>
      model.name.toLowerCase().includes(term) ||
      model.details?.family?.toLowerCase().includes(term)
    );
  }, [models, searchTerm]);

  // Load models on mount
  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const handlePullModel = async () => {
    const modelName = pullModelName.trim();
    if (!modelName) {
      toast({
        title: "Missing model name",
        description: "Please enter a model name to download.",
        variant: "destructive",
      });
      return;
    }

    try {
      await pullModel(modelName);
      toast({
        title: "Model downloaded",
        description: `Successfully downloaded ${modelName}`,
      });
      addActivity({
        type: 'model_downloaded',
        title: `Downloaded ${modelName}`,
        description: `Model ${modelName} has been downloaded successfully`,
      });
      setPullModelName('');
    } catch (error) {
      toast({
        title: "Error downloading model",
        description: error instanceof Error ? error.message : "Failed to download the model.",
        variant: "destructive",
      });
      addActivity({
        type: 'error',
        title: `Failed to download ${modelName}`,
        description: error instanceof Error ? error.message : "Download failed",
      });
    }
  };

  const handleDeleteModel = async (modelName: string) => {
    try {
      await deleteModel(modelName);
      toast({
        title: "Model deleted",
        description: `Successfully deleted ${modelName}`,
      });
      addActivity({
        type: 'model_deleted',
        title: `Deleted ${modelName}`,
        description: `Model ${modelName} has been removed`,
      });
    } catch (error) {
      toast({
        title: "Error deleting model",
        description: error instanceof Error ? error.message : "Failed to delete the model.",
        variant: "destructive",
      });
    }
  };

  if (isLoading && models.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-black dark:text-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black dark:text-white">Installed Models</h2>
          <p className="text-gray-600 dark:text-gray-400">{models.length} models available</p>
        </div>
        <div className="flex items-center gap-3">
          <ConnectionStatus />
          <Button 
            onClick={() => fetchModels()}
            variant="outline"
            disabled={isLoading}
            className="border-2 border-black dark:border-gray-600 hover:bg-black hover:text-white dark:hover:bg-gray-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {hasError && (
        <Card className="p-4 border-4 border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div className="flex-1">
              <p className="text-sm text-red-800 dark:text-red-200">Unable to connect to Ollama service</p>
              <p className="text-xs text-red-600 dark:text-red-400">Make sure Ollama is running on localhost:11434</p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-4 border-4 border-black dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search models..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-2 border-black dark:border-gray-600"
            />
          </div>
          <div className="flex space-x-2">
            <Input
              placeholder="Model name to download (e.g., llama3.2)"
              value={pullModelName}
              onChange={(e) => setPullModelName(e.target.value)}
              className="border-2 border-black dark:border-gray-600"
              onKeyPress={(e) => e.key === 'Enter' && handlePullModel()}
              disabled={isPulling}
            />
            <Button
              onClick={handlePullModel}
              disabled={isPulling || hasError}
              className="bg-black dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600 border-2 border-black dark:border-gray-600"
            >
              <Download className="w-4 h-4 mr-2" />
              {isPulling ? 'Pulling...' : 'Pull'}
            </Button>
          </div>
        </div>
        
        {/* Pull Progress */}
        {isPulling && pullProgress && (
          <div className="mt-4 p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-black dark:text-white">
                {pullProgress.status}
              </span>
              {pullProgress.completed && pullProgress.total && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {Math.round((pullProgress.completed / pullProgress.total) * 100)}%
                </span>
              )}
            </div>
            {pullProgress.completed && pullProgress.total && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-black dark:bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(pullProgress.completed / pullProgress.total) * 100}%` }}
                />
              </div>
            )}
          </div>
        )}
      </Card>

      {filteredModels.length === 0 ? (
        <Card className="p-8 border-4 border-black dark:border-gray-700 bg-white dark:bg-gray-900 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-black dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto">
              <Plus className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-black dark:text-white">No Models Found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm ? 'No models match your search criteria.' : 'Download a model to get started.'}
            </p>
            {!searchTerm && !hasError && (
              <Button 
                onClick={() => setPullModelName('llama3.2')}
                className="bg-black dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600 border-2 border-black dark:border-gray-600"
              >
                <Download className="w-4 h-4 mr-2" />
                Download llama3.2
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModels.map((model) => (
            <ModelCard
              key={model.name}
              model={model}
              onModelDeleted={() => handleDeleteModel(model.name)}
              onModelCopied={() => fetchModels()}
            />
          ))}
        </div>
      )}
    </div>
  );
}