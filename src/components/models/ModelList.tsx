import React, { useState, useEffect } from 'react';
import { OllamaModel } from '@/types/ollama';
import { ModelCard } from './ModelCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { RefreshCw, Search, Plus, Download } from 'lucide-react';
import { ollamaService } from '@/services/ollama';
import { useToast } from '@/hooks/use-toast';

export function ModelList() {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [filteredModels, setFilteredModels] = useState<OllamaModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pullModel, setPullModel] = useState('');
  const [isPulling, setIsPulling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    const filtered = models.filter(model =>
      model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.details.family.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredModels(filtered);
  }, [models, searchTerm]);

  const loadModels = async () => {
    setIsLoading(true);
    try {
      const modelList = await ollamaService.getModels();
      setModels(modelList);
    } catch (error) {
      toast({
        title: "Error loading models",
        description: "Failed to fetch models from Ollama. Make sure Ollama is running.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePullModel = async () => {
    if (!pullModel.trim()) return;

    setIsPulling(true);
    try {
      await ollamaService.pullModel(pullModel.trim());
      toast({
        title: "Model downloaded",
        description: `Successfully downloaded ${pullModel}`,
      });
      setPullModel('');
      loadModels();
    } catch (error) {
      toast({
        title: "Error downloading model",
        description: "Failed to download the model. Please check the model name.",
        variant: "destructive",
      });
    } finally {
      setIsPulling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-black">Installed Models</h2>
        <Button 
          onClick={loadModels}
          variant="outline"
          className="border-2 border-black hover:bg-black hover:text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card className="p-4 border-4 border-black bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search models..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-2 border-black"
            />
          </div>
          <div className="flex space-x-2">
            <Input
              placeholder="Model name to download (e.g., llama3.2)"
              value={pullModel}
              onChange={(e) => setPullModel(e.target.value)}
              className="border-2 border-black"
              onKeyPress={(e) => e.key === 'Enter' && handlePullModel()}
            />
            <Button
              onClick={handlePullModel}
              disabled={isPulling}
              className="bg-black text-white hover:bg-gray-800 border-2 border-black"
            >
              <Download className="w-4 h-4 mr-2" />
              {isPulling ? 'Downloading...' : 'Pull'}
            </Button>
          </div>
        </div>
      </Card>

      {filteredModels.length === 0 ? (
        <Card className="p-8 border-4 border-black bg-white text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto">
              <Plus className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-black">No Models Found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'No models match your search criteria.' : 'Download a model to get started.'}
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setPullModel('llama3.2')}
                className="bg-black text-white hover:bg-gray-800 border-2 border-black"
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
              onModelDeleted={loadModels}
              onModelCopied={loadModels}
            />
          ))}
        </div>
      )}
    </div>
  );
}