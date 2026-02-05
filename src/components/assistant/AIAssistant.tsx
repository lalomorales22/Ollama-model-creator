import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Brain, Copy, Download, Sparkles, Plus, RefreshCw, StopCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';
import { useModelsStore } from '@/stores/models-store';
import { useChatStore } from '@/stores/chat-store';
import { useSettingsStore } from '@/stores/settings-store';
import { useModelFilesStore } from '@/stores/modelfiles-store';
import { useStreamingChat } from '@/hooks/useStreamingChat';
import { StreamingText } from '@/components/StreamingText';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { ChatHistorySidebar } from './ChatHistorySidebar';
import { ChatMessageContent } from '@/components/ChatMessageContent';

const MODELFILE_SYSTEM_PROMPT = `You are an expert AI assistant specialized in creating Ollama ModelFiles. You have deep knowledge of:

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

export function AIAssistant() {
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [generatedModelFile, setGeneratedModelFile] = useState('');
  const [modelFileName, setModelFileName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const location = useLocation();

  // Use stores
  const { models, isLoading: isLoadingModels, fetchModels } = useModelsStore();
  const { 
    conversations, 
    activeConversationId, 
    addMessage, 
    updateMessage,
    createConversation, 
    setActiveConversation,
    getActiveConversation 
  } = useChatStore();
  const { settings } = useSettingsStore();
  const { addModelFile } = useModelFilesStore();

  // Streaming chat hook
  const { 
    streamingContent, 
    isStreaming, 
    error: streamError, 
    sendStreamingMessage, 
    abortStream 
  } = useStreamingChat();

  const activeConversation = getActiveConversation();
  const messages = activeConversation?.messages || [];

  // Initialize with default model
  useEffect(() => {
    if (!selectedModel && settings?.defaultModel) {
      setSelectedModel(settings.defaultModel);
    } else if (!selectedModel && models.length > 0) {
      setSelectedModel(models[0].name);
    }
  }, [settings.defaultModel, models, selectedModel]);

  // Handle navigation with pre-selected model
  useEffect(() => {
    if (location.state?.selectedModel) {
      setSelectedModel(location.state.selectedModel);
      toast({
        title: "Model Selected",
        description: `Ready to chat with ${location.state.selectedModel}`,
      });
    }
  }, [location.state, toast]);

  // Create initial conversation if none exists
  useEffect(() => {
    if (conversations.length === 0) {
      const newConversation = createConversation(selectedModel || 'assistant', 'ModelFile Assistant');
      // Add welcome message
      addMessage(newConversation.id, {
        role: 'assistant',
        content: `Hello! I'm your AI assistant specialized in creating Ollama ModelFiles. I can help you:

• **Create custom ModelFiles** with specific parameters and configurations
• **Explain ModelFile syntax** and all available instructions (FROM, PARAMETER, SYSTEM, TEMPLATE, etc.)
• **Suggest optimal configurations** for different use cases (coding, writing, analysis, etc.)
• **Generate system prompts** and templates for specific personalities
• **Help troubleshoot** ModelFile issues and parameter tuning
• **Recommend base models** and parameter combinations

