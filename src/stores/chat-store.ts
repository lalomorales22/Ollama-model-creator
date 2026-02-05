/**
 * Chat Store
 * 
 * Manages chat conversations and history with persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ChatMessage, Conversation } from '@/types';
import { STORAGE_KEYS } from '@/lib/constants';

interface ChatStore {
  // State
  conversations: Conversation[];
  activeConversationId: string | null;
  isGenerating: boolean;
  abortController: AbortController | null;

  // Computed (via getters in actions)
  getActiveConversation: () => Conversation | undefined;
  getConversationById: (id: string) => Conversation | undefined;

  // Actions
  createConversation: (model: string, systemPrompt?: string) => string;
  setActiveConversation: (id: string | null) => void;
  deleteConversation: (id: string) => void;
  clearAllConversations: () => void;
  renameConversation: (id: string, title: string) => void;
  
  // Message Actions
  addMessage: (conversationId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => string;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<ChatMessage>) => void;
  appendToMessage: (conversationId: string, messageId: string, content: string) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  
  // Generation State
  setGenerating: (isGenerating: boolean) => void;
  setAbortController: (controller: AbortController | null) => void;
  abortGeneration: () => void;
  
  // Utility
  reset: () => void;
}

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

const initialState = {
  conversations: [] as Conversation[],
  activeConversationId: null as string | null,
  isGenerating: false,
  abortController: null as AbortController | null,
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      getActiveConversation: () => {
        const { conversations, activeConversationId } = get();
        return conversations.find(c => c.id === activeConversationId);
      },

      getConversationById: (id: string) => {
        return get().conversations.find(c => c.id === id);
      },

      createConversation: (model: string, systemPrompt?: string) => {
        const id = generateId();
        const now = new Date().toISOString();
        
        const conversation: Conversation = {
          id,
          title: 'New Conversation',
          messages: [],
          model,
          systemPrompt,
          createdAt: now,
          updatedAt: now,
        };

        set(state => ({
          conversations: [conversation, ...state.conversations],
          activeConversationId: id,
        }));

        return id;
      },

      setActiveConversation: (id: string | null) => {
        set({ activeConversationId: id });
      },

      deleteConversation: (id: string) => {
        set(state => ({
          conversations: state.conversations.filter(c => c.id !== id),
          activeConversationId: state.activeConversationId === id 
            ? (state.conversations[0]?.id || null)
            : state.activeConversationId,
        }));
      },

      clearAllConversations: () => {
        set({ conversations: [], activeConversationId: null });
      },

      renameConversation: (id: string, title: string) => {
        set(state => ({
          conversations: state.conversations.map(c =>
            c.id === id
              ? { ...c, title, updatedAt: new Date().toISOString() }
              : c
          ),
        }));
      },

      addMessage: (conversationId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
        const id = generateId();
        const now = new Date().toISOString();
        
        const newMessage: ChatMessage = {
          ...message,
          id,
          timestamp: now,
        };

        set(state => ({
          conversations: state.conversations.map(c => {
            if (c.id !== conversationId) return c;
            
            // Auto-generate title from first user message
            let title = c.title;
            if (c.messages.length === 0 && message.role === 'user') {
              title = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '');
            }
            
            return {
              ...c,
              title,
              messages: [...c.messages, newMessage],
              updatedAt: now,
            };
          }),
        }));

        return id;
      },

      updateMessage: (conversationId: string, messageId: string, updates: Partial<ChatMessage>) => {
        set(state => ({
          conversations: state.conversations.map(c =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map(m =>
                    m.id === messageId ? { ...m, ...updates } : m
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : c
          ),
        }));
      },

      appendToMessage: (conversationId: string, messageId: string, content: string) => {
        set(state => ({
          conversations: state.conversations.map(c =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map(m =>
                    m.id === messageId 
                      ? { ...m, content: m.content + content }
                      : m
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : c
          ),
        }));
      },

      deleteMessage: (conversationId: string, messageId: string) => {
        set(state => ({
          conversations: state.conversations.map(c =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.filter(m => m.id !== messageId),
                  updatedAt: new Date().toISOString(),
                }
              : c
          ),
        }));
      },

      setGenerating: (isGenerating: boolean) => {
        set({ isGenerating });
      },

      setAbortController: (controller: AbortController | null) => {
        set({ abortController: controller });
      },

      abortGeneration: () => {
        const { abortController } = get();
        if (abortController) {
          abortController.abort();
        }
        set({ isGenerating: false, abortController: null });
      },

      reset: () => {
        const { abortController } = get();
        if (abortController) {
          abortController.abort();
        }
        set(initialState);
      },
    }),
    {
      name: STORAGE_KEYS.CHAT_HISTORY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
      }),
    }
  )
);
