import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Cpu,
  FileText,
  Play,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Brain,
  RefreshCw,
  XCircle,
  Download,
  ChevronDown,
  ChevronUp,
  Info,
  Plus,
  Trash2,
  Copy,
  Code,
  Scale,
  MessageSquare,
  Shield,
  Layers,
} from 'lucide-react';
import { ollamaService } from '@/services/ollama';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { OllamaModel } from '@/types/ollama';
import {
  ALL_PARAMETERS,
  MODELFILE_TEMPLATES,
  QUANTIZATION_OPTIONS,
  type ParameterDefinition,
} from '@/lib/constants';

interface ModelCreationStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
  current: boolean;
}

interface MessageEntry {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ModelConfig {
  name: string;
  baseModel: string;
  systemPrompt: string;
  template: string;
  adapter: string;
  license: string;
  messages: MessageEntry[];
  requires: string;
  quantize: string;
  parameters: Record<string, number | boolean | string>;
  stopSequences: string[];
}

const DEFAULT_CONFIG: ModelConfig = {
  name: '',
  baseModel: 'llama3.2',
  systemPrompt: '',
  template: '',
  adapter: '',
  license: '',
  messages: [],
  requires: '',
  quantize: '',
  parameters: {
    temperature: 0.8,
    top_p: 0.9,
    top_k: 40,
    num_ctx: 2048,
    repeat_penalty: 1.1,
  },
  stopSequences: [],
};

export function CreateModel() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [creationProgress, setCreationProgress] = useState(0);
  const [creationStatus, setCreationStatus] = useState('');
  const [availableModels, setAvailableModels] = useState<OllamaModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [showAdvancedParams, setShowAdvancedParams] = useState(false);
  const [modelConfig, setModelConfig] = useState<ModelConfig>(DEFAULT_CONFIG);
  const [newStopSeq, setNewStopSeq] = useState('');
  const [newMessage, setNewMessage] = useState<MessageEntry>({ role: 'user', content: '' });
  const [generatedModelFile, setGeneratedModelFile] = useState('');

  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const stepDefinitions: Omit<ModelCreationStep, 'completed' | 'current'>[] = [
    { id: 'basic', title: 'Base Model', description: 'Name and base model selection', icon: Cpu },
    { id: 'parameters', title: 'Parameters', description: 'Sampling, repetition, and generation settings', icon: Layers },
    { id: 'system', title: 'System & Template', description: 'System prompt, template, and conversation setup', icon: MessageSquare },
    { id: 'advanced', title: 'Advanced', description: 'Adapter, license, quantization, and requirements', icon: Shield },
    { id: 'review', title: 'Review & Create', description: 'Review your Modelfile and create the model', icon: Play },
  ];

  const [stepsState, setStepsState] = useState<ModelCreationStep[]>(
    stepDefinitions.map((step, i) => ({
      ...step,
      completed: false,
      current: i === 0,
    }))
  );

  useEffect(() => {
    loadAvailableModels();
    loadDefaultSettings();
  }, []);

  // Regenerate Modelfile whenever config changes
  useEffect(() => {
    setGeneratedModelFile(generateModelFile());
  }, [modelConfig]);

