/**
 * Advanced ModelFile Editor
 * 
 * Full-featured code editor with Monaco for ModelFile editing
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor, { Monaco, useMonaco } from '@monaco-editor/react';
import { 
  Play, 
  Copy, 
  Download, 
  Upload, 
  Check,
  AlertCircle,
  Loader2,
  Eye,
  Code,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useModelsStore } from '@/stores/models-store';
import { useModelFilesStore } from '@/stores/modelfiles-store';
import { ollamaClient } from '@/lib/ollama-client';
import { cn } from '@/lib/utils';

// ModelFile templates
const TEMPLATES = {
  basic: `# Basic ModelFile Template
FROM llama3.2

# Set parameters for balanced output
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER top_k 40

# Define the system behavior
SYSTEM """
You are a helpful assistant. You provide clear and concise answers.
"""
`,
  coding: `# Coding Assistant ModelFile
FROM codellama

# Lower temperature for precise code
PARAMETER temperature 0.2
PARAMETER top_p 0.9
PARAMETER num_ctx 8192

SYSTEM """
You are an expert programmer. You write clean, efficient, well-documented code.
Always explain your code and suggest best practices.
When asked to write code:
1. First understand the requirements
2. Plan the solution
3. Write clean, readable code
4. Add helpful comments
5. Suggest improvements if applicable
"""
`,
  creative: `# Creative Writing ModelFile
FROM mistral

# Higher temperature for creativity
PARAMETER temperature 1.2
PARAMETER top_p 0.95
PARAMETER repeat_penalty 1.05

SYSTEM """
You are a creative writing assistant with a vivid imagination.
You craft engaging stories, poems, and creative content.
Your writing is:
- Original and imaginative
- Rich in detail and description
- Emotionally resonant
- Stylistically varied
"""
`,
  analyst: `# Data Analyst ModelFile
FROM llama3.2

PARAMETER temperature 0.3
PARAMETER top_p 0.85

SYSTEM """
You are a data analysis expert. You help users understand data,
perform statistical analysis, and derive insights.

Your approach:
1. Clarify the data and question
2. Suggest appropriate analysis methods
3. Explain statistical concepts clearly
4. Provide actionable insights
5. Acknowledge limitations and assumptions
"""
`,
  roleplay: `# Character Roleplay ModelFile
FROM mistral

PARAMETER temperature 0.9
PARAMETER top_p 0.95
PARAMETER repeat_penalty 1.1

SYSTEM """
You are a creative roleplay assistant. You can embody any character
the user describes. Stay in character consistently.

Guidelines:
- Respond as the character would
- Use appropriate language and mannerisms
- Maintain character consistency
- Be creative but appropriate
"""

# Example conversation
MESSAGE user Can you roleplay as a wise wizard?
MESSAGE assistant *adjusts flowing robes and strokes long beard* Ah, a seeker of knowledge approaches! I am Aldric the Wise, keeper of ancient secrets. What wisdom do you seek, young traveler?
`,
};

// ModelFile validation
interface ValidationError {
  line: number;
  message: string;
  severity: 'error' | 'warning';
}

function validateModelFile(content: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const lines = content.split('\n');
  
  let hasFrom = false;
  const validInstructions = ['FROM', 'PARAMETER', 'SYSTEM', 'TEMPLATE', 'MESSAGE', 'ADAPTER', 'LICENSE'];
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) return;
    
    const firstWord = trimmed.split(/\s+/)[0].toUpperCase();
    
    if (firstWord === 'FROM') {
      if (hasFrom) {
        errors.push({
          line: index + 1,
          message: 'Multiple FROM instructions found. Only one is allowed.',
          severity: 'error',
        });
      }
      hasFrom = true;
      
      const modelName = trimmed.substring(4).trim();
      if (!modelName) {
        errors.push({
          line: index + 1,
          message: 'FROM instruction requires a model name.',
          severity: 'error',
        });
      }
    } else if (firstWord === 'PARAMETER') {
      const parts = trimmed.split(/\s+/);
      if (parts.length < 3) {
        errors.push({
          line: index + 1,
          message: 'PARAMETER requires a name and value.',
          severity: 'error',
        });
      }
    } else if (firstWord === 'MESSAGE') {
      const parts = trimmed.split(/\s+/);
      if (parts.length < 3) {
        errors.push({
          line: index + 1,
          message: 'MESSAGE requires a role and content.',
          severity: 'error',
        });
      }
      const role = parts[1]?.toLowerCase();
      if (role && !['user', 'assistant', 'system'].includes(role)) {
        errors.push({
          line: index + 1,
          message: `Invalid role "${role}". Use user, assistant, or system.`,
          severity: 'error',
        });
      }
    } else if (!validInstructions.includes(firstWord)) {
      errors.push({
        line: index + 1,
        message: `Unknown instruction "${firstWord}".`,
        severity: 'warning',
      });
    }
  });
  
  if (!hasFrom) {
    errors.push({
      line: 1,
      message: 'ModelFile must have a FROM instruction.',
      severity: 'error',
    });
  }
  
  return errors;
}

// Monaco language configuration
function configureMonaco(monaco: Monaco) {
  // Register ModelFile language
  monaco.languages.register({ id: 'modelfile' });
  
  // Syntax highlighting
  monaco.languages.setMonarchTokensProvider('modelfile', {
    defaultToken: '',
    tokenPostfix: '.modelfile',
    
    keywords: ['FROM', 'PARAMETER', 'SYSTEM', 'TEMPLATE', 'MESSAGE', 'ADAPTER', 'LICENSE'],
    
    tokenizer: {
      root: [
        [/#.*$/, 'comment'],
        [/"""/, { token: 'string.quote', next: '@multistring' }],
        [/"[^"]*"/, 'string'],
        [/\b(FROM|PARAMETER|SYSTEM|TEMPLATE|MESSAGE|ADAPTER|LICENSE)\b/, 'keyword'],
        [/\b(temperature|top_p|top_k|num_ctx|num_predict|repeat_penalty|seed|stop)\b/, 'type'],
        [/\b(user|assistant|system)\b/, 'variable'],
        [/\b\d+\.?\d*\b/, 'number'],
      ],
      multistring: [
        [/[^"]+/, 'string'],
        [/"""/, { token: 'string.quote', next: '@pop' }],
        [/"/, 'string'],
      ],
    },
  });
  
  // Auto-completion
  monaco.languages.registerCompletionItemProvider('modelfile', {
    provideCompletionItems: (model: any, position: any) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };
      
      const suggestions = [
        {
          label: 'FROM',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'FROM ${1:llama3.2}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Specify the base model',
          range,
        },
        {
          label: 'PARAMETER temperature',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'PARAMETER temperature ${1:0.7}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Set the temperature (0.0-2.0)',
          range,
        },
        {
          label: 'PARAMETER top_p',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'PARAMETER top_p ${1:0.9}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Set top-p sampling (0.0-1.0)',
          range,
        },
        {
          label: 'PARAMETER num_ctx',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'PARAMETER num_ctx ${1:4096}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Set context window size',
          range,
        },
        {
          label: 'SYSTEM',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'SYSTEM """\n${1:You are a helpful assistant.}\n"""',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Define system prompt',
          range,
        },
        {
          label: 'MESSAGE user',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'MESSAGE user ${1:Hello}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Add example user message',
          range,
        },
        {
          label: 'MESSAGE assistant',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'MESSAGE assistant ${1:Hello! How can I help?}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Add example assistant message',
          range,
        },
      ];
      
      return { suggestions };
    },
  });
}

interface ModelFileEditorProps {
  initialContent?: string;
  onSave?: (content: string, name: string) => void;
}

export function ModelFileEditor({ initialContent, onSave }: ModelFileEditorProps) {
  const [content, setContent] = useState(initialContent || TEMPLATES.basic);
  const [modelName, setModelName] = useState('my-custom-model');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [createProgress, setCreateProgress] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [copied, setCopied] = useState(false);
  
  const monaco = useMonaco();
  const editorRef = useRef<any>(null);
  const { toast } = useToast();
  const { fetchModels } = useModelsStore();
  const { addModelFile, parseModelFile } = useModelFilesStore();

  // Configure Monaco on load
  useEffect(() => {
    if (monaco) {
      configureMonaco(monaco);
    }
  }, [monaco]);

  // Validate on content change
  useEffect(() => {
    const validationErrors = validateModelFile(content);
    setErrors(validationErrors);
  }, [content]);

  const handleEditorMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied to clipboard' });
  }, [content, toast]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${modelName}.modelfile`;
    a.click();
    URL.revokeObjectURL(url);
  }, [content, modelName]);

  const handleUpload = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.modelfile,.txt';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const text = await file.text();
      setContent(text);
      setModelName(file.name.replace(/\.modelfile|\.txt/, ''));
      toast({ title: 'File loaded' });
    };
    input.click();
  }, [toast]);

  const handleCreate = useCallback(async () => {
    const criticalErrors = errors.filter(e => e.severity === 'error');
    if (criticalErrors.length > 0) {
      toast({
        title: 'Cannot create model',
        description: `Fix ${criticalErrors.length} error(s) first`,
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    setCreateProgress('Starting...');

    try {
      // Parse content to extract baseModel for storage
      const parsed = parseModelFile(content);
      
      await ollamaClient.create(
        { model: modelName, from: parsed.baseModel, system: parsed.system },
        (progress) => {
          setCreateProgress(progress.status || 'Processing...');
        }
      );

      toast({ title: 'Model created successfully!' });
      fetchModels();
      
      // Save to ModelFiles store with parsed data
      addModelFile({
        name: modelName,
        content,
        baseModel: parsed.baseModel,
        parameters: parsed.parameters,
        system: parsed.system,
        template: parsed.template,
      });

      if (onSave) {
        onSave(content, modelName);
      }

    } catch (error) {
      toast({
        title: 'Failed to create model',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
      setCreateProgress('');
    }
  }, [content, modelName, errors, toast, fetchModels, addModelFile, onSave]);

  const handleTemplateSelect = useCallback((templateKey: string) => {
    const template = TEMPLATES[templateKey as keyof typeof TEMPLATES];
    if (template) {
      setContent(template);
    }
  }, []);

  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b-2 border-black dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-green-500" />
              <h1 className="text-xl font-bold">ModelFile Editor</h1>
            </div>

            {/* Model Name Input */}
            <div className="flex items-center gap-2">
              <Label className="text-sm">Name:</Label>
              <Input
                value={modelName}
                onChange={(e) => setModelName(e.target.value.replace(/\s/g, '-'))}
                placeholder="model-name"
                className="w-[200px] h-8 border-2 border-black dark:border-gray-700 font-mono"
              />
            </div>

            {/* Template Selector */}
            <Select onValueChange={handleTemplateSelect}>
              <SelectTrigger className="w-[160px] h-8 border-2 border-black dark:border-gray-700">
                <Sparkles className="w-4 h-4 mr-1" />
                <span>Templates</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="coding">Coding</SelectItem>
                <SelectItem value="creative">Creative</SelectItem>
                <SelectItem value="analyst">Analyst</SelectItem>
                <SelectItem value="roleplay">Roleplay</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            {/* Validation Status */}
            <div className="flex items-center gap-2 mr-4">
              {errorCount > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errorCount} error{errorCount > 1 ? 's' : ''}
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800">
                  {warningCount} warning{warningCount > 1 ? 's' : ''}
                </Badge>
              )}
              {errorCount === 0 && warningCount === 0 && (
                <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800">
                  <Check className="w-3 h-3" />
                  Valid
                </Badge>
              )}
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUpload}
                  className="border-2 border-black dark:border-gray-700"
                >
                  <Upload className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Upload ModelFile</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="border-2 border-black dark:border-gray-700"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="border-2 border-black dark:border-gray-700"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className={cn(
                    "border-2 border-black dark:border-gray-700",
                    showPreview && "bg-black text-white dark:bg-white dark:text-black"
                  )}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Preview</TooltipContent>
            </Tooltip>

            <Button
              onClick={handleCreate}
              disabled={isCreating || errorCount > 0 || !modelName.trim()}
              className="bg-green-600 hover:bg-green-700 text-white border-2 border-black"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Create Model
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Creation Progress */}
        <AnimatePresence>
          {isCreating && createProgress && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-500"
            >
              <div className="px-4 py-2 flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">{createProgress}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Editor Area */}
        <div className="flex-1 flex">
          {/* Monaco Editor */}
          <div className={cn("flex-1", showPreview && "w-1/2")}>
            <Editor
              height="100%"
              language="modelfile"
              value={content}
              onChange={(value) => setContent(value || '')}
              onMount={handleEditorMount}
              theme={document.documentElement.classList.contains('dark') ? 'vs-dark' : 'light'}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: 'JetBrains Mono, Menlo, monospace',
                lineNumbers: 'on',
                renderWhitespace: 'selection',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                tabSize: 2,
                automaticLayout: true,
              }}
            />
          </div>

          {/* Preview Panel */}
          <AnimatePresence>
            {showPreview && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '50%', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="border-l-2 border-black dark:border-gray-700 overflow-hidden"
              >
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Preview & Validation
                    </h3>

                    {/* Errors & Warnings */}
                    {errors.length > 0 && (
                      <div className="mb-4 space-y-2">
                        {errors.map((error, index) => (
                          <div
                            key={index}
                            className={cn(
                              "p-2 rounded-lg text-sm flex items-start gap-2",
                              error.severity === 'error'
                                ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                                : "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300"
                            )}
                          >
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-mono">Line {error.line}:</span>{' '}
                              {error.message}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Parsed Structure Preview */}
                    <Card className="border-2 border-black dark:border-gray-700 p-4">
                      <h4 className="font-semibold mb-2">Parsed Structure</h4>
                      <div className="space-y-2 text-sm">
                        {content.split('\n').map((line, index) => {
                          const trimmed = line.trim();
                          if (!trimmed || trimmed.startsWith('#')) return null;
                          
                          const firstWord = trimmed.split(/\s+/)[0].toUpperCase();
                          const rest = trimmed.substring(firstWord.length).trim();
                          
                          return (
                            <div key={index} className="flex items-start gap-2">
                              <Badge variant="outline" className="shrink-0 font-mono text-xs">
                                {firstWord}
                              </Badge>
                              <span className="text-gray-600 dark:text-gray-400 break-all">
                                {rest.length > 50 ? rest.substring(0, 50) + '...' : rest}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </Card>

                    {/* Documentation */}
                    <Card className="border-2 border-black dark:border-gray-700 p-4 mt-4">
                      <h4 className="font-semibold mb-2">Quick Reference</h4>
                      <div className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                        <p><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">FROM</code> - Base model (required)</p>
                        <p><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">PARAMETER</code> - Model parameters</p>
                        <p><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">SYSTEM</code> - System prompt</p>
                        <p><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">MESSAGE</code> - Example conversation</p>
                        <p><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">TEMPLATE</code> - Custom template</p>
                        <p><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">ADAPTER</code> - LoRA adapter</p>
                      </div>
                    </Card>
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </TooltipProvider>
  );
}
