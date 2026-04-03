import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Brain, Copy, Download, Sparkles, Plus, RefreshCw, StopCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';
import { useModelsStore } from '@/stores/models-store';
import { useChatStore } from '@/stores/chat-store';
import { useSettingsStore } from '@/stores/settings-store';
import { useModelFilesStore } from '@/stores/modelfiles-store';
import { useStreamingChat } from '@/hooks/useStreamingChat';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { ChatHistorySidebar } from './ChatHistorySidebar';
import { ChatMessageContent } from '@/components/ChatMessageContent';

const MODELFILE_SYSTEM_PROMPT = `You are an expert AI assistant specialized in creating Ollama ModelFiles. You have deep knowledge of:

**ModelFile Syntax & Instructions:**
- FROM: Base model selection (llama3.2, mistral, codellama, etc.)
- PARAMETER: Model behavior settings (temperature, num_ctx, top_p, top_k, repeat_penalty, num_predict, stop, min_p, seed, etc.)
- SYSTEM: System prompts and personality definition
- TEMPLATE: Custom prompt templates with Go template variables
- MESSAGE: Example conversation history
- ADAPTER: LoRA adapter integration
- LICENSE: Legal licensing information
- REQUIRES: Minimum Ollama version

**Your Role:**
1. Help users understand ModelFile components
2. Generate complete, working ModelFiles based on requirements
3. Suggest optimal configurations for specific use cases
4. Explain parameter effects and recommendations

**Output Format:**
When generating ModelFiles, always wrap them in code blocks with "modelfile" language identifier:
\`\`\`modelfile
FROM llama3.2
PARAMETER temperature 0.8
SYSTEM """Your system prompt here"""
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

  const { models, isLoading: isLoadingModels, fetchModels } = useModelsStore();
  const {
    conversations,
    activeConversationId,
    addMessage,
    createConversation,
    setActiveConversation,
    getActiveConversation,
  } = useChatStore();
  const { settings } = useSettingsStore();
  const { addModelFile } = useModelFilesStore();

  const {
    streamingContent,
    isStreaming,
    error: streamError,
    sendStreamingMessage,
    abortStream,
  } = useStreamingChat();

  const activeConversation = getActiveConversation();
  const messages = activeConversation?.messages || [];

  useEffect(() => {
    if (!selectedModel && settings?.defaultModel) {
      setSelectedModel(settings.defaultModel);
    } else if (!selectedModel && models.length > 0) {
      setSelectedModel(models[0].name);
    }
  }, [settings.defaultModel, models, selectedModel]);

  useEffect(() => {
    if (location.state?.selectedModel) {
      setSelectedModel(location.state.selectedModel);
      toast({ title: 'Model Selected', description: `Ready to chat with ${location.state.selectedModel}` });
    }
  }, [location.state, toast]);

  useEffect(() => {
    if (conversations.length === 0) {
      const newConversation = createConversation(selectedModel || 'assistant', 'ModelFile Assistant');
      addMessage(newConversation.id, {
        role: 'assistant',
        content: `Hello! I'm your AI assistant specialized in creating Ollama ModelFiles. I can help you:\n\n- **Create custom ModelFiles** with parameters and configurations\n- **Explain ModelFile syntax** and all available instructions\n- **Suggest optimal configurations** for different use cases\n- **Generate system prompts** for specific personalities\n\nWhat kind of custom model would you like to create today?`,
      });
    }
  }, [conversations.length, createConversation, addMessage, selectedModel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  useEffect(() => {
    if (streamingContent) {
      const modelFileMatch = streamingContent.match(/```(?:modelfile)?\n([\s\S]*?)\n```/i);
      if (modelFileMatch) {
        setGeneratedModelFile(modelFileMatch[1]);
        const systemMatch = modelFileMatch[1].match(/SYSTEM\s+["']([^"']*)/i);
        if (systemMatch) {
          const t = systemMatch[1].toLowerCase();
          if (t.includes('coding') || t.includes('code')) setModelFileName('coding-assistant');
          else if (t.includes('writing') || t.includes('creative')) setModelFileName('writing-assistant');
          else if (t.includes('documentation') || t.includes('technical')) setModelFileName('documentation-helper');
          else setModelFileName('custom-assistant');
        } else {
          setModelFileName('custom-model');
        }
      }
    }
  }, [streamingContent]);

  const handleSendMessage = async () => {
    if (!input.trim() || isStreaming) return;
    if (!selectedModel) {
      toast({ title: 'No Model Selected', description: 'Please select a model to chat with.', variant: 'destructive' });
      return;
    }

    const userContent = input;
    setInput('');

    if (activeConversationId) {
      addMessage(activeConversationId, { role: 'user', content: userContent });
    }

    try {
      const conversationHistory = messages.map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      }));

      const fullResponse = await sendStreamingMessage(
        selectedModel,
        userContent,
        MODELFILE_SYSTEM_PROMPT,
        conversationHistory
      );

      if (activeConversationId && fullResponse) {
        addMessage(activeConversationId, { role: 'assistant', content: fullResponse });
      }
    } catch {
      toast({ title: 'Error', description: streamError || 'Failed to get response.', variant: 'destructive' });
    }

    inputRef.current?.focus();
  };

  const handleNewChat = () => {
    const newConversation = createConversation(selectedModel, 'New Chat');
    setActiveConversation(newConversation.id);
    setGeneratedModelFile('');
    setModelFileName('');
    addMessage(newConversation.id, {
      role: 'assistant',
      content: "Hello! I'm ready to help you create a new ModelFile. What kind of model would you like to create?",
    });
  };

  const handleCopyModelFile = () => {
    if (generatedModelFile) {
      navigator.clipboard.writeText(generatedModelFile);
      toast({ title: 'Copied', description: 'ModelFile copied to clipboard.' });
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
      toast({ title: 'Saved', description: 'ModelFile downloaded.' });
    }
  };

  const handleAddToModelFiles = () => {
    if (!generatedModelFile || !modelFileName.trim()) {
      toast({ title: 'Missing information', description: 'Please provide a name for the ModelFile.', variant: 'destructive' });
      return;
    }
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
    toast({ title: 'Saved', description: `"${modelFileName}" added to your ModelFiles collection.` });
    setGeneratedModelFile('');
    setModelFileName('');
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-full gap-3">
      {/* Chat History Sidebar */}
      <ChatHistorySidebar onNewChat={handleNewChat} />

      {/* Main Chat */}
      <div className="flex-1 flex flex-col min-w-0 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold dark:text-white truncate">AI ModelFile Assistant</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Specialized in Ollama ModelFile creation</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ConnectionStatus />
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-32 sm:w-40 h-8 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-800">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {models.length > 0 ? (
                  models.map((model) => (
                    <SelectItem key={model.name} value={model.name}>{model.name}</SelectItem>
                  ))
                ) : (
                  <SelectItem value="llama3.2">llama3.2 (default)</SelectItem>
                )}
              </SelectContent>
            </Select>
            <Button
              onClick={() => fetchModels()}
              variant="ghost"
              size="sm"
              disabled={isLoadingModels}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingModels ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-4 max-w-3xl mx-auto">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {message.role === 'user' ? (
                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none overflow-hidden break-words [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_code]:break-all [&_table]:text-xs">
                      <ChatMessageContent content={message.content} />
                    </div>
                  )}
                  <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-purple-200' : 'text-gray-400 dark:text-gray-500'}`}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Streaming */}
            {isStreaming && streamingContent && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                <div className="max-w-[85%] rounded-lg px-4 py-3 bg-gray-100 dark:bg-gray-800">
                  <div className="prose prose-sm dark:prose-invert max-w-none overflow-hidden break-words [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_code]:break-all">
                    <ChatMessageContent content={streamingContent} />
                  </div>
                  <div className="text-xs mt-2 text-gray-400 dark:text-gray-500 flex items-center">
                    <Loader2 className="w-3 h-3 animate-spin mr-1" /> Generating...
                  </div>
                </div>
              </motion.div>
            )}

            {isStreaming && !streamingContent && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex gap-2 max-w-3xl mx-auto">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about ModelFiles, describe what you want to create..."
              className="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              disabled={isStreaming}
            />
            {isStreaming ? (
              <Button onClick={abortStream} className="bg-red-600 text-white hover:bg-red-700 flex-shrink-0">
                <StopCircle className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim()}
                className="bg-purple-600 text-white hover:bg-purple-700 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 text-center">
            Press Enter to send &middot; Cmd+N for new chat
          </p>
        </div>
      </div>

      {/* Right Sidebar - compact */}
      <div className="hidden lg:flex flex-col w-64 flex-shrink-0 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 overflow-hidden">
        {/* ModelFile Output */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold dark:text-white uppercase tracking-wide text-gray-500">ModelFile Output</h3>
            <div className="flex gap-1">
              <Button onClick={handleCopyModelFile} disabled={!generatedModelFile} variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Copy className="w-3 h-3" />
              </Button>
              <Button onClick={handleSaveModelFile} disabled={!generatedModelFile} variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Download className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <Textarea
            value={generatedModelFile}
            onChange={(e) => setGeneratedModelFile(e.target.value)}
            placeholder="ModelFile appears here when the AI generates one..."
            className="h-28 min-h-0 text-xs font-mono border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 resize-none"
          />
          {generatedModelFile && (
            <div className="mt-2 flex gap-1.5">
              <Input
                value={modelFileName}
                onChange={(e) => setModelFileName(e.target.value)}
                placeholder="Name..."
                className="text-xs h-7 border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <Button
                onClick={handleAddToModelFiles}
                disabled={!generatedModelFile || !modelFileName.trim()}
                className="bg-green-600 text-white hover:bg-green-700 h-7 px-2 text-xs flex-shrink-0"
                size="sm"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="p-3 flex-shrink-0">
          <h3 className="text-xs font-bold dark:text-white uppercase tracking-wide text-gray-500 mb-2">Quick Prompts</h3>
          <div className="space-y-1">
            {[
              { label: 'Coding Assistant', prompt: 'Create a ModelFile for a helpful coding assistant based on llama3.2 with temperature 0.7, focused on providing clean code examples with explanations' },
              { label: 'Creative Writer', prompt: 'Create a ModelFile for a creative writing assistant that helps with storytelling, character development, and creative writing techniques' },
              { label: 'Documentation', prompt: 'Create a ModelFile for a technical documentation specialist that creates clear, accurate, and well-structured documentation' },
              { label: 'Data Analyst', prompt: 'Create a ModelFile for a data analysis assistant that helps interpret data, create visualizations, and explain statistical concepts' },
            ].map((item) => (
              <Button
                key={item.label}
                onClick={() => setInput(item.prompt)}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs h-7 hover:bg-gray-100 dark:hover:bg-gray-800 px-2"
              >
                <Sparkles className="w-3 h-3 mr-1.5 text-purple-500 flex-shrink-0" />
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
