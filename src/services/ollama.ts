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
      // Clean the model name - remove any invalid characters
      const cleanName = name.trim().replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
      if (!cleanName) {
        throw new Error('Invalid model name. Use only letters, numbers, hyphens, and underscores.');
      }

      // Validate and clean the modelfile before sending
      const validation = this.validateModelFile(modelfile);
      if (!validation.isValid) {
        throw new Error(`ModelFile validation failed: ${validation.errors.join(', ')}`);
      }

      // Clean and ensure proper formatting
      const cleanedModelfile = this.cleanModelFile(modelfile);
      
      console.log('Creating model with ModelFile:', cleanedModelfile);
      
      // Create the request payload
      const payload = {
        name: cleanName,
        modelfile: cleanedModelfile
      };

      console.log('Sending payload:', JSON.stringify(payload, null, 2));
      
      const response = await fetch(`${OLLAMA_BASE_URL}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Create model error response:', errorText);
        
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
    let hasFromInstruction = false;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines but preserve them for formatting
      if (!trimmedLine) {
        cleanedLines.push('');
        continue;
      }

      // Skip comments
      if (trimmedLine.startsWith('#')) {
        cleanedLines.push(trimmedLine);
        continue;
      }

      // Check for FROM instruction - this is critical
      if (trimmedLine.toUpperCase().startsWith('FROM ')) {
        hasFromInstruction = true;
        // Ensure FROM instruction is properly formatted
        const parts = trimmedLine.split(/\s+/);
        if (parts.length >= 2 && parts[1].trim()) {
          // Clean the model name - remove any quotes or extra characters
          const modelName = parts[1].trim().replace(/['"]/g, '');
          cleanedLines.push(`FROM ${modelName}`);
        } else {
          throw new Error('FROM instruction must specify a valid base model name');
        }
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
        continue;
      }

      // Handle SYSTEM instruction to ensure proper quoting
      if (trimmedLine.toUpperCase().startsWith('SYSTEM ')) {
        const systemContent = trimmedLine.substring(7).trim();
        
        // Remove existing quotes and re-add proper triple quotes
        let cleanContent = systemContent;
        if (cleanContent.startsWith('"') && cleanContent.endsWith('"')) {
          cleanContent = cleanContent.slice(1, -1);
        } else if (cleanContent.startsWith("'") && cleanContent.endsWith("'")) {
          cleanContent = cleanContent.slice(1, -1);
        } else if (cleanContent.startsWith('"""') && cleanContent.endsWith('"""')) {
          cleanContent = cleanContent.slice(3, -3);
        }
        
        cleanedLines.push(`SYSTEM """${cleanContent}"""`);
        continue;
      }

      // For all other lines, keep as-is
      cleanedLines.push(trimmedLine);
    }

    // If no FROM instruction was found, this is a critical error
    if (!hasFromInstruction) {
      throw new Error('ModelFile must contain a FROM instruction specifying the base model');
    }

    const result = cleanedLines.join('\n');
    console.log('Cleaned ModelFile:', result);
    return result;
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
    const lines = modelfile.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));

    // Check for required FROM instruction
    const fromLines = lines.filter(line => line.toUpperCase().startsWith('FROM '));
    if (fromLines.length === 0) {
      errors.push('ModelFile must contain a FROM instruction specifying the base model');
    } else if (fromLines.length > 1) {
      errors.push('ModelFile can only contain one FROM instruction');
    } else {
      // Validate FROM instruction has a model name
      const fromParts = fromLines[0].split(/\s+/);
      if (fromParts.length < 2 || !fromParts[1].trim()) {
        errors.push('FROM instruction must specify a base model name');
      } else {
        // Check if the model name looks valid
        const modelName = fromParts[1].trim();
        if (!/^[a-zA-Z0-9._:-]+$/.test(modelName)) {
          errors.push(`Invalid base model name: ${modelName}. Use only letters, numbers, dots, colons, and hyphens.`);
        }
      }
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
          } else {
            // Validate parameter ranges
            switch (paramName) {
              case 'temperature':
                if (numValue < 0.1 || numValue > 2.0) {
                  errors.push(`Temperature must be between 0.1 and 2.0, got: ${numValue}`);
                }
                break;
              case 'top_p':
                if (numValue < 0.1 || numValue > 1.0) {
                  errors.push(`Top P must be between 0.1 and 1.0, got: ${numValue}`);
                }
                break;
              case 'top_k':
                if (numValue < 1 || numValue > 100 || !Number.isInteger(numValue)) {
                  errors.push(`Top K must be an integer between 1 and 100, got: ${numValue}`);
                }
                break;
              case 'repeat_penalty':
                if (numValue < 0.5 || numValue > 2.0) {
                  errors.push(`Repeat penalty must be between 0.5 and 2.0, got: ${numValue}`);
                }
                break;
              case 'num_ctx':
                if (numValue < 512 || numValue > 32768 || !Number.isInteger(numValue)) {
                  errors.push(`Context length must be an integer between 512 and 32768, got: ${numValue}`);
                }
                break;
            }
          }
        }
      }
    }

    // Validate SYSTEM instruction format
    const systemLines = lines.filter(line => line.toUpperCase().startsWith('SYSTEM '));
    for (const systemLine of systemLines) {
      const systemContent = systemLine.substring(7).trim();
      if (!systemContent) {
        errors.push(`SYSTEM instruction cannot be empty: ${systemLine}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Check if a model exists in the available models
  async checkModelExists(modelName: string): Promise<boolean> {
    try {
      const models = await this.getModels();
      return models.some(model => model.name === modelName);
    } catch (error) {
      console.error('Error checking if model exists:', error);
      return false;
    }
  }
}

export const ollamaService = new OllamaService();