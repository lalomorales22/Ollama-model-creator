import { OllamaModel, OllamaResponse } from '@/types/ollama';

const OLLAMA_BASE_URL = 'http://localhost:11434/api';

class OllamaService {
  async getModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/tags`);
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }

  async generateResponse(model: string, prompt: string, stream: boolean = false): Promise<OllamaResponse> {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt,
          stream
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate response');
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }

  async createModel(name: string, modelfile: string): Promise<void> {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          modelfile,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create model');
      }
    } catch (error) {
      console.error('Error creating model:', error);
      throw error;
    }
  }

  async deleteModel(name: string): Promise<void> {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: name }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete model');
      }
    } catch (error) {
      console.error('Error deleting model:', error);
      throw error;
    }
  }

  async copyModel(source: string, destination: string): Promise<void> {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/copy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ source, destination }),
      });

      if (!response.ok) {
        throw new Error('Failed to copy model');
      }
    } catch (error) {
      console.error('Error copying model:', error);
      throw error;
    }
  }

  async pullModel(name: string): Promise<void> {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: name }),
      });

      if (!response.ok) {
        throw new Error('Failed to pull model');
      }
    } catch (error) {
      console.error('Error pulling model:', error);
      throw error;
    }
  }

  async getModelInfo(name: string): Promise<any> {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/show`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: name }),
      });

      if (!response.ok) {
        throw new Error('Failed to get model info');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting model info:', error);
      throw error;
    }
  }

  async getRunningModels(): Promise<any[]> {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/ps`);
      if (!response.ok) {
        throw new Error('Failed to fetch running models');
      }
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Error fetching running models:', error);
      throw error;
    }
  }

  async getVersion(): Promise<string> {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/version`);
      if (!response.ok) {
        throw new Error('Failed to fetch version');
      }
      const data = await response.json();
      return data.version;
    } catch (error) {
      console.error('Error fetching version:', error);
      throw error;
    }
  }
}

export const ollamaService = new OllamaService();