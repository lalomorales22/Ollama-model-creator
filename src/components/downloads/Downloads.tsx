import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  Search, 
  Star, 
  Clock, 
  HardDrive,
  CheckCircle,
  AlertCircle,
  Trash2,
  RefreshCw,
  ExternalLink,
  Globe,
  Package
} from 'lucide-react';
import { ollamaService } from '@/services/ollama';
import { useToast } from '@/hooks/use-toast';

interface ModelDownload {
  id: string;
  name: string;
  description: string;
  size: string;
  tags: string[];
  downloads: number;
  status: 'available' | 'downloading' | 'completed' | 'error';
  progress?: number;
}

export function Downloads() {
  const [searchTerm, setSearchTerm] = useState('');
  const [downloads, setDownloads] = useState<ModelDownload[]>([]);
  const [pullModelName, setPullModelName] = useState('');
  const [isPulling, setIsPulling] = useState(false);
  const [availableModels] = useState<ModelDownload[]>([
    {
      id: 'llama3.2',
      name: 'Llama 3.2',
      description: 'Meta\'s latest large language model with improved reasoning capabilities',
      size: '2.0GB',
      tags: ['general', 'reasoning', 'chat'],
      downloads: 1250000,
      status: 'available'
    },
    {
      id: 'llama3.1',
      name: 'Llama 3.1',
      description: 'Previous version of Meta\'s Llama model series',
      size: '4.7GB',
      tags: ['general', 'chat', 'assistant'],
      downloads: 980000,
      status: 'available'
    },
    {
      id: 'mistral',
      name: 'Mistral 7B',
      description: 'Efficient 7B parameter model with strong performance',
      size: '4.1GB',
      tags: ['efficient', 'general', 'multilingual'],
      downloads: 750000,
      status: 'available'
    },
    {
      id: 'codellama',
      name: 'Code Llama',
      description: 'Specialized model for code generation and programming tasks',
      size: '3.8GB',
      tags: ['coding', 'programming', 'development'],
      downloads: 650000,
      status: 'available'
    },
    {
      id: 'gemma2',
      name: 'Gemma 2',
      description: 'Google\'s open-source language model with strong performance',
      size: '5.4GB',
      tags: ['google', 'general', 'research'],
      downloads: 420000,
      status: 'available'
    },
    {
      id: 'phi3',
      name: 'Phi-3',
      description: 'Microsoft\'s small but capable language model',
      size: '2.3GB',
      tags: ['microsoft', 'efficient', 'small'],
      downloads: 380000,
      status: 'available'
    },
    {
      id: 'llava',
      name: 'LLaVA',
      description: 'Large Language and Vision Assistant for multimodal tasks',
      size: '4.5GB',
      tags: ['vision', 'multimodal', 'image'],
      downloads: 290000,
      status: 'available'
    },
    {
      id: 'neural-chat',
      name: 'Neural Chat',
      description: 'Fine-tuned model optimized for conversational AI',
      size: '3.2GB',
      tags: ['chat', 'conversation', 'assistant'],
      downloads: 180000,
      status: 'available'
    }
  ]);

  const { toast } = useToast();

  const filteredModels = availableModels.filter(model =>
    model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDownload = async (modelId: string) => {
    const model = availableModels.find(m => m.id === modelId);
    if (!model) return;

    // Add to downloads with downloading status
    const downloadItem: ModelDownload = {
      ...model,
      status: 'downloading',
      progress: 0
    };

    setDownloads(prev => [...prev, downloadItem]);

    try {
      // Simulate download progress
      const progressInterval = setInterval(() => {
        setDownloads(prev => prev.map(d => 
          d.id === modelId && d.status === 'downloading'
            ? { ...d, progress: Math.min((d.progress || 0) + Math.random() * 15, 95) }
            : d
        ));
      }, 1000);

      await ollamaService.pullModel(modelId);
      
      clearInterval(progressInterval);
      
      // Mark as completed
      setDownloads(prev => prev.map(d => 
        d.id === modelId 
          ? { ...d, status: 'completed', progress: 100 }
          : d
      ));

      toast({
        title: "Download Complete",
        description: `${model.name} has been successfully downloaded and is ready to use.`,
      });

    } catch (error) {
      // Mark as error
      setDownloads(prev => prev.map(d => 
        d.id === modelId 
          ? { ...d, status: 'error', progress: 0 }
          : d
      ));

      toast({
        title: "Download Failed",
        description: `Failed to download ${model.name}. Please check your connection and try again.`,
        variant: "destructive",
      });
    }
  };

  const handlePullModel = async () => {
    if (!pullModelName.trim()) return;

    setIsPulling(true);
    try {
      await ollamaService.pullModel(pullModelName.trim());
      toast({
        title: "Model Downloaded",
        description: `Successfully downloaded ${pullModelName}`,
      });
      setPullModelName('');
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the model. Please check the model name and try again.",
        variant: "destructive",
      });
    } finally {
      setIsPulling(false);
    }
  };

  const handleCancelDownload = (modelId: string) => {
    setDownloads(prev => prev.filter(d => d.id !== modelId));
    toast({
      title: "Download Cancelled",
      description: "The download has been cancelled.",
    });
  };

  const handleRetryDownload = (modelId: string) => {
    setDownloads(prev => prev.filter(d => d.id !== modelId));
    handleDownload(modelId);
  };

  const formatDownloads = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black mb-2">Model Downloads</h1>
        <p className="text-gray-600">Browse and download models from the Ollama library</p>
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-3 border-4 border-black bg-white">
          <TabsTrigger 
            value="browse" 
            className="data-[state=active]:bg-black data-[state=active]:text-white border-2 border-black"
          >
            <Globe className="w-4 h-4 mr-2" />
            Browse Online
          </TabsTrigger>
          <TabsTrigger 
            value="quick" 
            className="data-[state=active]:bg-black data-[state=active]:text-white border-2 border-black"
          >
            <Package className="w-4 h-4 mr-2" />
            Quick Download
          </TabsTrigger>
          <TabsTrigger 
            value="popular" 
            className="data-[state=active]:bg-black data-[state=active]:text-white border-2 border-black"
          >
            <Star className="w-4 h-4 mr-2" />
            Popular Models
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          <Card className="p-6 border-4 border-black bg-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-black">Ollama Model Library</h2>
                <p className="text-gray-600">Browse the complete collection of available models</p>
              </div>
              <Button
                onClick={() => window.open('https://ollama.com/search', '_blank')}
                className="bg-black text-white hover:bg-gray-800 border-2 border-black"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Browse Ollama Library
              </Button>
            </div>
            
            <div className="text-center space-y-4 py-12">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black">Visit Ollama Model Library</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Browse thousands of pre-trained models, from general purpose chatbots to specialized tools for coding, writing, and analysis.
              </p>
              <Button
                onClick={() => window.open('https://ollama.com/search', '_blank')}
                className="bg-black text-white hover:bg-gray-800 border-2 border-black"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Ollama Library
              </Button>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
              <h3 className="font-bold text-black mb-2">How to Download Models:</h3>
              <ol className="text-sm text-gray-700 space-y-1">
                <li>1. <strong>Browse:</strong> Click "Open Ollama Library" above to explore available models</li>
                <li>2. <strong>Find:</strong> Look for models that suit your needs (chat, coding, analysis, etc.)</li>
                <li>3. <strong>Copy:</strong> Note the model name (e.g., "llama3.2", "mistral", "codellama")</li>
                <li>4. <strong>Download:</strong> Use the "Quick Download" tab to download it locally</li>
                <li>5. <strong>CLI Alternative:</strong> Or use the command: <code className="bg-gray-200 px-1 rounded">ollama pull model-name</code></li>
              </ol>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="quick" className="space-y-6">
          {/* Quick Download */}
          <Card className="p-6 border-4 border-black bg-white">
            <h2 className="text-xl font-bold text-black mb-4">Quick Download</h2>
            <div className="flex space-x-4">
              <Input
                placeholder="Enter model name (e.g., llama3.2, mistral, codellama)"
                value={pullModelName}
                onChange={(e) => setPullModelName(e.target.value)}
                className="flex-1 border-2 border-black"
                onKeyPress={(e) => e.key === 'Enter' && handlePullModel()}
              />
              <Button
                onClick={handlePullModel}
                disabled={isPulling || !pullModelName.trim()}
                className="bg-black text-white hover:bg-gray-800 border-2 border-black"
              >
                <Download className="w-4 h-4 mr-2" />
                {isPulling ? 'Downloading...' : 'Download'}
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Enter the exact model name from the Ollama library. Common examples: llama3.2, mistral, codellama, gemma2
            </p>
          </Card>

          {/* Active Downloads */}
          {downloads.length > 0 && (
            <Card className="p-6 border-4 border-black bg-white">
              <h2 className="text-xl font-bold text-black mb-4">Active Downloads</h2>
              <div className="space-y-4">
                {downloads.map((download) => (
                  <div key={download.id} className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-black">{download.name}</h3>
                        <div className="flex items-center space-x-2">
                          {download.status === 'downloading' && (
                            <span className="text-sm text-gray-600">{Math.round(download.progress || 0)}%</span>
                          )}
                          <Badge 
                            variant="outline" 
                            className={`${
                              download.status === 'completed' ? 'border-green-500 text-green-700 bg-green-50' :
                              download.status === 'error' ? 'border-red-500 text-red-700 bg-red-50' :
                              'border-blue-500 text-blue-700 bg-blue-50'
                            }`}
                          >
                            {download.status === 'downloading' ? 'Downloading' :
                             download.status === 'completed' ? 'Completed' :
                             download.status === 'error' ? 'Failed' : 'Unknown'}
                          </Badge>
                        </div>
                      </div>
                      
                      {download.status === 'downloading' && (
                        <Progress value={download.progress || 0} className="mb-2" />
                      )}
                      
                      <p className="text-sm text-gray-600">{download.size}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {download.status === 'downloading' && (
                        <Button
                          onClick={() => handleCancelDownload(download.id)}
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {download.status === 'error' && (
                        <Button
                          onClick={() => handleRetryDownload(download.id)}
                          size="sm"
                          variant="outline"
                          className="border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {download.status === 'completed' && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      
                      {download.status === 'error' && (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="popular" className="space-y-6">
          {/* Search */}
          <Card className="p-4 border-4 border-black bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search popular models by name, description, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-2 border-black"
              />
            </div>
          </Card>

          {/* Popular Models */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModels.map((model) => {
              const isDownloading = downloads.some(d => d.id === model.id && d.status === 'downloading');
              const isCompleted = downloads.some(d => d.id === model.id && d.status === 'completed');
              
              return (
                <Card key={model.id} className="p-6 border-4 border-black bg-white hover:shadow-lg transition-shadow">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-bold text-black">{model.name}</h3>
                        <div className="flex items-center space-x-1 text-yellow-500">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm text-gray-600">{formatDownloads(model.downloads)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{model.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {model.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs border-gray-300">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <HardDrive className="w-4 h-4" />
                        <span>{model.size}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatDownloads(model.downloads)} downloads</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleDownload(model.id)}
                      disabled={isDownloading || isCompleted}
                      className={`w-full border-2 border-black ${
                        isCompleted 
                          ? 'bg-green-600 text-white hover:bg-green-700' 
                          : 'bg-black text-white hover:bg-gray-800'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Downloaded
                        </>
                      ) : isDownloading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Downloading...
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
              );
            })}
          </div>

          {filteredModels.length === 0 && (
            <Card className="p-8 border-4 border-black bg-white text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-black">No Models Found</h3>
                <p className="text-gray-600">
                  No models match your search criteria. Try adjusting your search terms.
                </p>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}