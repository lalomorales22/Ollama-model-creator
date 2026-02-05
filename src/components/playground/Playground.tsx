/**
 * Model Playground
 * 
 * A dedicated page for testing any Ollama model with:
 * - Multi-turn conversations
 * - System prompt editor with templates
 * - Live parameter tuning
 * - Token count and generation stats
 * - Response regeneration
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Settings2, 
  Trash2, 
  Copy, 
  StopCircle, 
  Sparkles,
  RotateCcw,
  Clock,
  Zap,
  Hash,
  Download,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useModelsStore } from '@/stores/models-store';
import { useSettingsStore } from '@/stores/settings-store';
import { ollamaClient, type Message } from '@/lib/ollama-client';
import { ChatMessageContent } from '@/components/ChatMessageContent';
import { ParameterPanel } from './ParameterPanel';
import { SystemPromptEditor } from './SystemPromptEditor';
import { cn } from '@/lib/utils';

interface PlaygroundMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[];
  timestamp: Date;
  // Stats for assistant messages
  stats?: {
    totalTokens?: number;
    promptTokens?: number;
    completionTokens?: number;
    tokensPerSecond?: number;
    totalDuration?: number;
    loadDuration?: number;
    evalDuration?: number;
  };
}

interface GenerationParams {
  temperature: number;
  topP: number;
  topK: number;
  repeatPenalty: number;
  numPredict: number;
  numCtx: number;
  seed: number;
  stop: string[];
}

const DEFAULT_PARAMS: GenerationParams = {
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  repeatPenalty: 1.1,
  numPredict: 2048,
  numCtx: 4096,
  seed: -1,
  stop: [],
};

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

export function Playground() {
  const [messages, setMessages] = useState<PlaygroundMessage[]>([]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [params, setParams] = useState<GenerationParams>(DEFAULT_PARAMS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [showParams, setShowParams] = useState(true);
  const [currentStats, setCurrentStats] = useState<PlaygroundMessage['stats']>();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  const { models, fetchModels } = useModelsStore();
  const { settings } = useSettingsStore();

  // Initialize model
  useEffect(() => {
    if (!selectedModel && settings?.defaultModel) {
      setSelectedModel(settings.defaultModel);
    } else if (!selectedModel && models.length > 0) {
      setSelectedModel(models[0].name);
    }
  }, [settings?.defaultModel, models, selectedModel]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Fetch models on mount
  useEffect(() => {
    if (models.length === 0) {
      fetchModels();
    }
  }, [models.length, fetchModels]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !selectedModel || isGenerating) return;

    const userMessage: PlaygroundMessage = {
      id: generateId(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);
    setStreamingContent('');
    setCurrentStats(undefined);

    // Create abort controller
    abortControllerRef.current = new AbortController();

    try {
      // Build messages array
      const chatMessages: Message[] = [];
      
      if (systemPrompt) {
        chatMessages.push({ role: 'system', content: systemPrompt });
      }

      // Add previous messages
      messages.forEach(msg => {
        if (msg.role !== 'system') {
          chatMessages.push({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            images: msg.images,
          });
        }
      });

      // Add current user message
      chatMessages.push({ role: 'user', content: userMessage.content });

      let fullContent = '';
      let lastChunk: any = null;
      const startTime = Date.now();

      // Stream the response
      const stream = ollamaClient.chatStream({
        model: selectedModel,
        messages: chatMessages,
        options: {
          temperature: params.temperature,
          top_p: params.topP,
          top_k: params.topK,
          repeat_penalty: params.repeatPenalty,
          num_predict: params.numPredict,
          num_ctx: params.numCtx,
          seed: params.seed !== -1 ? params.seed : undefined,
          stop: params.stop.length > 0 ? params.stop : undefined,
        },
      });

      for await (const chunk of stream) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }
        fullContent += chunk.message?.content || '';
        setStreamingContent(fullContent);
        lastChunk = chunk;
      }

      const endTime = Date.now();
      const totalDuration = (endTime - startTime) / 1000;

      // Calculate stats
      const stats: PlaygroundMessage['stats'] = {
        totalDuration,
        promptTokens: lastChunk?.prompt_eval_count,
        completionTokens: lastChunk?.eval_count,
        totalTokens: (lastChunk?.prompt_eval_count || 0) + (lastChunk?.eval_count || 0),
        tokensPerSecond: lastChunk?.eval_count 
          ? lastChunk.eval_count / totalDuration 
          : undefined,
        loadDuration: lastChunk?.load_duration 
          ? lastChunk.load_duration / 1e9 
          : undefined,
        evalDuration: lastChunk?.eval_duration 
          ? lastChunk.eval_duration / 1e9 
          : undefined,
      };

      // Add assistant message
      const assistantMessage: PlaygroundMessage = {
        id: generateId(),
        role: 'assistant',
        content: fullContent,
        timestamp: new Date(),
        stats,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setCurrentStats(stats);

    } catch (error) {
      if (error instanceof Error && error.message !== 'aborted') {
        toast({
          title: 'Generation Failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setIsGenerating(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  }, [input, selectedModel, isGenerating, messages, systemPrompt, params, toast]);

  const handleStop = () => {
    abortControllerRef.current?.abort();
    ollamaClient.abort();
    setIsGenerating(false);
  };

  const handleRegenerate = useCallback(async () => {
    if (messages.length < 2) return;
    
    // Remove last assistant message and regenerate
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMessage) return;

    setMessages(prev => prev.slice(0, -1));
    setInput(lastUserMessage.content);
    
    // Trigger send after state update
    setTimeout(() => {
      setInput('');
      handleSend();
    }, 0);
  }, [messages, handleSend]);

  const handleClear = () => {
    setMessages([]);
    setStreamingContent('');
    setCurrentStats(undefined);
  };

  const handleCopyConversation = () => {
    const text = messages
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  const handleExport = () => {
    const data = {
      model: selectedModel,
      systemPrompt,
      parameters: params,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp.toISOString(),
        stats: m.stats,
      })),
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `playground-${selectedModel}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Conversation exported' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-black dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h1 className="text-xl font-bold">Playground</h1>
            </div>
            
            {/* Model Selector */}
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-[200px] border-2 border-black dark:border-gray-700">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {models.map(model => (
                  <SelectItem key={model.name} value={model.name}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            {currentStats && (
              <div className="flex items-center gap-3 text-sm text-gray-500 mr-4">
                {currentStats.totalTokens && (
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {currentStats.totalTokens} tokens
                  </span>
                )}
                {currentStats.tokensPerSecond && (
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {currentStats.tokensPerSecond.toFixed(1)} t/s
                  </span>
                )}
                {currentStats.totalDuration && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {currentStats.totalDuration.toFixed(2)}s
                  </span>
                )}
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyConversation}
              disabled={messages.length === 0}
              className="border-2 border-black dark:border-gray-700"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={messages.length === 0}
              className="border-2 border-black dark:border-gray-700"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={messages.length === 0}
              className="border-2 border-black dark:border-gray-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowParams(!showParams)}
              className={cn(
                "border-2 border-black dark:border-gray-700",
                showParams && "bg-black text-white dark:bg-white dark:text-black"
              )}
            >
              <Settings2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.length === 0 && !streamingContent && (
              <div className="text-center py-20">
                <MessageSquare className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">
                  Start a conversation
                </h3>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Send a message to begin testing {selectedModel || 'a model'}
                </p>
              </div>
            )}

            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-3",
                  message.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                <Card className={cn(
                  "max-w-[80%] p-4 border-2",
                  message.role === 'user'
                    ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
                    : "bg-white dark:bg-gray-900 border-black dark:border-gray-700"
                )}>
                  <ChatMessageContent content={message.content} />
                  
                  {/* Stats for assistant messages */}
                  {message.role === 'assistant' && message.stats && (
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
                      {message.stats.totalTokens && (
                        <span>{message.stats.totalTokens} tokens</span>
                      )}
                      {message.stats.tokensPerSecond && (
                        <span>{message.stats.tokensPerSecond.toFixed(1)} t/s</span>
                      )}
                      {message.stats.totalDuration && (
                        <span>{message.stats.totalDuration.toFixed(2)}s</span>
                      )}
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}

            {/* Streaming content */}
            {streamingContent && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 justify-start"
              >
                <Card className="max-w-[80%] p-4 border-2 bg-white dark:bg-gray-900 border-black dark:border-gray-700">
                  <ChatMessageContent content={streamingContent} />
                  <span className="inline-block w-2 h-4 bg-purple-500 animate-pulse ml-1" />
                </Card>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t-2 border-black dark:border-gray-700">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (Shift+Enter for new line)"
                className="flex-1 min-h-[60px] max-h-[200px] resize-none border-2 border-black dark:border-gray-700"
                disabled={isGenerating}
              />
              <div className="flex flex-col gap-2">
                {isGenerating ? (
                  <Button
                    onClick={handleStop}
                    className="h-full px-6 bg-red-500 hover:bg-red-600 text-white border-2 border-black"
                  >
                    <StopCircle className="w-5 h-5" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || !selectedModel}
                    className="h-full px-6 bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 border-2 border-black dark:border-white"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                )}
                {messages.length >= 2 && !isGenerating && (
                  <Button
                    variant="outline"
                    onClick={handleRegenerate}
                    className="border-2 border-black dark:border-gray-700"
                    title="Regenerate last response"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Parameter Panel */}
      <AnimatePresence>
        {showParams && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 350, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-l-2 border-black dark:border-gray-700 overflow-hidden"
          >
            <ScrollArea className="h-full">
              <div className="p-4 space-y-6">
                <SystemPromptEditor
                  value={systemPrompt}
                  onChange={setSystemPrompt}
                />
                
                <Separator className="bg-black dark:bg-gray-700" />
                
                <ParameterPanel
                  params={params}
                  onChange={setParams}
                  onReset={() => setParams(DEFAULT_PARAMS)}
                />
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
