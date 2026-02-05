/**
 * useStreamingChat Hook
 * 
 * Provides streaming chat functionality with token-by-token updates
 */

import { useState, useCallback, useRef } from 'react';
import { ollamaClient, Message } from '@/lib/ollama-client';
import { useChatStore } from '@/stores/chat-store';
import { useSettingsStore } from '@/stores/settings-store';
import { useActivityStore } from '@/stores/activity-store';

interface UseStreamingChatOptions {
  model?: string;
  systemPrompt?: string;
  onError?: (error: Error) => void;
  onComplete?: (fullResponse: string) => void;
}

interface StreamingChatReturn {
  sendMessage: (content: string, images?: string[]) => Promise<void>;
  sendStreamingMessage: (model: string, content: string, systemPrompt?: string, history?: Message[]) => Promise<string>;
  regenerate: (messageId: string) => Promise<void>;
  stop: () => void;
  abortStream: () => void;
  isGenerating: boolean;
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;
}

export function useStreamingChat(options: UseStreamingChatOptions = {}): StreamingChatReturn {
  const abortControllerRef = useRef<AbortController | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const {
    isGenerating,
    setGenerating,
    addMessage,
    updateMessage,
    appendToMessage,
    getActiveConversation,
    createConversation,
  } = useChatStore();
  
  const { settings } = useSettingsStore();
  const { addActivity } = useActivityStore();
  
  const defaultModel = settings?.defaultModel || 'gpt-oss:20b';
  const streamingEnabled = settings?.streamingEnabled ?? true;
  const model = options.model || defaultModel;

  // Simple streaming message function for AIAssistant
  const sendStreamingMessage = useCallback(async (
    modelName: string,
    content: string,
    systemPrompt?: string,
    history?: Message[]
  ): Promise<string> => {
    setIsStreaming(true);
    setStreamingContent('');
    setError(null);
    abortControllerRef.current = new AbortController();
    
    try {
      const messages: Message[] = [];
      
      // Add system prompt if provided
      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt,
        });
      }
      
      // Add history
      if (history) {
        messages.push(...history);
      }
      
      // Add current user message
      messages.push({
        role: 'user',
        content,
      });
      
      let fullResponse = '';
      
      const stream = ollamaClient.chatStream({
        model: modelName,
        messages,
      });
      
      for await (const chunk of stream) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }
        
        const token = chunk.message?.content || '';
        fullResponse += token;
        setStreamingContent(fullResponse);
      }
      
      return fullResponse;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, []);

  const abortStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      ollamaClient.abort();
    }
    setIsStreaming(false);
    setGenerating(false);
  }, [setGenerating]);

  const sendMessage = useCallback(async (content: string, images?: string[]) => {
    let conversationId = getActiveConversation()?.id;
    
    // Create conversation if none exists
    if (!conversationId) {
      conversationId = createConversation(model, options.systemPrompt);
    }
    
    // Add user message
    addMessage(conversationId, {
      role: 'user',
      content,
      images,
    });
    
    // Create placeholder for assistant response
    const assistantMessageId = addMessage(conversationId, {
      role: 'assistant',
      content: '',
      isStreaming: true,
      model,
    });
    
    setGenerating(true);
    abortControllerRef.current = new AbortController();
    
    try {
      // Build messages array for chat
      const conversation = useChatStore.getState().getConversationById(conversationId);
      if (!conversation) throw new Error('Conversation not found');
      
      const messages: Message[] = [];
      
      // Add system prompt if provided
      if (options.systemPrompt) {
        messages.push({
          role: 'system',
          content: options.systemPrompt,
        });
      }
      
      // Add conversation history (excluding the streaming placeholder)
      for (const msg of conversation.messages) {
        if (msg.id === assistantMessageId) continue;
        messages.push({
          role: msg.role,
          content: msg.content,
          images: msg.images,
        });
      }
      
      let fullResponse = '';
      
      if (streamingEnabled) {
        // Streaming mode
        const stream = ollamaClient.chatStream({
          model,
          messages,
        });
        
        for await (const chunk of stream) {
          if (abortControllerRef.current?.signal.aborted) {
            break;
          }
          
          const token = chunk.message?.content || '';
          fullResponse += token;
          
          appendToMessage(conversationId!, assistantMessageId, token);
        }
      } else {
        // Non-streaming mode
        const response = await ollamaClient.chat({
          model,
          messages,
          stream: false,
        });
        
        fullResponse = response.message?.content || '';
        updateMessage(conversationId!, assistantMessageId, {
          content: fullResponse,
        });
      }
      
      // Mark message as complete
      updateMessage(conversationId!, assistantMessageId, {
        isStreaming: false,
        stats: {
          // Stats would come from the final response
        },
      });
      
      options.onComplete?.(fullResponse);
      
      addActivity({
        type: 'chat_started',
        title: 'Chat message sent',
        description: `Used ${model}`,
      });
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      
      if (err.name !== 'AbortError') {
        updateMessage(conversationId!, assistantMessageId, {
          content: `Error: ${err.message}`,
          isStreaming: false,
        });
        
        options.onError?.(err);
        
        addActivity({
          type: 'error',
          title: 'Chat error',
          description: err.message,
        });
      }
    } finally {
      setGenerating(false);
      abortControllerRef.current = null;
    }
  }, [model, options, addMessage, updateMessage, appendToMessage, getActiveConversation, createConversation, setGenerating, addActivity, streamingEnabled]);

  const regenerate = useCallback(async (messageId: string) => {
    const conversation = getActiveConversation();
    if (!conversation) return;
    
    // Find the message and get the previous user message
    const messageIndex = conversation.messages.findIndex(m => m.id === messageId);
    if (messageIndex < 0) return;
    
    // Find the preceding user message
    let userMessage: typeof conversation.messages[0] | undefined;
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (conversation.messages[i].role === 'user') {
        userMessage = conversation.messages[i];
        break;
      }
    }
    
    if (!userMessage) return;
    
    // Delete the current assistant message and regenerate
    useChatStore.getState().deleteMessage(conversation.id, messageId);
    await sendMessage(userMessage.content, userMessage.images);
  }, [getActiveConversation, sendMessage]);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      ollamaClient.abort();
    }
    setGenerating(false);
  }, [setGenerating]);

  return {
    sendMessage,
    sendStreamingMessage,
    regenerate,
    stop,
    abortStream,
    isGenerating,
    isStreaming,
    streamingContent,
    error,
  };
}