What kind of custom model would you like to create today?`,
      });
    }
  }, [conversations.length, createConversation, addMessage, selectedModel]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Extract ModelFile from response
  useEffect(() => {
    if (streamingContent) {
      const modelFileMatch = streamingContent.match(/```(?:modelfile)?\n([\s\S]*?)\n```/i);
      if (modelFileMatch) {
        setGeneratedModelFile(modelFileMatch[1]);
        // Auto-generate name
        const systemMatch = modelFileMatch[1].match(/SYSTEM\s+["']([^"']*)/i);
        if (systemMatch) {
          const systemText = systemMatch[1].toLowerCase();
          if (systemText.includes('coding') || systemText.includes('code')) {
            setModelFileName('coding-assistant');
          } else if (systemText.includes('writing') || systemText.includes('creative')) {
            setModelFileName('writing-assistant');
          } else if (systemText.includes('documentation') || systemText.includes('technical')) {
            setModelFileName('documentation-helper');
          } else {
            setModelFileName('custom-assistant');
          }
        } else {
          setModelFileName('custom-model');
        }
      }
    }
  }, [streamingContent]);

  const handleSendMessage = async () => {
    if (!input.trim() || isStreaming) return;
    if (!selectedModel) {
      toast({
        title: "No Model Selected",
        description: "Please select a model to chat with.",
        variant: "destructive",
      });
      return;
    }

    const userContent = input;
    setInput('');

    // Add user message
    if (activeConversationId) {
      addMessage(activeConversationId, {
        role: 'user',
        content: userContent,
      });
    }

    try {
      // Build conversation history for context
      const conversationHistory = messages.map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      }));

      // Send streaming message
      const fullResponse = await sendStreamingMessage(
        selectedModel,
        userContent,
        MODELFILE_SYSTEM_PROMPT,
        conversationHistory
      );

      // Add assistant response when complete
      if (activeConversationId && fullResponse) {
        addMessage(activeConversationId, {
          role: 'assistant',
          content: fullResponse,
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: streamError || "Failed to get response from AI assistant.",
        variant: "destructive",
      });
    }

    inputRef.current?.focus();
  };

  const handleNewChat = () => {
    const newConversation = createConversation(selectedModel, 'New Chat');
    setActiveConversation(newConversation.id);
    setGeneratedModelFile('');
    setModelFileName('');
    // Add welcome message to new conversation
    addMessage(newConversation.id, {
      role: 'assistant',
      content: "Hello! I'm ready to help you create a new ModelFile. What kind of model would you like to create?",
    });
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

  const handleAddToModelFiles = () => {
    if (!generatedModelFile || !modelFileName.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a name for the ModelFile.",
        variant: "destructive",
      });
      return;
    }

    // Extract details from modelfile content
    const baseModelMatch = generatedModelFile.match(/FROM\s+([^\s\n]+)/i);
    const systemMatch = generatedModelFile.match(/SYSTEM\s+["']([^"']*)/i);
    const paramMatches = [...generatedModelFile.matchAll(/PARAMETER\s+(\w+)\s+([^\n]+)/gi)];
    
    const parameters: Record<string, string | number> = {};
    for (const match of paramMatches) {
      const value = match[2].trim();
      parameters[match[1]] = isNaN(Number(value)) ? value : Number(value);
    }

    addModelFile({
      name: modelFileName,
      content: generatedModelFile,
      baseModel: baseModelMatch ? baseModelMatch[1] : 'unknown',
      system: systemMatch ? systemMatch[1] : undefined,
      parameters: Object.keys(parameters).length > 0 ? parameters : undefined,
    });

    toast({
      title: "ModelFile saved",
      description: `"${modelFileName}" has been added to your ModelFiles collection.`,
    });

    setGeneratedModelFile('');
    setModelFileName('');
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="flex h-[calc(100vh-200px)]">
        {/* Chat History Sidebar */}
        <ChatHistorySidebar onNewChat={handleNewChat} />
        
        {/* Main Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 lg:p-0 lg:pl-4">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="h-full border-4 border-black dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col">
              <div className="p-4 border-b-2 border-black dark:border-gray-700">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-black dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-black dark:text-white">AI ModelFile Assistant</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Specialized in Ollama ModelFile creation</p>
                    </div>
                  </div>
                  <div className="flex items-center flex-wrap gap-2">
                    <ConnectionStatus />
                    <div className="flex items-center gap-2">
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger className="w-32 sm:w-40 border-2 border-black dark:border-gray-600">
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          {models.length > 0 ? (
                            models.map((model) => (
                              <SelectItem key={model.name} value={model.name}>
                                {model.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="llama3.2">llama3.2 (default)</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => fetchModels()}
                        variant="outline"
                        size="sm"
                        disabled={isLoadingModels}
                        className="border-2 border-black dark:border-gray-600 hover:bg-black hover:text-white dark:hover:bg-gray-700"
                      >
                        <RefreshCw className={`w-4 h-4 ${isLoadingModels ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </div>
                {models.length === 0 && (
                  <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                    ⚠️ No models detected. Make sure Ollama is running and has models installed.
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-white dark:bg-gray-900">
                {messages.map((message) => (
                  <motion.div 
                    key={message.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] p-3 rounded-lg border-2 border-black dark:border-gray-600 ${
                      message.role === 'user' 
                        ? 'bg-black dark:bg-gray-700 text-white' 
                        : 'bg-white dark:bg-gray-800 text-black dark:text-white'
                    }`}>
                      {message.role === 'user' ? (
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      ) : (
                        <ChatMessageContent content={message.content} />
                      )}
                      <div className={`text-xs mt-2 ${
                        message.role === 'user' ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {/* Streaming response */}
                {isStreaming && streamingContent && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="max-w-[85%] p-3 rounded-lg border-2 border-black dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white">
                      <ChatMessageContent content={streamingContent} />
                      <div className="text-xs mt-2 text-gray-500 dark:text-gray-400 flex items-center">
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        Generating...
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {/* Loading indicator when waiting for first token */}
                {isStreaming && !streamingContent && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-gray-800 border-2 border-black dark:border-gray-600 p-3 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t-2 border-black dark:border-gray-700 bg-white dark:bg-gray-900">
                <div className="flex space-x-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about ModelFiles, describe what you want to create..."
                    className="border-2 border-black dark:border-gray-600"
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    disabled={isStreaming}
                  />
                  {isStreaming ? (
                    <Button
                      onClick={abortStream}
                      className="bg-red-600 text-white hover:bg-red-700 border-2 border-red-600"
                    >
                      <StopCircle className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSendMessage}
                      disabled={!input.trim()}
                      className="bg-black dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600 border-2 border-black dark:border-gray-600"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Press Enter to send • Cmd+N for new chat
                </p>
              </div>
            </Card>
          </div>

        {/* ModelFile Output & Management */}
        <div className="space-y-4">
          <Card className="p-4 border-4 border-black dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-black dark:text-white">Generated ModelFile</h3>
              <div className="flex space-x-2">
                <Button
                  onClick={handleCopyModelFile}
                  disabled={!generatedModelFile}
                  variant="outline"
                  size="sm"
                  className="border-2 border-black dark:border-gray-600 hover:bg-black hover:text-white dark:hover:bg-gray-700"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  onClick={handleSaveModelFile}
                  disabled={!generatedModelFile}
                  variant="outline"
                  size="sm"
                  className="border-2 border-black dark:border-gray-600 hover:bg-black hover:text-white dark:hover:bg-gray-700"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <Textarea
              value={generatedModelFile}
              onChange={(e) => setGeneratedModelFile(e.target.value)}
              placeholder="Generated ModelFile will appear here..."
              className="min-h-[200px] border-2 border-black dark:border-gray-600 font-mono text-sm"
            />

            {generatedModelFile && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-sm font-medium text-black dark:text-white">ModelFile Name</label>
                  <Input
                    value={modelFileName}
                    onChange={(e) => setModelFileName(e.target.value)}
                    placeholder="Enter a name for this ModelFile"
                    className="mt-1 border-2 border-black dark:border-gray-600"
                  />
                </div>
                <Button
                  onClick={handleAddToModelFiles}
                  disabled={!generatedModelFile || !modelFileName.trim()}
                  className="w-full bg-green-600 text-white hover:bg-green-700 border-2 border-black dark:border-green-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to ModelFiles Collection
                </Button>
              </div>
            )}
          </Card>

          <Card className="p-4 border-4 border-black dark:border-gray-700 bg-white dark:bg-gray-900">
            <h3 className="text-lg font-bold text-black dark:text-white mb-4">Quick ModelFile Templates</h3>
            <div className="space-y-2">
              <Button
                onClick={() => setInput("Create a ModelFile for a helpful coding assistant based on llama3.2 with temperature 0.7, focused on providing clean code examples with explanations")}
                variant="outline"
                size="sm"
                className="w-full justify-start border-2 border-black dark:border-gray-600 hover:bg-black hover:text-white dark:hover:bg-gray-700"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Coding Assistant
              </Button>
              <Button
                onClick={() => setInput("Create a ModelFile for a creative writing assistant that helps with storytelling, character development, and creative writing techniques")}
                variant="outline"
                size="sm"
                className="w-full justify-start border-2 border-black dark:border-gray-600 hover:bg-black hover:text-white dark:hover:bg-gray-700"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Creative Writer
              </Button>
              <Button
                onClick={() => setInput("Create a ModelFile for a technical documentation specialist that creates clear, accurate, and well-structured documentation")}
                variant="outline"
                size="sm"
                className="w-full justify-start border-2 border-black dark:border-gray-600 hover:bg-black hover:text-white dark:hover:bg-gray-700"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Documentation Helper
              </Button>
              <Button
                onClick={() => setInput("Create a ModelFile for a data analysis assistant that helps interpret data, create visualizations, and explain statistical concepts")}
                variant="outline"
                size="sm"
                className="w-full justify-start border-2 border-black dark:border-gray-600 hover:bg-black hover:text-white dark:hover:bg-gray-700"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Data Analyst
              </Button>
            </div>
          </Card>
        </div>
      </div>
      </div>
    </div>
  );
}