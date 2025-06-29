import { ModelFile } from '@/types/ollama';

class ModelFileService {
  private readonly STORAGE_KEY = 'ollama-modelfiles';

  async getModelFiles(): Promise<ModelFile[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading ModelFiles:', error);
      return [];
    }
  }

  async saveModelFile(modelFile: Omit<ModelFile, 'id' | 'createdAt' | 'updatedAt'>): Promise<ModelFile> {
    try {
      const modelFiles = await this.getModelFiles();
      
      const newModelFile: ModelFile = {
        ...modelFile,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      modelFiles.push(newModelFile);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(modelFiles));
      
      return newModelFile;
    } catch (error) {
      console.error('Error saving ModelFile:', error);
      throw error;
    }
  }

  async updateModelFile(id: string, updates: Partial<ModelFile>): Promise<ModelFile> {
    try {
      const modelFiles = await this.getModelFiles();
      const index = modelFiles.findIndex(mf => mf.id === id);
      
      if (index === -1) {
        throw new Error('ModelFile not found');
      }

      const updatedModelFile = {
        ...modelFiles[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      modelFiles[index] = updatedModelFile;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(modelFiles));
      
      return updatedModelFile;
    } catch (error) {
      console.error('Error updating ModelFile:', error);
      throw error;
    }
  }

  async deleteModelFile(id: string): Promise<void> {
    try {
      const modelFiles = await this.getModelFiles();
      const filtered = modelFiles.filter(mf => mf.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting ModelFile:', error);
      throw error;
    }
  }

  async duplicateModelFile(id: string, newName: string): Promise<ModelFile> {
    try {
      const modelFiles = await this.getModelFiles();
      const original = modelFiles.find(mf => mf.id === id);
      
      if (!original) {
        throw new Error('ModelFile not found');
      }

      return this.saveModelFile({
        ...original,
        name: newName,
      });
    } catch (error) {
      console.error('Error duplicating ModelFile:', error);
      throw error;
    }
  }
}

export const modelFileService = new ModelFileService();