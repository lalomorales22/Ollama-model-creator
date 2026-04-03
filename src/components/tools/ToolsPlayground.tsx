/**
 * Tools Playground
 * 
 * A dedicated page for building and testing tool calling
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wrench, 
  Send, 
  StopCircle, 
  Trash2,
  MessageSquare,
  Code
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useModelsStore } from '@/stores/models-store';
import { ollamaClient, type Message, type Tool } from '@/lib/ollama-client';
import { ToolBuilder, type ToolDefinition } from './ToolBuilder';
import { ChatMessageContent } from '@/components/ChatMessageContent';
import { cn } from '@/lib/utils';

interface ToolCallMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: Array<{
    id: string;
    function: {
      name: string;
      arguments: Record<string, unknown>;
    };
  }>;
  toolCallId?: string;
  timestamp: Date;
}

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

// Mock tool executor
function executeTool(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case 'get_weather':
      return JSON.stringify({
        location: args.location,
        temperature: Math.round(Math.random() * 30 + 5),
        units: args.units || 'celsius',
        conditions: ['sunny', 'cloudy', 'rainy', 'windy'][Math.floor(Math.random() * 4)],
      });
    case 'web_search':
      return JSON.stringify({
        query: args.query,
        results: [
          { title: 'Result 1', url: 'https://example.com/1', snippet: 'Example search result...' },
          { title: 'Result 2', url: 'https://example.com/2', snippet: 'Another search result...' },
        ],
      });
    case 'calculate':
      try {
        const result = Function(`"use strict"; return (${args.expression})`)();
        return JSON.stringify({ expression: args.expression, result });
      } catch {
        return JSON.stringify({ error: 'Invalid expression' });
      }
    case 'get_datetime':
      return JSON.stringify({
        datetime: new Date().toISOString(),
        timezone: args.timezone || 'UTC',
      });
    default:
      return JSON.stringify({ 
        message: `Tool "${name}" executed with args: ${JSON.stringify(args)}`,
        note: 'This is a simulated response. Implement actual tool logic as needed.'
      });
  }
}

export function ToolsPlayground() {
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [messages, setMessages] = useState<ToolCallMessage[]>([]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [autoExecuteTools, setAutoExecuteTools] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  const { models, fetchModels } = useModelsStore();

  useEffect(() => {
    if (models.length === 0) {
      fetchModels();
    }
    if (!selectedModel && models.length > 0) {
      setSelectedModel(models[0].name);
    }
  }, [models, selectedModel, fetchModels]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Convert our tool definitions to Ollama format
  const toOllamaTools = useCallback((): Tool[] => {
    return tools.map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: Object.fromEntries(
            tool.parameters.map(p => [
              p.name,
              {
                type: p.type,
                description: p.description,
                ...(p.enum && { enum: p.enum }),
              },
            ])
          ),
          required: tool.parameters.filter(p => p.required).map(p => p.name),
        },
      },
    }));
  }, [tools]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !selectedModel || isGenerating) return;
    if (tools.length === 0) {
      toast({
        title: 'No tools defined',
        description: 'Add at least one tool to test tool calling',
        variant: 'destructive',
      });
      return;
    }

    const userMessage: ToolCallMessage = {
      id: generateId(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);
    setStreamingContent('');

    abortControllerRef.current = new AbortController();

    try {
      // Build chat messages
      const chatMessages: Message[] = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        tool_calls: msg.toolCalls,
      }));
      chatMessages.push({ role: 'user', content: userMessage.content });

      let fullContent = '';
      let toolCalls: ToolCallMessage['toolCalls'] = undefined;

      const stream = ollamaClient.chatStream({
        model: selectedModel,
        messages: chatMessages,
        tools: toOllamaTools(),
      });

      for await (const chunk of stream) {
        if (abortControllerRef.current?.signal.aborted) break;
        
        fullContent += chunk.message?.content || '';
        setStreamingContent(fullContent);

        if (chunk.message?.tool_calls) {
          toolCalls = chunk.message.tool_calls.map((tc: any) => ({
            id: generateId(),
            function: {
              name: tc.function?.name || '',
              arguments: tc.function?.arguments || {},
            },
          }));
        }
      }

      // Add assistant message
      const assistantMessage: ToolCallMessage = {
        id: generateId(),
        role: 'assistant',
        content: fullContent,
        toolCalls,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Auto-execute tools if enabled
      if (autoExecuteTools && toolCalls && toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
          const result = executeTool(toolCall.function.name, toolCall.function.arguments);
          
          const toolMessage: ToolCallMessage = {
            id: generateId(),
            role: 'tool',
            content: result,
            toolCallId: toolCall.id,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, toolMessage]);
        }

        // Continue conversation with tool results
        toast({ title: 'Tools executed', description: 'Continuing conversation with results...' });
      }

    } catch (error) {
      if (error instanceof Error && error.message !== 'aborted') {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setIsGenerating(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  }, [input, selectedModel, isGenerating, messages, tools, toOllamaTools, autoExecuteTools, toast]);

  const handleStop = () => {
    abortControllerRef.current?.abort();
    ollamaClient.abort();
    setIsGenerating(false);
  };

  const handleClear = () => {
    setMessages([]);
    setStreamingContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex">
      {/* Tool Builder Panel */}
      <div className="w-[400px] border-r-2 border-black dark:border-gray-700 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4">
            <ToolBuilder 
              tools={tools} 
              onToolsChange={setTools}
            />
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-black dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-orange-500" />
              <h1 className="text-xl font-bold">Tool Calling</h1>
            </div>

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
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoExecuteTools}
                onChange={(e) => setAutoExecuteTools(e.target.checked)}
                className="rounded"
              />
              Auto-execute tools
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={messages.length === 0}
              className="border-2 border-black dark:border-gray-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.length === 0 && !streamingContent && (
              <div className="text-center py-20">
                <Wrench className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                <h3 className="text-lg font-semibold text-gray-500">
                  Test Tool Calling
                </h3>
                <p className="text-sm text-gray-400 mt-2">
                  Add tools in the left panel, then chat to trigger tool calls
                </p>
              </div>
            )}

            {messages.map(message => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-3",
                  message.role === 'user' && "justify-end"
                )}
              >
                <Card className={cn(
                  "max-w-[80%] p-4 border-2",
                  message.role === 'user'
                    ? "bg-black text-white border-black dark:bg-white dark:text-black"
                    : message.role === 'tool'
                    ? "bg-orange-50 dark:bg-orange-900/20 border-orange-500"
                    : "bg-white dark:bg-gray-900 border-black dark:border-gray-700"
                )}>
                  {/* Role badge */}
                  <div className="flex items-center gap-2 mb-2">
                    {message.role === 'assistant' && (
                      <Badge variant="secondary">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Assistant
                      </Badge>
                    )}
                    {message.role === 'tool' && (
                      <Badge className="bg-orange-500">
                        <Wrench className="w-3 h-3 mr-1" />
                        Tool Result
                      </Badge>
                    )}
                  </div>

                  {/* Content */}
                  {message.content && (
                    <ChatMessageContent content={message.content} />
                  )}

                  {/* Tool Calls */}
                  {message.toolCalls && message.toolCalls.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.toolCalls.map(tc => (
                        <div 
                          key={tc.id}
                          className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Code className="w-4 h-4 text-orange-500" />
                            <span className="font-mono font-semibold text-sm">
                              {tc.function.name}()
                            </span>
                          </div>
                          <pre className="text-xs font-mono overflow-x-auto">
                            {JSON.stringify(tc.function.arguments, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}

            {/* Streaming */}
            {streamingContent && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <Card className="max-w-[80%] p-4 border-2 bg-white dark:bg-gray-900 border-black dark:border-gray-700">
                  <ChatMessageContent content={streamingContent} />
                  <span className="inline-block w-2 h-4 bg-orange-500 animate-pulse ml-1" />
                </Card>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t-2 border-black dark:border-gray-700">
          <div className="max-w-3xl mx-auto flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={tools.length > 0 
                ? "Ask something that requires using your tools..." 
                : "Add tools first..."
              }
              className="flex-1 min-h-[60px] resize-none border-2 border-black dark:border-gray-700"
              disabled={isGenerating || tools.length === 0}
            />
            {isGenerating ? (
              <Button
                onClick={handleStop}
                className="h-auto px-6 bg-red-500 hover:bg-red-600 text-white border-2 border-black"
              >
                <StopCircle className="w-5 h-5" />
              </Button>
            ) : (
              <Button
                onClick={handleSend}
                disabled={!input.trim() || !selectedModel || tools.length === 0}
                className="h-auto px-6 bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black border-2 border-black"
              >
                <Send className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
