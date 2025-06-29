import React, { useState } from 'react';
import { OllamaModel } from '@/types/ollama';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Copy, 
  Trash2, 
  Download, 
  Info,
  MoreVertical,
  Play,
  Pause
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ollamaService } from '@/services/ollama';
import { useToast } from '@/hooks/use-toast';

interface ModelCardProps {
  model: OllamaModel;
  onModelDeleted: () => void;
  onModelCopied: () => void;
}

export function ModelCard({ model, onModelDeleted, onModelCopied }: ModelCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const formatSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete model "${model.name}"?`)) {
      return;
    }

    setIsLoading(true);
    try {
      await ollamaService.deleteModel(model.name);
      toast({
        title: "Model deleted",
        description: `Successfully deleted ${model.name}`,
      });
      onModelDeleted();
    } catch (error) {
      toast({
        title: "Error deleting model",
        description: "Failed to delete the model. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    const newName = prompt(`Enter new name for copy of "${model.name}":`);
    if (!newName) return;

    setIsLoading(true);
    try {
      await ollamaService.copyModel(model.name, newName);
      toast({
        title: "Model copied",
        description: `Successfully copied to ${newName}`,
      });
      onModelCopied();
    } catch (error) {
      toast({
        title: "Error copying model",
        description: "Failed to copy the model. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowInfo = async () => {
    try {
      const info = await ollamaService.getModelInfo(model.name);
      console.log('Model info:', info);
      // You could open a modal here to display the model info
      toast({
        title: "Model info",
        description: "Model information logged to console",
      });
    } catch (error) {
      toast({
        title: "Error getting model info",
        description: "Failed to retrieve model information.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6 border-4 border-black bg-white hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-black">{model.name}</h3>
            <p className="text-sm text-gray-600">{model.details.family}</p>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="border-2 border-black hover:bg-black hover:text-white">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="border-2 border-black">
            <DropdownMenuItem onClick={handleShowInfo}>
              <Info className="w-4 h-4 mr-2" />
              Show Info
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopy}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Model
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Model
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Size:</span>
          <Badge variant="outline" className="border-black">
            {formatSize(model.size)}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Format:</span>
          <Badge variant="outline" className="border-black">
            {model.details.format}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Parameters:</span>
          <Badge variant="outline" className="border-black">
            {model.details.parameter_size}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Modified:</span>
          <span className="text-black">{formatDate(model.modified_at)}</span>
        </div>
      </div>

      <div className="flex space-x-2 mt-4">
        <Button 
          size="sm" 
          className="flex-1 bg-black text-white hover:bg-gray-800 border-2 border-black"
          disabled={isLoading}
        >
          <Play className="w-4 h-4 mr-2" />
          Use Model
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          className="border-2 border-black hover:bg-black hover:text-white"
          disabled={isLoading}
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}