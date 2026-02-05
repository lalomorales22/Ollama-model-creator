/**
 * ModelFile Service
 * 
 * Legacy compatibility layer that wraps the new Zustand store.
 * 
 * @deprecated Use useModelFilesStore directly
 */

import { useModelFilesStore } from '@/stores/modelfiles-store';
import type { ModelFile } from '@/types';

class ModelFileService {
  /**
   * Get all ModelFiles
   */
  async getModelFiles(): Promise<ModelFile[]> {
    return useModelFilesStore.getState().modelFiles;
  }

  /**
   * Save a new ModelFile
   */
  async saveModelFile(modelFile: Omit<ModelFile, 'id' | 'createdAt' | 'updatedAt'>): Promise<ModelFile> {
    return useModelFilesStore.getState().addModelFile(modelFile);
  }

  /**
   * Update an existing ModelFile
   */
  async updateModelFile(id: string, updates: Partial<ModelFile>): Promise<ModelFile> {
    useModelFilesStore.getState().updateModelFile(id, updates);
    const updated = useModelFilesStore.getState().getModelFileById(id);
    if (!updated) throw new Error('ModelFile not found');
    return updated;
  }

  /**
   * Delete a ModelFile
   */
  async deleteModelFile(id: string): Promise<void> {
    useModelFilesStore.getState().deleteModelFile(id);
  }

  /**
   * Duplicate a ModelFile
   */
  async duplicateModelFile(id: string, newName: string): Promise<ModelFile> {
    const result = useModelFilesStore.getState().duplicateModelFile(id, newName);
    if (!result) throw new Error('Failed to duplicate ModelFile');
    return result;
  }
}

export const modelFileService = new ModelFileService();
