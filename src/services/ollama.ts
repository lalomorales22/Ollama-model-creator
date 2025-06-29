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

  async createModel(name: string, modelfile: string, onProgress?: (progress: string) => void): Promise<void> {
    try {
      // Validate and clean the modelfile before sending
      const cleanedModelfile = this.cleanModelFile(modelfile);
      
      const response = await fetch(`${OLLAMA_BASE_URL}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          modelfile: cleanedModelfile,
          stream: true
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to create model: ${response.status} ${response.statusText}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use the text as error message
          if (errorText) {
            errorMessage = errorText;
          }
        }
        
        throw new Error(errorMessage);
      }

      // Handle streaming response for progress updates
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
              try {
                const data = JSON.parse(line);
                
                // Handle different types of status updates
                if (data.status && onProgress) {
                  // Ensure status is a string
                  const statusMessage = typeof data.status === 'string' ? data.status : JSON.stringify(data.status);
                  onProgress(statusMessage);
                }
                
                // Handle progress with additional context
                if (data.digest && data.total && data.completed && onProgress) {
                  const percent = Math.round((data.completed / data.total) * 100);
                  onProgress(`${data.status || 'Processing'}: ${percent}%`);
                }
                
                // Handle error responses
                if (data.error) {
                  throw new Error(data.error);
                }
                
                // Check if creation is complete
                if (data.status === 'success' || (data.done && data.status)) {
                  if (onProgress) {
                    onProgress('Model created successfully!');
                  }
                  break;
                }
              } catch (parseError) {
                // Ignore JSON parse errors for incomplete chunks
                if (parseError instanceof SyntaxError) continue;
                throw parseError;
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      }
    } catch (error) {
      console.error('Error creating model:', error);
      throw error;
    }
  }

  // Clean and validate ModelFile content
  private cleanModelFile(modelfile: string): string {
    const lines = modelfile.split('\n');
    const cleanedLines: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        cleanedLines.push('');
        continue;
      }

      // Handle PARAMETER lines specially to ensure proper numeric formatting
      if (trimmedLine.toUpperCase().startsWith('PARAMETER ')) {
        const parts = trimmedLine.split(/\s+/);
        if (parts.length >= 3) {
          const paramName = parts[1];
          const paramValue = parts.slice(2).join(' ');
          
          // Clean numeric values
          const cleanedValue = this.cleanParameterValue(paramName, paramValue);
          cleanedLines.push(`PARAMETER ${paramName} ${cleanedValue}`);
        } else {
          cleanedLines.push(trimmedLine);
        }
      } else {
        cleanedLines.push(trimmedLine);
      }
    }

    return cleanedLines.join('\n');
  }

  // Clean parameter values to ensure they're properly formatted
  private cleanParameterValue(paramName: string, value: string): string {
    const numericParams = ['temperature', 'top_p', 'top_k', 'repeat_penalty', 'num_ctx', 'num_predict'];
    
    if (numericParams.includes(paramName.toLowerCase())) {
      // Remove any non-numeric characters except decimal points
      const cleaned = value.replace(/[^0-9.]/g, '');
      const parsed = parseFloat(cleaned);
      
      if (isNaN(parsed)) {
        // Return default values for common parameters
        const defaults: Record<string, string> = {
          'temperature': '0.8',
          'top_p': '0.9',
          'top_k': '40',
          'repeat_penalty': '1.1',
          'num_ctx': '2048',
          'num_predict': '128'
        };
        return defaults[paramName.toLowerCase()] || '1.0';
      }
      
      return parsed.toString();
    }
    
    return value;
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete model');
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to copy model');
      }
    } catch (error) {
      console.error('Error copying model:', error);
      throw error;
    }
  }

  async pullModel(name: string, onProgress?: (progress: string) => void): Promise<void> {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          model: name,
          stream: true 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to pull model');
      }

      // Handle streaming response for progress updates
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
              try {
                const data = JSON.parse(line);
                
                // Handle different types of status updates
                if (data.status && onProgress) {
                  // Ensure status is a string
                  const statusMessage = typeof data.status === 'string' ? data.status : JSON.stringify(data.status);
                  onProgress(statusMessage);
                }
                
                // Handle progress with additional context
                if (data.digest && data.total && data.completed && onProgress) {
                  const percent = Math.round((data.completed / data.total) * 100);
                  onProgress(`${data.status || 'Downloading'}: ${percent}%`);
                }
                
                if (data.error) {
                  throw new Error(data.error);
                }
              } catch (parseError) {
                // Ignore JSON parse errors for incomplete chunks
                if (parseError instanceof SyntaxError) continue;
                throw parseError;
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get model info');
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

  // Validate ModelFile syntax before creating model
  validateModelFile(modelfile: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const lines = modelfile.split('\n').map(line => line.trim()).filter(line => line);

    // Check for required FROM instruction
    const hasFrom = lines.some(line => line.toUpperCase().startsWith('FROM '));
    if (!hasFrom) {
      errors.push('ModelFile must contain a FROM instruction specifying the base model');
    }

    // Validate FROM instruction format
    const fromLines = lines.filter(line => line.toUpperCase().startsWith('FROM '));
    if (fromLines.length > 1) {
      errors.push('ModelFile can only contain one FROM instruction');
    }

    // Validate PARAMETER instructions
    const parameterLines = lines.filter(line => line.toUpperCase().startsWith('PARAMETER '));
    for (const paramLine of parameterLines) {
      const parts = paramLine.split(/\s+/);
      if (parts.length < 3) {
        errors.push(`Invalid PARAMETER instruction: ${paramLine}`);
      } else {
        // Validate numeric parameters
        const paramName = parts[1].toLowerCase();
        const paramValue = parts[2];
        
        if (['temperature', 'top_p', 'top_k', 'repeat_penalty', 'num_ctx', 'num_predict'].includes(paramName)) {
          const numValue = parseFloat(paramValue);
          if (isNaN(numValue)) {
            errors.push(`Invalid numeric value for ${paramName}: ${paramValue}`);
          }
        }
      }
    }

    // Validate SYSTEM instruction format
    const systemLines = lines.filter(line => line.toUpperCase().startsWith('SYSTEM '));
    for (const systemLine of systemLines) {
      if (!systemLine.includes('"') && !systemLine.includes("'")) {
        errors.push(`SYSTEM instruction should be quoted: ${systemLine}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const ollamaService = new OllamaService();