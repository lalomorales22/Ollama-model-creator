import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Cpu, 
  FileText, 
  Settings, 
  Play, 
  CheckCircle, 
  AlertCircle,
  Sparkles,
  Brain,
  RefreshCw
} from 'lucide-react';
import { ollamaService } from '@/services/ollama';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';
import { ModelFile, OllamaModel } from '@/types/ollama';

interface ModelCreationStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

export function CreateModel() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [creationProgress, setCreationProgress] = useState(0);
  const [availableModels, setAvailableModels] = useState<OllamaModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelConfig, setModelConfig] = useState({
    name: '',
    baseModel: 'llama3.2',
    systemPrompt: '',
    temperature: '0.8',
    maxTokens: '2048',
    topP: '0.9',
    topK: '40',
    repeatPenalty: '1.1'
  });
  
  const { toast } = useToast();
  const location = useLocation();

  const steps: ModelCreationStep[] = [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Set up your model name and base configuration',
      completed: false,
      current: true
    },
    {
      id: 'parameters',
      title: 'Model Parameters',
      description: 'Configure generation parameters and behavior',
      completed: false,
      current: false
    },
    {
      id: 'system',
      title: 'System Prompt',
      description: 'Define the personality and behavior of your model',
      completed: false,
      current: false
    },
    {
      id: 'review',
      title: 'Review & Create',
      description: 'Review your configuration and create the model',
      completed: false,
      current: false
    }
  ];

  const [stepsState, setStepsState] = useState(steps);

  useEffect(() => {
    loadAvailableModels();
    loadDefaultSettings();
  }, []);

  const loadDefaultSettings = () => {
    try {
      const saved = localStorage.getItem('ollama-app-settings');
      if (saved) {
        const settings = JSON.parse(saved);
        if (settings.defaultModel) {
          setModelConfig(prev => ({ ...prev, baseModel: settings.defaultModel }));
        }
        if (settings.defaultTemperature) {
          setModelConfig(prev => ({ ...prev, temperature: settings.defaultTemperature.toString() }));
        }
        if (settings.defaultContextLength) {
          setModelConfig(prev => ({ ...prev, maxTokens: settings.defaultContextLength.toString() }));
        }
      }
    } catch (error) {
      console.error('Error loading default settings:', error);
    }
  };

  const loadAvailableModels = async () => {
    setIsLoadingModels(true);
    try {
      const models = await ollamaService.getModels();
      setAvailableModels(models);
      
      // If no models are available, show a warning
      if (models.length === 0) {
        toast({
          title: "No Models Found",
          description: "No Ollama models are installed. Please download a base model first.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading models:', error);
      toast({
        title: "Connection Error",
        description: "Failed to load available models. Make sure Ollama is running.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Check if we're coming from ModelFiles with pre-filled data
  useEffect(() => {
    if (location.state?.modelFile) {
      const modelFile: ModelFile = location.state.modelFile;
      
      // Parse the ModelFile content to extract configuration
      const content = modelFile.content;
      
      // Extract base model
      const baseModelMatch = content.match(/FROM\s+([^\s\n]+)/i);
      const baseModel = baseModelMatch ? baseModelMatch[1] : 'llama3.2';
      
      // Extract parameters
      const tempMatch = content.match(/PARAMETER\s+temperature\s+([^\s\n]+)/i);
      const ctxMatch = content.match(/PARAMETER\s+num_ctx\s+([^\s\n]+)/i);
      const topPMatch = content.match(/PARAMETER\s+top_p\s+([^\s\n]+)/i);
      const topKMatch = content.match(/PARAMETER\s+top_k\s+([^\s\n]+)/i);
      const repeatMatch = content.match(/PARAMETER\s+repeat_penalty\s+([^\s\n]+)/i);
      
      // Extract system prompt
      const systemMatch = content.match(/SYSTEM\s+["']([^"']*)/i);
      const systemPrompt = systemMatch ? systemMatch[1] : modelFile.system || '';
      
      setModelConfig({
        name: `${modelFile.name}-model`,
        baseModel,
        systemPrompt,
        temperature: tempMatch ? tempMatch[1] : '0.8',
        maxTokens: ctxMatch ? ctxMatch[1] : '2048',
        topP: topPMatch ? topPMatch[1] : '0.9',
        topK: topKMatch ? topKMatch[1] : '40',
        repeatPenalty: repeatMatch ? repeatMatch[1] : '1.1'
      });

      toast({
        title: "ModelFile Loaded",
        description: `Configuration loaded from "${modelFile.name}". You can modify it before creating the model.`,
      });
    }
  }, [location.state, toast]);

  const updateStep = (stepIndex: number, updates: Partial<ModelCreationStep>) => {
    setStepsState(prev => prev.map((step, index) => 
      index === stepIndex ? { ...step, ...updates } : step
    ));
  };

  const nextStep = () => {
    if (currentStep < stepsState.length - 1) {
      updateStep(currentStep, { completed: true, current: false });
      updateStep(currentStep + 1, { current: true });
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      updateStep(currentStep, { current: false });
      updateStep(currentStep - 1, { current: true, completed: false });
      setCurrentStep(currentStep - 1);
    }
  };

  const generateModelFile = () => {
    return `FROM ${modelConfig.baseModel}

# Model parameters
PARAMETER temperature ${modelConfig.temperature}
PARAMETER num_ctx ${modelConfig.maxTokens}
PARAMETER top_p ${modelConfig.topP}
PARAMETER top_k ${modelConfig.topK}
PARAMETER repeat_penalty ${modelConfig.repeatPenalty}

# System message
SYSTEM """${modelConfig.systemPrompt || 'You are a helpful AI assistant.'}"""`;
  };

  const createModel = async () => {
    if (!modelConfig.name.trim()) {
      toast({
        title: "Error",
        description: "Please provide a model name",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    setCreationProgress(0);

    try {
      const modelFile = generateModelFile();
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setCreationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      await ollamaService.createModel(modelConfig.name, modelFile);
      
      clearInterval(progressInterval);
      setCreationProgress(100);
      
      toast({
        title: "Model Created Successfully",
        description: `Your model "${modelConfig.name}" has been created and is ready to use.`,
      });

      // Reset form
      setTimeout(() => {
        setIsCreating(false);
        setCreationProgress(0);
        setCurrentStep(0);
        setStepsState(steps);
        setModelConfig({
          name: '',
          baseModel: 'llama3.2',
          systemPrompt: '',
          temperature: '0.8',
          maxTokens: '2048',
          topP: '0.9',
          topK: '40',
          repeatPenalty: '1.1'
        });
        loadDefaultSettings(); // Reload default settings
      }, 2000);

    } catch (error) {
      setIsCreating(false);
      setCreationProgress(0);
      toast({
        title: "Error Creating Model",
        description: "Failed to create the model. Please check your configuration and try again.",
        variant: "destructive",
      });
    }
  };

  const getModelOptions = () => {
    const fallbackModels = [
      { name: 'llama3.2', displayName: 'Llama 3.2' },
      { name: 'llama3.1', displayName: 'Llama 3.1' },
      { name: 'mistral', displayName: 'Mistral' },
      { name: 'codellama', displayName: 'Code Llama' },
      { name: 'gemma2', displayName: 'Gemma 2' },
    ];

    if (availableModels.length > 0) {
      return availableModels.map(model => ({
        name: model.name,
        displayName: model.name
      }));
    }

    return fallbackModels;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="modelName" className="text-sm font-medium text-black">Model Name</Label>
              <Input
                id="modelName"
                value={modelConfig.name}
                onChange={(e) => setModelConfig(prev => ({ ...prev, name: e.target.value }))}
                placeholder="my-custom-model"
                className="mt-2 border-2 border-black"
              />
              <p className="text-xs text-gray-500 mt-1">Choose a unique name for your model</p>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="baseModel" className="text-sm font-medium text-black">Base Model</Label>
                <Button
                  onClick={loadAvailableModels}
                  variant="outline"
                  size="sm"
                  disabled={isLoadingModels}
                  className="border-2 border-black hover:bg-black hover:text-white"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingModels ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <Select 
                value={modelConfig.baseModel} 
                onValueChange={(value) => setModelConfig(prev => ({ ...prev, baseModel: value }))}
              >
                <SelectTrigger className="mt-2 border-2 border-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getModelOptions().map((model) => (
                    <SelectItem key={model.name} value={model.name}>
                      {model.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Select the base model to build upon
                {availableModels.length === 0 && (
                  <span className="text-yellow-600"> • Showing fallback models (download models first)</span>
                )}
              </p>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="temperature" className="text-sm font-medium text-black">Temperature</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={modelConfig.temperature}
                  onChange={(e) => setModelConfig(prev => ({ ...prev, temperature: e.target.value }))}
                  className="mt-2 border-2 border-black"
                />
                <p className="text-xs text-gray-500 mt-1">Higher = more creative (0.1-2.0)</p>
              </div>
              
              <div>
                <Label htmlFor="maxTokens" className="text-sm font-medium text-black">Context Length</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  value={modelConfig.maxTokens}
                  onChange={(e) => setModelConfig(prev => ({ ...prev, maxTokens: e.target.value }))}
                  className="mt-2 border-2 border-black"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum context window size</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="topP" className="text-sm font-medium text-black">Top P</Label>
                <Input
                  id="topP"
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={modelConfig.topP}
                  onChange={(e) => setModelConfig(prev => ({ ...prev, topP: e.target.value }))}
                  className="mt-2 border-2 border-black"
                />
                <p className="text-xs text-gray-500 mt-1">Nucleus sampling (0.1-1.0)</p>
              </div>
              
              <div>
                <Label htmlFor="topK" className="text-sm font-medium text-black">Top K</Label>
                <Input
                  id="topK"
                  type="number"
                  value={modelConfig.topK}
                  onChange={(e) => setModelConfig(prev => ({ ...prev, topK: e.target.value }))}
                  className="mt-2 border-2 border-black"
                />
                <p className="text-xs text-gray-500 mt-1">Top-k sampling limit</p>
              </div>
            </div>

            <div>
              <Label htmlFor="repeatPenalty" className="text-sm font-medium text-black">Repeat Penalty</Label>
              <Input
                id="repeatPenalty"
                type="number"
                step="0.1"
                min="0.5"
                max="2"
                value={modelConfig.repeatPenalty}
                onChange={(e) => setModelConfig(prev => ({ ...prev, repeatPenalty: e.target.value }))}
                className="mt-2 border-2 border-black"
              />
              <p className="text-xs text-gray-500 mt-1">Penalty for repetition (0.5-2.0)</p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="systemPrompt" className="text-sm font-medium text-black">System Prompt</Label>
              <Textarea
                id="systemPrompt"
                value={modelConfig.systemPrompt}
                onChange={(e) => setModelConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
                placeholder="You are a helpful AI assistant specialized in..."
                className="mt-2 min-h-[200px] border-2 border-black"
              />
              <p className="text-xs text-gray-500 mt-1">Define the personality and behavior of your model</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => setModelConfig(prev => ({ ...prev, systemPrompt: "You are a helpful coding assistant. You provide clear, concise code examples and explanations. Always include comments in your code and suggest best practices." }))}
                variant="outline"
                className="border-2 border-black hover:bg-black hover:text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Coding Assistant
              </Button>
              <Button
                onClick={() => setModelConfig(prev => ({ ...prev, systemPrompt: "You are a creative writing assistant. You help users craft engaging stories, develop characters, and improve their writing style. You're encouraging and provide constructive feedback." }))}
                variant="outline"
                className="border-2 border-black hover:bg-black hover:text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Writing Helper
              </Button>
              <Button
                onClick={() => setModelConfig(prev => ({ ...prev, systemPrompt: "You are a technical documentation specialist. You create clear, accurate, and well-structured documentation. You focus on clarity, completeness, and user-friendliness." }))}
                variant="outline"
                className="border-2 border-black hover:bg-black hover:text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Documentation
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
              <h3 className="font-bold text-black mb-2">Model Configuration Summary</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Name:</strong> {modelConfig.name || 'Not set'}</div>
                <div><strong>Base Model:</strong> {modelConfig.baseModel}</div>
                <div><strong>Temperature:</strong> {modelConfig.temperature}</div>
                <div><strong>Context Length:</strong> {modelConfig.maxTokens}</div>
                <div><strong>Top P:</strong> {modelConfig.topP}</div>
                <div><strong>Top K:</strong> {modelConfig.topK}</div>
                <div><strong>Repeat Penalty:</strong> {modelConfig.repeatPenalty}</div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-black mb-2">Generated ModelFile</h3>
              <Textarea
                value={generateModelFile()}
                readOnly
                className="min-h-[200px] border-2 border-black font-mono text-sm bg-gray-50"
              />
            </div>

            {isCreating && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Brain className="w-5 h-5 animate-pulse" />
                  <span className="text-sm">Creating your model...</span>
                </div>
                <Progress value={creationProgress} className="w-full" />
                <p className="text-xs text-gray-500">This may take a few minutes depending on your system.</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black mb-2">Create Custom Model</h1>
        <p className="text-gray-600">Build a custom Ollama model with your own configuration</p>
        {location.state?.modelFile && (
          <div className="mt-2">
            <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
              Using ModelFile: {location.state.modelFile.name}
            </Badge>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Steps Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-4 border-4 border-black bg-white">
            <h2 className="font-bold text-black mb-4">Creation Steps</h2>
            <div className="space-y-3">
              {stepsState.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg border-2 ${
                    step.current
                      ? 'border-black bg-black text-white'
                      : step.completed
                      ? 'border-green-500 bg-green-50 text-green-800'
                      : 'border-gray-200 bg-gray-50 text-gray-600'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {step.completed ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : step.current ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-current"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-xs opacity-75">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card className="p-6 border-4 border-black bg-white">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-black mb-2">
                {stepsState[currentStep]?.title}
              </h2>
              <p className="text-gray-600">
                {stepsState[currentStep]?.description}
              </p>
            </div>

            {renderStepContent()}

            <div className="flex justify-between mt-8">
              <Button
                onClick={prevStep}
                disabled={currentStep === 0}
                variant="outline"
                className="border-2 border-black hover:bg-black hover:text-white"
              >
                Previous
              </Button>

              {currentStep === stepsState.length - 1 ? (
                <Button
                  onClick={createModel}
                  disabled={isCreating || !modelConfig.name.trim()}
                  className="bg-black text-white hover:bg-gray-800 border-2 border-black"
                >
                  {isCreating ? (
                    <>
                      <Brain className="w-4 h-4 mr-2 animate-pulse" />
                      Creating Model...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Create Model
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={nextStep}
                  className="bg-black text-white hover:bg-gray-800 border-2 border-black"
                >
                  Next
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}