  const loadDefaultSettings = () => {
    try {
      const saved = localStorage.getItem('ollama-app-settings');
      if (saved) {
        const settings = JSON.parse(saved);
        if (settings.defaultModel) {
          setModelConfig(prev => ({ ...prev, baseModel: settings.defaultModel }));
        }
        if (settings.defaultTemperature) {
          setModelConfig(prev => ({
            ...prev,
            parameters: { ...prev.parameters, temperature: settings.defaultTemperature },
          }));
        }
        if (settings.defaultContextLength) {
          setModelConfig(prev => ({
            ...prev,
            parameters: { ...prev.parameters, num_ctx: settings.defaultContextLength },
          }));
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
      if (models.length === 0) {
        toast({
          title: 'No Models Found',
          description: 'No Ollama models are installed. Please download a base model first.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading models:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to load available models. Make sure Ollama is running.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Load ModelFile from navigation state
  useEffect(() => {
    if (location.state?.modelFile) {
      const modelFile = location.state.modelFile;
      const parsed = ollamaService.parseModelFile(modelFile.content);

      setModelConfig({
        name: `${modelFile.name}-model`,
        baseModel: parsed.from || 'llama3.2',
        systemPrompt: parsed.system || '',
        template: parsed.template || '',
        adapter: parsed.adapter || '',
        license: parsed.license || '',
        messages: parsed.messages as MessageEntry[],
        requires: parsed.requires || '',
        quantize: parsed.quantize || '',
        parameters: {
          temperature: 0.8,
          top_p: 0.9,
          top_k: 40,
          num_ctx: 2048,
          repeat_penalty: 1.1,
          ...parsed.parameters,
        },
        stopSequences: typeof parsed.parameters.stop === 'string' ? [parsed.parameters.stop] : [],
      });

      toast({
        title: 'ModelFile Loaded',
        description: `Configuration loaded from "${modelFile.name}". Modify as needed before creating.`,
      });
    }
  }, [location.state, toast]);

  // Load template
  const loadTemplate = (templateKey: string) => {
    const template = MODELFILE_TEMPLATES[templateKey as keyof typeof MODELFILE_TEMPLATES];
    if (!template) return;

    const parsed = ollamaService.parseModelFile(template.content);
    setModelConfig(prev => ({
      ...prev,
      systemPrompt: parsed.system || '',
      parameters: {
        ...prev.parameters,
        ...parsed.parameters,
      },
      messages: parsed.messages as MessageEntry[],
      stopSequences: typeof parsed.parameters.stop === 'string'
        ? [parsed.parameters.stop]
        : prev.stopSequences,
    }));
    toast({ title: 'Template Applied', description: `"${template.name}" template loaded.` });
  };

  const updateStep = (stepIndex: number, updates: Partial<ModelCreationStep>) => {
    setStepsState(prev =>
      prev.map((step, index) => (index === stepIndex ? { ...step, ...updates } : step))
    );
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

  const goToStep = (index: number) => {
    updateStep(currentStep, { current: false });
    updateStep(index, { current: true });
    setCurrentStep(index);
  };

  const updateParam = (key: string, value: number | boolean | string) => {
    setModelConfig(prev => ({
      ...prev,
      parameters: { ...prev.parameters, [key]: value },
    }));
  };

  const removeParam = (key: string) => {
    setModelConfig(prev => {
      const params = { ...prev.parameters };
      delete params[key];
      return { ...prev, parameters: params };
    });
  };

  const addStopSequence = () => {
    if (newStopSeq.trim() && !modelConfig.stopSequences.includes(newStopSeq.trim())) {
      setModelConfig(prev => ({
        ...prev,
        stopSequences: [...prev.stopSequences, newStopSeq.trim()],
      }));
      setNewStopSeq('');
    }
  };

  const removeStopSequence = (seq: string) => {
    setModelConfig(prev => ({
      ...prev,
      stopSequences: prev.stopSequences.filter(s => s !== seq),
    }));
  };

  const addMessage = () => {
    if (newMessage.content.trim()) {
      setModelConfig(prev => ({
        ...prev,
        messages: [...prev.messages, { ...newMessage, content: newMessage.content.trim() }],
      }));
      setNewMessage({ role: 'user', content: '' });
    }
  };

  const removeMessage = (index: number) => {
    setModelConfig(prev => ({
      ...prev,
      messages: prev.messages.filter((_, i) => i !== index),
    }));
  };

  const generateModelFile = (): string => {
    const lines: string[] = [];

    // FROM
    lines.push(`FROM ${modelConfig.baseModel.trim() || 'llama3.2'}`);
    lines.push('');

    // PARAMETERS
    const paramEntries = Object.entries(modelConfig.parameters).filter(
      ([_, value]) => value !== undefined && value !== ''
    );
    if (paramEntries.length > 0) {
      lines.push('# Parameters');
      for (const [key, value] of paramEntries) {
        lines.push(`PARAMETER ${key} ${value}`);
      }
      lines.push('');
    }

    // STOP sequences
    for (const stop of modelConfig.stopSequences) {
      lines.push(`PARAMETER stop "${stop}"`);
    }
    if (modelConfig.stopSequences.length > 0) lines.push('');

    // TEMPLATE
    if (modelConfig.template.trim()) {
      lines.push(`TEMPLATE """${modelConfig.template.trim()}"""`);
      lines.push('');
    }

    // SYSTEM
    if (modelConfig.systemPrompt.trim()) {
      lines.push(`SYSTEM """${modelConfig.systemPrompt.trim()}"""`);
      lines.push('');
    }

    // ADAPTER
    if (modelConfig.adapter.trim()) {
      lines.push(`ADAPTER ${modelConfig.adapter.trim()}`);
      lines.push('');
    }

    // LICENSE
    if (modelConfig.license.trim()) {
      lines.push(`LICENSE """${modelConfig.license.trim()}"""`);
      lines.push('');
    }

    // MESSAGE
    for (const msg of modelConfig.messages) {
      lines.push(`MESSAGE ${msg.role} ${msg.content}`);
    }
    if (modelConfig.messages.length > 0) lines.push('');

    // REQUIRES
    if (modelConfig.requires.trim()) {
      lines.push(`REQUIRES ${modelConfig.requires.trim()}`);
      lines.push('');
    }

    return lines.join('\n').trim();
  };

  const validateConfiguration = async (): Promise<boolean> => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!modelConfig.name.trim()) {
      errors.push('Model name is required');
    } else if (!/^[a-zA-Z0-9._:/-]+$/.test(modelConfig.name.trim())) {
      errors.push('Model name can only contain letters, numbers, dots, hyphens, underscores, colons, and slashes');
    }

    if (!modelConfig.baseModel.trim()) {
      errors.push('Base model is required');
    }

    // Validate the generated Modelfile
    const modelfile = generateModelFile();
    const validation = ollamaService.validateModelFile(modelfile);
    errors.push(...validation.errors);
    warnings.push(...validation.warnings);

    setValidationErrors(errors);
    setValidationWarnings(warnings);
    return errors.length === 0;
  };

  const createModel = async () => {
    const isValid = await validateConfiguration();
    if (!isValid) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the configuration errors before creating the model.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    setCreationProgress(0);
    setCreationStatus('Initializing model creation...');

    try {
      const modelfile = generateModelFile();
      await ollamaService.createModel(modelConfig.name.trim(), modelfile, (statusMessage: string) => {
        const status = statusMessage || 'Processing...';
        setCreationStatus(status);
        const sl = status.toLowerCase();
        if (sl.includes('pulling') || sl.includes('downloading')) setCreationProgress(20);
        else if (sl.includes('verifying') || sl.includes('verify')) setCreationProgress(40);
        else if (sl.includes('writing') || sl.includes('creating')) setCreationProgress(60);
        else if (sl.includes('using') || sl.includes('finalizing')) setCreationProgress(80);
        else if (sl.includes('success') || sl.includes('complete')) setCreationProgress(100);
        else {
          const percentMatch = status.match(/(\d+)%/);
          if (percentMatch) setCreationProgress(Math.min(parseInt(percentMatch[1]), 95));
        }
      });

      setCreationProgress(100);
      setCreationStatus('Model created successfully!');
      toast({
        title: 'Model Created Successfully',
        description: `Your model "${modelConfig.name}" has been created and is ready to use.`,
      });

      setTimeout(() => {
        navigate('/models');
      }, 2000);
    } catch (error: any) {
      setIsCreating(false);
      setCreationProgress(0);
      setCreationStatus('');
      toast({
        title: 'Error Creating Model',
        description: `Failed to create the model: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const copyModelFile = () => {
    navigator.clipboard.writeText(generatedModelFile);
    toast({ title: 'Copied', description: 'Modelfile copied to clipboard.' });
  };

  const getModelOptions = () => {
    if (availableModels.length > 0) {
      return availableModels.map(model => ({ name: model.name, displayName: model.name }));
    }
    return [
      { name: 'llama3.2', displayName: 'Llama 3.2' },
      { name: 'llama3.1', displayName: 'Llama 3.1' },
      { name: 'mistral', displayName: 'Mistral' },
      { name: 'codellama', displayName: 'Code Llama' },
      { name: 'gemma2', displayName: 'Gemma 2' },
    ];
  };

  const handleDownloadBaseModel = async () => {
    if (!modelConfig.baseModel) return;
    try {
      setIsLoadingModels(true);
      toast({ title: 'Downloading Model', description: `Starting download of ${modelConfig.baseModel}...` });
      await ollamaService.pullModel(modelConfig.baseModel);
      toast({ title: 'Model Downloaded', description: `${modelConfig.baseModel} has been downloaded successfully.` });
      await loadAvailableModels();
    } catch (error: any) {
      toast({ title: 'Download Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Get parameters by category
  const getParamsByCategory = (category: string, advancedOnly: boolean = false) => {
    return ALL_PARAMETERS.filter(
      p => p.category === category && (advancedOnly ? p.advanced : !p.advanced)
    );
  };

  const renderParamSlider = (param: ParameterDefinition) => {
    if (param.type === 'boolean') {
      return (
        <div key={param.key} className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium dark:text-gray-200">{param.label}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[250px]">
                {param.description}
              </TooltipContent>
            </Tooltip>
          </div>
          <Switch
            checked={modelConfig.parameters[param.key] as boolean ?? param.default as boolean}
            onCheckedChange={(checked) => updateParam(param.key, checked)}
          />
        </div>
      );
    }

    const value = modelConfig.parameters[param.key] as number ?? param.default as number;

    return (
      <div key={param.key} className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium dark:text-gray-200">{param.label}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[250px]">
                {param.description}
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            type="number"
            value={value}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) updateParam(param.key, v);
            }}
            className="w-24 h-7 text-sm border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            min={param.min}
            max={param.max}
            step={param.step}
          />
        </div>
        {param.min !== undefined && param.max !== undefined && (
          <Slider
            value={[value]}
            onValueChange={([v]) => updateParam(param.key, v)}
            min={param.min}
            max={param.max}
            step={param.step}
            className="cursor-pointer"
          />
        )}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Base Model
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="modelName" className="text-sm font-medium dark:text-gray-200">
                Model Name
              </Label>
              <Input
                id="modelName"
                value={modelConfig.name}
                onChange={(e) => setModelConfig(prev => ({ ...prev, name: e.target.value }))}
                placeholder="my-custom-model"
                className="mt-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Choose a unique name (letters, numbers, dots, hyphens, underscores, colons, slashes)
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="baseModel" className="text-sm font-medium dark:text-gray-200">
                  Base Model (FROM)
                </Label>
                <div className="flex space-x-2">
                  <Button
                    onClick={loadAvailableModels}
                    variant="outline"
                    size="sm"
                    disabled={isLoadingModels}
                    className="border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingModels ? 'animate-spin' : ''}`} />
                  </Button>
                  {modelConfig.baseModel &&
                    availableModels.length > 0 &&
                    !availableModels.some(m => m.name === modelConfig.baseModel) && (
                      <Button
                        onClick={handleDownloadBaseModel}
                        variant="outline"
                        size="sm"
                        disabled={isLoadingModels}
                        className="border-2 border-blue-500 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    )}
                </div>
              </div>
              <Select
                value={modelConfig.baseModel}
                onValueChange={(value) => setModelConfig(prev => ({ ...prev, baseModel: value }))}
              >
                <SelectTrigger className="mt-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getModelOptions().map(model => (
                    <SelectItem key={model.name} value={model.name}>
                      <div className="flex items-center justify-between w-full">
                        <span>{model.displayName}</span>
                        {availableModels.some(m => m.name === model.name) && (
                          <CheckCircle className="w-4 h-4 text-green-600 ml-2" />
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                The base model to build upon. Can also be a path to a GGUF file or Safetensors directory.
              </p>
            </div>

            {/* Quick Templates */}
            <div>
              <Label className="text-sm font-medium dark:text-gray-200 mb-2 block">
                Quick Start Templates
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(MODELFILE_TEMPLATES).map(([key, tmpl]) => (
                  <Button
                    key={key}
                    onClick={() => loadTemplate(key)}
                    variant="outline"
                    size="sm"
                    className="border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-left justify-start"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1.5 text-purple-500 flex-shrink-0" />
                    <span className="truncate text-xs">{tmpl.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 1: // Parameters
        return (
          <TooltipProvider>
            <div className="space-y-6">
              <Tabs defaultValue="sampling" className="w-full">
                <TabsList className="grid w-full grid-cols-4 border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <TabsTrigger value="sampling" className="text-xs data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-gray-700">
                    Sampling
                  </TabsTrigger>
                  <TabsTrigger value="repetition" className="text-xs data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-gray-700">
                    Repetition
                  </TabsTrigger>
                  <TabsTrigger value="generation" className="text-xs data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-gray-700">
                    Generation
                  </TabsTrigger>
                  <TabsTrigger value="performance" className="text-xs data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-gray-700">
                    Performance
                  </TabsTrigger>
                </TabsList>

                {['sampling', 'repetition', 'generation', 'performance'].map(category => (
                  <TabsContent key={category} value={category} className="space-y-4 pt-4">
                    {/* Core params for this category */}
                    {getParamsByCategory(category, false).map(renderParamSlider)}

                    {/* Advanced params (collapsible) */}
                    {getParamsByCategory(category, true).length > 0 && (
                      <Collapsible open={showAdvancedParams} onOpenChange={setShowAdvancedParams}>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-between hover:bg-gray-100 dark:hover:bg-gray-800 mt-2"
                          >
                            <span className="text-xs font-semibold text-gray-500">
                              Advanced {category} parameters
                            </span>
                            {showAdvancedParams ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-4 pt-2">
                          {getParamsByCategory(category, true).map(renderParamSlider)}
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </TabsContent>
                ))}

                {/* Mirostat tab shows when relevant */}
                <TabsContent value="sampling" className="space-y-4">
                  {(modelConfig.parameters.mirostat as number) > 0 && (
                    <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <p className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-3">
                        Mirostat Settings (active)
                      </p>
                      {ALL_PARAMETERS.filter(p => p.category === 'mirostat' && p.key !== 'mirostat').map(renderParamSlider)}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Stop Sequences */}
              <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Label className="text-sm font-medium dark:text-gray-200">Stop Sequences</Label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Sequences that will stop text generation when encountered.
                </p>
                <div className="flex gap-2">
                  <Input
                    value={newStopSeq}
                    onChange={(e) => setNewStopSeq(e.target.value)}
                    placeholder='e.g. <|eot_id|>'
                    className="flex-1 h-8 text-sm border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    onKeyDown={(e) => e.key === 'Enter' && addStopSequence()}
                  />
                  <Button variant="outline" size="sm" onClick={addStopSequence} disabled={!newStopSeq.trim()}
                    className="border-2 border-gray-300 dark:border-gray-600">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {modelConfig.stopSequences.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {modelConfig.stopSequences.map(seq => (
                      <Badge
                        key={seq}
                        variant="secondary"
                        className="cursor-pointer hover:bg-red-100 dark:hover:bg-red-900"
                        onClick={() => removeStopSequence(seq)}
                      >
                        <code className="text-xs">{seq}</code> <span className="ml-1">x</span>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TooltipProvider>
        );

      case 2: // System & Template
        return (
          <div className="space-y-6">
            {/* System Prompt */}
            <div>
              <Label className="text-sm font-medium dark:text-gray-200">
                System Prompt (SYSTEM)
              </Label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Define the personality, behavior, and constraints of your model.
              </p>
              <Textarea
                value={modelConfig.systemPrompt}
                onChange={(e) => setModelConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
                placeholder="You are a helpful AI assistant specialized in..."
                className="min-h-[150px] border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white font-mono text-sm"
              />
            </div>

            {/* Template */}
            <div>
              <Label className="text-sm font-medium dark:text-gray-200">
                Prompt Template (TEMPLATE) <Badge variant="outline" className="ml-1 text-xs">Optional</Badge>
              </Label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Go template for formatting prompts. Variables: {'{{ .System }}'}, {'{{ .Prompt }}'}, {'{{ .Response }}'}
              </p>
              <Textarea
                value={modelConfig.template}
                onChange={(e) => setModelConfig(prev => ({ ...prev, template: e.target.value }))}
                placeholder={'{{- if .System }}<|system|>\n{{ .System }}<|end|>\n{{- end }}\n<|user|>\n{{ .Prompt }}<|end|>\n<|assistant|>\n{{ .Response }}<|end|>'}
                className="min-h-[120px] border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white font-mono text-sm"
              />
            </div>

            {/* Preset Messages */}
            <div>
              <Label className="text-sm font-medium dark:text-gray-200">
                Preset Messages (MESSAGE) <Badge variant="outline" className="ml-1 text-xs">Optional</Badge>
              </Label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Example conversation history to prime the model's behavior.
              </p>

              {modelConfig.messages.length > 0 && (
                <div className="space-y-2 mb-3">
                  {modelConfig.messages.map((msg, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <Badge variant={msg.role === 'user' ? 'default' : 'secondary'} className="text-xs mt-0.5">
                        {msg.role}
                      </Badge>
                      <p className="flex-1 text-sm dark:text-gray-300">{msg.content}</p>
                      <Button variant="ghost" size="sm" onClick={() => removeMessage(i)} className="h-6 w-6 p-0">
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Select
                  value={newMessage.role}
                  onValueChange={(v) => setNewMessage(prev => ({ ...prev, role: v as MessageEntry['role'] }))}
                >
                  <SelectTrigger className="w-32 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">system</SelectItem>
                    <SelectItem value="user">user</SelectItem>
                    <SelectItem value="assistant">assistant</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={newMessage.content}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Message content..."
                  className="flex-1 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  onKeyDown={(e) => e.key === 'Enter' && addMessage()}
                />
                <Button variant="outline" size="sm" onClick={addMessage} disabled={!newMessage.content.trim()}
                  className="border-2 border-gray-300 dark:border-gray-600">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        );

      case 3: // Advanced
        return (
          <div className="space-y-6">
            {/* Adapter */}
            <div>
              <Label className="text-sm font-medium dark:text-gray-200">
                LoRA Adapter (ADAPTER) <Badge variant="outline" className="ml-1 text-xs">Optional</Badge>
              </Label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Path to a LoRA adapter file (Safetensors or GGUF format).
              </p>
              <Input
                value={modelConfig.adapter}
                onChange={(e) => setModelConfig(prev => ({ ...prev, adapter: e.target.value }))}
                placeholder="./my-adapter.gguf or /path/to/adapter"
                className="border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white font-mono text-sm"
              />
            </div>

            {/* Quantization */}
            <div>
              <Label className="text-sm font-medium dark:text-gray-200">
                Quantization <Badge variant="outline" className="ml-1 text-xs">Optional</Badge>
              </Label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Quantize the model during creation to reduce size and memory usage.
              </p>
              <Select
                value={modelConfig.quantize}
                onValueChange={(v) => setModelConfig(prev => ({ ...prev, quantize: v }))}
              >
                <SelectTrigger className="border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800">
                  <SelectValue placeholder="No quantization" />
                </SelectTrigger>
                <SelectContent>
                  {QUANTIZATION_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value || 'none'}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* License */}
            <div>
              <Label className="text-sm font-medium dark:text-gray-200">
                License (LICENSE) <Badge variant="outline" className="ml-1 text-xs">Optional</Badge>
              </Label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                License text or identifier for your custom model.
              </p>
              <Textarea
                value={modelConfig.license}
                onChange={(e) => setModelConfig(prev => ({ ...prev, license: e.target.value }))}
                placeholder="MIT License / Apache 2.0 / Custom license text..."
                className="min-h-[80px] border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white font-mono text-sm"
              />
            </div>

            {/* Requires */}
            <div>
              <Label className="text-sm font-medium dark:text-gray-200">
                Minimum Ollama Version (REQUIRES) <Badge variant="outline" className="ml-1 text-xs">Optional</Badge>
              </Label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Specify the minimum Ollama version required to run this model.
              </p>
              <Input
                value={modelConfig.requires}
                onChange={(e) => setModelConfig(prev => ({ ...prev, requires: e.target.value }))}
                placeholder="e.g. 0.14.0"
                className="border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
        );

      case 4: // Review & Create
        return (
          <div className="space-y-6">
            {/* Config Summary */}
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700">
              <h3 className="font-bold dark:text-white mb-3">Configuration Summary</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div><strong className="dark:text-gray-300">Name:</strong> <span className="dark:text-gray-400">{modelConfig.name || 'Not set'}</span></div>
                <div><strong className="dark:text-gray-300">Base Model:</strong> <span className="dark:text-gray-400">{modelConfig.baseModel}</span></div>
                <div><strong className="dark:text-gray-300">Parameters:</strong> <span className="dark:text-gray-400">{Object.keys(modelConfig.parameters).length} set</span></div>
                <div><strong className="dark:text-gray-300">Stop Sequences:</strong> <span className="dark:text-gray-400">{modelConfig.stopSequences.length}</span></div>
                <div><strong className="dark:text-gray-300">System Prompt:</strong> <span className="dark:text-gray-400">{modelConfig.systemPrompt ? 'Yes' : 'None'}</span></div>
                <div><strong className="dark:text-gray-300">Template:</strong> <span className="dark:text-gray-400">{modelConfig.template ? 'Custom' : 'Default'}</span></div>
                <div><strong className="dark:text-gray-300">Messages:</strong> <span className="dark:text-gray-400">{modelConfig.messages.length} preset</span></div>
                <div><strong className="dark:text-gray-300">Adapter:</strong> <span className="dark:text-gray-400">{modelConfig.adapter || 'None'}</span></div>
                <div><strong className="dark:text-gray-300">Quantize:</strong> <span className="dark:text-gray-400">{modelConfig.quantize || 'None'}</span></div>
                <div><strong className="dark:text-gray-300">License:</strong> <span className="dark:text-gray-400">{modelConfig.license ? 'Yes' : 'None'}</span></div>
              </div>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border-2 border-red-200 dark:border-red-800">
                <div className="flex items-center space-x-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <h4 className="font-bold text-red-800 dark:text-red-400">Errors</h4>
                </div>
                <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
                  {validationErrors.map((error, i) => (
                    <li key={i}>- {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Validation Warnings */}
            {validationWarnings.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border-2 border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <h4 className="font-bold text-yellow-800 dark:text-yellow-400">Warnings</h4>
                </div>
                <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                  {validationWarnings.map((warning, i) => (
                    <li key={i}>- {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Generated Modelfile */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold dark:text-white">Generated Modelfile</h3>
                <Button variant="outline" size="sm" onClick={copyModelFile}
                  className="border-2 border-gray-300 dark:border-gray-600">
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </Button>
              </div>
              <Textarea
                value={generatedModelFile}
                readOnly
                className="min-h-[250px] border-2 border-gray-300 dark:border-gray-600 font-mono text-sm bg-gray-50 dark:bg-gray-900 dark:text-gray-300"
              />
            </div>

            {/* Creation Progress */}
            {isCreating && (
              <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-3">
                  <Brain className="w-5 h-5 animate-pulse text-blue-600" />
                  <span className="text-sm font-medium dark:text-blue-300">Creating your model...</span>
                </div>
                <Progress value={creationProgress} className="w-full" />
                <p className="text-xs text-gray-600 dark:text-gray-400">{creationStatus}</p>
                <p className="text-xs text-blue-800 dark:text-blue-400">
                  Model creation can take several minutes depending on the base model size and your system.
                </p>
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
        <h1 className="text-3xl font-bold dark:text-white mb-2">Create Custom Model</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Build a custom Ollama model with a full Modelfile configuration
        </p>
        {location.state?.modelFile && (
          <div className="mt-2">
            <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400">
              Using ModelFile: {location.state.modelFile.name}
            </Badge>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Steps Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-4 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <h2 className="font-bold dark:text-white mb-4">Steps</h2>
            <div className="space-y-2">
              {stepsState.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => goToStep(index)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                    step.current
                      ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                      : step.completed
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {step.completed ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : step.current ? (
                      <step.icon className="w-5 h-5" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-current" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-xs opacity-75 truncate">{step.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-4">
          <Card className="p-6 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="mb-6">
              <h2 className="text-xl font-bold dark:text-white mb-1">
                {stepsState[currentStep]?.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {stepsState[currentStep]?.description}
              </p>
            </div>

            {renderStepContent()}

            <div className="flex justify-between mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={prevStep}
                disabled={currentStep === 0 || isCreating}
                variant="outline"
                className="border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Previous
              </Button>

              {currentStep === stepsState.length - 1 ? (
                <div className="flex gap-2">
                  <Button
                    onClick={validateConfiguration}
                    variant="outline"
                    disabled={isCreating}
                    className="border-2 border-gray-300 dark:border-gray-600"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Validate
                  </Button>
                  <Button
                    onClick={createModel}
                    disabled={isCreating || !modelConfig.name.trim()}
                    className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 border-2 border-black dark:border-white"
                  >
                    {isCreating ? (
                      <>
                        <Brain className="w-4 h-4 mr-2 animate-pulse" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Create Model
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={nextStep}
                  disabled={isCreating}
                  className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 border-2 border-black dark:border-white"
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
