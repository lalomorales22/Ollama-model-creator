import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, OllamaModel } from '@/types/ollama';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Brain, Copy, Download, Sparkles, Save, Plus, RefreshCw } from 'lucide-react';
import { ollamaService } from '@/services/ollama';
import { useToast } from '@/hooks/use-toast';
import { modelFileService } from '@/services/modelfiles';

export function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your AI assistant specialized in creating Ollama ModelFiles. I can help you:

• **Create custom ModelFiles** with specific parameters and configurations
• **Explain ModelFile syntax** and all available instructions (FROM, PARAMETER, SYSTEM, TEMPLATE, etc.)
• **Suggest optimal configurations** for different use cases (coding, writing, analysis, etc.)
• **Generate system prompts** and templates for specific personalities
• **Help troubleshoot** ModelFile issues and parameter tuning
• **Recommend base models** and parameter combinations

**ModelFile Instructions I can help with:**
- \`FROM\` - Base model selection
- \`PARAMETER\` - Model behavior settings (temperature, top_p, etc.)
- \`SYSTEM\` - System prompts and personality
- \`TEMPLATE\` - Custom prompt templates
- \`MESSAGE\` - Example conversations
- \`ADAPTER\` - LoRA adapters
- \`LICENSE\` - Legal licensing

What kind of custom model would you like to create today? Describe the personality, use case, or behavior you want, and I'll generate a complete ModelFile for you!`,
      timestamp: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('llama3.2');
  const [availableModels, setAvailableModels] = useState<OllamaModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [generatedModelFile, setGeneratedModelFile] = useState('');
  const [modelFileName, setModelFileName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
          setSelectedModel(settings.defaultModel);
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

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const systemPrompt = `You are an expert AI assistant specialized in creating Ollama ModelFiles. You have deep knowledge of:

**ModelFile Syntax & Instructions:**
- FROM: Base model selection (llama3.2, mistral, codellama, etc.)
- PARAMETER: Model behavior settings
  - temperature (0.1-2.0): creativity vs coherence
  - num_ctx: context window size
  - top_p (0.1-1.0): nucleus sampling
  - top_k: top-k sampling
  - repeat_penalty: repetition control
  - num_predict: max tokens to generate
  - stop: stop sequences
- SYSTEM: System prompts and personality definition
- TEMPLATE: Custom prompt templates with variables
- MESSAGE: Example conversation history
- ADAPTER: LoRA adapter integration
- LICENSE: Legal licensing information

**Best Practices:**
- Choose appropriate base models for specific tasks
- Set optimal parameters for different use cases
- Create clear, effective system prompts
- Use proper template formatting
- Include relevant example conversations

**Your Role:**
1. Help users understand ModelFile components
2. Generate complete, working ModelFiles based on requirements
3. Suggest optimal configurations for specific use cases
4. Explain parameter effects and recommendations
5. Provide system prompts for different personalities/tasks

**Output Format:**
When generating ModelFiles, always wrap them in code blocks with "modelfile" language identifier:
\`\`\`modelfile
FROM llama3.2
PARAMETER temperature 0.8
SYSTEM "Your system prompt here"
\`\`\`

Always provide practical, working examples and explain your recommendations clearly.`;

      const prompt = `${systemPrompt}\n\nUser: ${input}`;
      
      const response = await ollamaService.generateResponse(selectedModel, prompt, false);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Extract ModelFile from response
      const modelFileMatch = response.response.match(/```(?:modelfile)?\n([\s\S]*?)\n```/i);
      if (modelFileMatch) {
        setGeneratedModelFile(modelFileMatch[1]);
        // Auto-generate a name based on the content
        const systemMatch = modelFileMatch[1].match(/SYSTEM\s+["']([^"']*)/i);
        if (systemMatch) {
          const systemText = systemMatch[1];
          if (systemText.toLowerCase().includes('coding') || systemText.toLowerCase().includes('code')) {
            setModelFileName('coding-assistant');
          } else if (systemText.toLowerCase().includes('writing') || systemText.toLowerCase().includes('creative')) {
            setModelFileName('writing-assistant');
          } else if (systemText.toLowerCase().includes('documentation') || systemText.toLowerCase().includes('technical')) {
            setModelFileName('documentation-helper');
          } else {
            setModelFileName('custom-assistant');
          }
        } else {
          setModelFileName('custom-model');
        }
      }

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get response from AI assistant. Make sure Ollama is running and the model is available.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyModelFile = () => {
    if (generatedModelFile) {
      navigator.clipboard.writeText(generatedModelFile);
      toast({
        title: "Copied to clipboard",
        description: "ModelFile has been copied to your clipboard.",
      });
    }
  };

  const handleSaveModelFile = () => {
    if (generatedModelFile) {
      const blob = new Blob([generatedModelFile], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Modelfile';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "ModelFile saved",
        description: "ModelFile has been downloaded to your computer.",
      });
    }
  };

  const handleAddToModelFiles = async () => {
    if (!generatedModelFile || !modelFileName.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a name for the ModelFile.",
        variant: "destructive",
      });
      return;
    }

    try {
      await modelFileService.saveModelFile({
        name: modelFileName,
        content: generatedModelFile,
        baseModel: extractBaseModel(generatedModelFile),
        parameters: extractParameters(generatedModelFile),
        system: extractSystemPrompt(generatedModelFile),
      });

      toast({
        title: "ModelFile saved",
        description: `"${modelFileName}" has been added to your ModelFiles collection.`,
      });

      // Clear the form
      setGeneratedModelFile('');
      setModelFileName('');
    } catch (error) {
      toast({
        title: "Error saving ModelFile",
        description: "Failed to save the ModelFile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const extractBaseModel = (content: string): string => {
    const match = content.match(/FROM\s+([^\s\n]+)/i);
    return match ? match[1] : 'unknown';
  };

  const extractParameters = (content: string): Record<string, any> => {
    const params: Record<string, any> = {};
    const paramMatches = content.matchAll(/PARAMETER\s+(\w+)\s+([^\n]+)/gi);
    for (const match of paramMatches) {
      params[match[1]] = match[2];
    }
    return params;
  };

  const extractSystemPrompt = (content: string): string => {
    const match = content.match(/SYSTEM\s+["']([^"']*)/i);
    return match ? match[1] : '';
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <Card className="h-full border-4 border-black bg-white flex flex-col">
            <div className="p-4 border-b-2 border-black">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-black">AI ModelFile Assistant</h2>
                    <p className="text-sm text-gray-600">Specialized in Ollama ModelFile creation</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-black">Model:</label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger className="w-40 border-2 border-black">
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-2 border-black hover:bg-black hover:text-white"
                    onClick={() => setMessages(messages.slice(0, 1))}
                  >
                    Clear Chat
                  </Button>
                </div>
              </div>
              {availableModels.length === 0 && (
                <div className="mt-2 text-xs text-yellow-600">
                  ⚠️ No models detected - showing fallback options. Download models first for best experience.
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-white">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg border-2 border-black ${
                    message.role === 'user' 
                      ? 'bg-black text-white' 
                      : 'bg-white text-black'
                  }`}>
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    <div className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border-2 border-black p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-black rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t-2 border-black bg-white">
              <div className="flex space-x-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about ModelFiles, describe what you want to create, or request help with parameters..."
                  className="border-2 border-black"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                  className="bg-black text-white hover:bg-gray-800 border-2 border-black"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* ModelFile Output & Management */}
        <div className="space-y-4">
          <Card className="p-4 border-4 border-black bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-black">Generated ModelFile</h3>
              <div className="flex space-x-2">
                <Button
                  onClick={handleCopyModelFile}
                  disabled={!generatedModelFile}
                  variant="outline"
                  size="sm"
                  className="border-2 border-black hover:bg-black hover:text-white"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  onClick={handleSaveModelFile}
                  disabled={!generatedModelFile}
                  variant="outline"
                  size="sm"
                  className="border-2 border-black hover:bg-black hover:text-white"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <Textarea
              value={generatedModelFile}
              onChange={(e) => setGeneratedModelFile(e.target.value)}
              placeholder="Generated ModelFile will appear here..."
              className="min-h-[200px] border-2 border-black font-mono text-sm"
            />

            {generatedModelFile && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-sm font-medium text-black">ModelFile Name</label>
                  <Input
                    value={modelFileName}
                    onChange={(e) => setModelFileName(e.target.value)}
                    placeholder="Enter a name for this ModelFile"
                    className="mt-1 border-2 border-black"
                  />
                </div>
                <Button
                  onClick={handleAddToModelFiles}
                  disabled={!generatedModelFile || !modelFileName.trim()}
                  className="w-full bg-green-600 text-white hover:bg-green-700 border-2 border-black"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to ModelFiles Collection
                </Button>
              </div>
            )}
          </Card>

          <Card className="p-4 border-4 border-black bg-white">
            <h3 className="text-lg font-bold text-black mb-4">Quick ModelFile Templates</h3>
            <div className="space-y-2">
              <Button
                onClick={() => setInput("Create a ModelFile for a helpful coding assistant based on llama3.2 with temperature 0.7, focused on providing clean code examples with explanations")}
                variant="outline"
                size="sm"
                className="w-full justify-start border-2 border-black hover:bg-black hover:text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Coding Assistant
              </Button>
              <Button
                onClick={() => setInput("Create a ModelFile for a creative writing assistant that helps with storytelling, character development, and creative writing techniques")}
                variant="outline"
                size="sm"
                className="w-full justify-start border-2 border-black hover:bg-black hover:text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Creative Writer
              </Button>
              <Button
                onClick={() => setInput("Create a ModelFile for a technical documentation specialist that creates clear, accurate, and well-structured documentation")}
                variant="outline"
                size="sm"
                className="w-full justify-start border-2 border-black hover:bg-black hover:text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Documentation Helper
              </Button>
              <Button
                onClick={() => setInput("Create a ModelFile for a data analysis assistant that helps interpret data, create visualizations, and explain statistical concepts")}
                variant="outline"
                size="sm"
                className="w-full justify-start border-2 border-black hover:bg-black hover:text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Data Analyst
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}