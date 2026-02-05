/**
 * ModelFiles Store
 * 
 * Manages the ModelFile collection with persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ModelFile, ModelFileParameters } from '@/types';
import { STORAGE_KEYS } from '@/lib/constants';

interface ModelFilesStore {
  // State
  modelFiles: ModelFile[];
  isLoading: boolean;

  // Actions
  addModelFile: (modelFile: Omit<ModelFile, 'id' | 'createdAt' | 'updatedAt'>) => ModelFile;
  updateModelFile: (id: string, updates: Partial<ModelFile>) => void;
  deleteModelFile: (id: string) => void;
  duplicateModelFile: (id: string, newName: string) => ModelFile | null;
  getModelFileById: (id: string) => ModelFile | undefined;
  importModelFile: (content: string, name: string) => ModelFile;
  exportModelFile: (id: string) => string | null;
  
  // Parsing utilities
  parseModelFile: (content: string) => {
    baseModel: string;
    parameters: ModelFileParameters;
    system?: string;
    template?: string;
  };
  
  reset: () => void;
}

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

const initialState = {
  modelFiles: [] as ModelFile[],
  isLoading: false,
};

export const useModelFilesStore = create<ModelFilesStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      addModelFile: (modelFile) => {
        const id = generateId();
        const now = new Date().toISOString();
        
        const newModelFile: ModelFile = {
          ...modelFile,
          id,
          createdAt: now,
          updatedAt: now,
        };

        set(state => ({
          modelFiles: [newModelFile, ...state.modelFiles],
        }));

        return newModelFile;
      },

      updateModelFile: (id, updates) => {
        set(state => ({
          modelFiles: state.modelFiles.map(mf =>
            mf.id === id
              ? { ...mf, ...updates, updatedAt: new Date().toISOString() }
              : mf
          ),
        }));
      },

      deleteModelFile: (id) => {
        set(state => ({
          modelFiles: state.modelFiles.filter(mf => mf.id !== id),
        }));
      },

      duplicateModelFile: (id, newName) => {
        const original = get().modelFiles.find(mf => mf.id === id);
        if (!original) return null;

        return get().addModelFile({
          ...original,
          name: newName,
        });
      },

      getModelFileById: (id) => {
        return get().modelFiles.find(mf => mf.id === id);
      },

      importModelFile: (content, name) => {
        const parsed = get().parseModelFile(content);
        
        return get().addModelFile({
          name,
          content,
          baseModel: parsed.baseModel,
          parameters: parsed.parameters,
          system: parsed.system,
          template: parsed.template,
        });
      },

      exportModelFile: (id) => {
        const modelFile = get().modelFiles.find(mf => mf.id === id);
        return modelFile?.content || null;
      },

      parseModelFile: (content) => {
        const lines = content.split('\n');
        let baseModel = 'llama3.2';
        const parameters: ModelFileParameters = {};
        let system: string | undefined;
        let template: string | undefined;

        let inSystem = false;
        let inTemplate = false;
        let multilineContent = '';
        let multilineDelimiter = '';

        for (const line of lines) {
          const trimmed = line.trim();

          // Handle multiline content
          if (inSystem || inTemplate) {
            if (trimmed === multilineDelimiter || trimmed.endsWith(multilineDelimiter)) {
              if (inSystem) {
                system = multilineContent.trim();
                inSystem = false;
              } else {
                template = multilineContent.trim();
                inTemplate = false;
              }
              multilineContent = '';
              multilineDelimiter = '';
            } else {
              multilineContent += line + '\n';
            }
            continue;
          }

          // FROM instruction
          if (trimmed.toUpperCase().startsWith('FROM ')) {
            baseModel = trimmed.substring(5).trim();
            continue;
          }

          // PARAMETER instruction
          if (trimmed.toUpperCase().startsWith('PARAMETER ')) {
            const parts = trimmed.substring(10).trim().split(/\s+/);
            if (parts.length >= 2) {
              const paramName = parts[0];
              const paramValue = parts.slice(1).join(' ');
              
              // Parse numeric values
              const numValue = parseFloat(paramValue);
              if (!isNaN(numValue)) {
                parameters[paramName] = numValue;
              } else {
                parameters[paramName] = paramValue;
              }
            }
            continue;
          }

          // SYSTEM instruction
          if (trimmed.toUpperCase().startsWith('SYSTEM ')) {
            const content = trimmed.substring(7).trim();
            
            // Check for multiline
            if (content.startsWith('"""')) {
              inSystem = true;
              multilineDelimiter = '"""';
              multilineContent = content.substring(3);
              if (content.endsWith('"""') && content.length > 6) {
                system = content.slice(3, -3);
                inSystem = false;
              }
            } else if (content.startsWith('"') && content.endsWith('"')) {
              system = content.slice(1, -1);
            } else {
              system = content;
            }
            continue;
          }

          // TEMPLATE instruction
          if (trimmed.toUpperCase().startsWith('TEMPLATE ')) {
            const content = trimmed.substring(9).trim();
            
            if (content.startsWith('"""')) {
              inTemplate = true;
              multilineDelimiter = '"""';
              multilineContent = content.substring(3);
              if (content.endsWith('"""') && content.length > 6) {
                template = content.slice(3, -3);
                inTemplate = false;
              }
            } else if (content.startsWith('"') && content.endsWith('"')) {
              template = content.slice(1, -1);
            } else {
              template = content;
            }
            continue;
          }
        }

        return { baseModel, parameters, system, template };
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: STORAGE_KEYS.MODELFILES,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        modelFiles: state.modelFiles,
      }),
    }
  )
);
