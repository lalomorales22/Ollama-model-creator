/**
 * Tool Builder
 * 
 * Visual tool definition builder for function calling
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp,
  Wrench,
  Code,
  Play,
  Download,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Types
export interface ToolParameter {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  enum?: string[];
  default?: string;
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  parameters: ToolParameter[];
}

interface ToolBuilderProps {
  tools: ToolDefinition[];
  onToolsChange: (tools: ToolDefinition[]) => void;
  onTestTool?: (tool: ToolDefinition, args: Record<string, unknown>) => void;
}

const PARAMETER_TYPES = [
  { value: 'string', label: 'String', icon: '📝' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'boolean', label: 'Boolean', icon: '✓' },
  { value: 'array', label: 'Array', icon: '📋' },
  { value: 'object', label: 'Object', icon: '📦' },
];

// Common tool templates
const TOOL_TEMPLATES: ToolDefinition[] = [
  {
    id: 'template-weather',
    name: 'get_weather',
    description: 'Get the current weather for a location',
    parameters: [
      { id: '1', name: 'location', type: 'string', description: 'City name or coordinates', required: true },
      { id: '2', name: 'units', type: 'string', description: 'Temperature units (celsius/fahrenheit)', required: false, enum: ['celsius', 'fahrenheit'], default: 'celsius' },
    ],
  },
  {
    id: 'template-search',
    name: 'web_search',
    description: 'Search the web for information',
    parameters: [
      { id: '1', name: 'query', type: 'string', description: 'Search query', required: true },
      { id: '2', name: 'num_results', type: 'number', description: 'Number of results to return', required: false, default: '5' },
    ],
  },
  {
    id: 'template-calculator',
    name: 'calculate',
    description: 'Perform mathematical calculations',
    parameters: [
      { id: '1', name: 'expression', type: 'string', description: 'Mathematical expression to evaluate', required: true },
    ],
  },
  {
    id: 'template-datetime',
    name: 'get_datetime',
    description: 'Get current date and time',
    parameters: [
      { id: '1', name: 'timezone', type: 'string', description: 'Timezone (e.g., UTC, America/New_York)', required: false, default: 'UTC' },
      { id: '2', name: 'format', type: 'string', description: 'Date format string', required: false },
    ],
  },
];

const generateId = () => Math.random().toString(36).substring(2, 9);

export function ToolBuilder({ tools, onToolsChange, onTestTool }: ToolBuilderProps) {
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const addTool = useCallback((template?: ToolDefinition) => {
    const newTool: ToolDefinition = template ? {
      ...template,
      id: generateId(),
      parameters: template.parameters.map(p => ({ ...p, id: generateId() })),
    } : {
      id: generateId(),
      name: '',
      description: '',
      parameters: [],
    };
    
    onToolsChange([...tools, newTool]);
    setExpandedTool(newTool.id);
  }, [tools, onToolsChange]);

  const updateTool = useCallback((id: string, updates: Partial<ToolDefinition>) => {
    onToolsChange(tools.map(t => t.id === id ? { ...t, ...updates } : t));
  }, [tools, onToolsChange]);

  const deleteTool = useCallback((id: string) => {
    onToolsChange(tools.filter(t => t.id !== id));
    if (expandedTool === id) setExpandedTool(null);
  }, [tools, onToolsChange, expandedTool]);

  const duplicateTool = useCallback((tool: ToolDefinition) => {
    const newTool: ToolDefinition = {
      ...tool,
      id: generateId(),
      name: `${tool.name}_copy`,
      parameters: tool.parameters.map(p => ({ ...p, id: generateId() })),
    };
    onToolsChange([...tools, newTool]);
    setExpandedTool(newTool.id);
  }, [tools, onToolsChange]);

  const addParameter = useCallback((toolId: string) => {
    const tool = tools.find(t => t.id === toolId);
    if (!tool) return;

    const newParam: ToolParameter = {
      id: generateId(),
      name: '',
      type: 'string',
      description: '',
      required: false,
    };

    updateTool(toolId, {
      parameters: [...tool.parameters, newParam],
    });
  }, [tools, updateTool]);

  const updateParameter = useCallback((toolId: string, paramId: string, updates: Partial<ToolParameter>) => {
    const tool = tools.find(t => t.id === toolId);
    if (!tool) return;

    updateTool(toolId, {
      parameters: tool.parameters.map(p => p.id === paramId ? { ...p, ...updates } : p),
    });
  }, [tools, updateTool]);

  const deleteParameter = useCallback((toolId: string, paramId: string) => {
    const tool = tools.find(t => t.id === toolId);
    if (!tool) return;

    updateTool(toolId, {
      parameters: tool.parameters.filter(p => p.id !== paramId),
    });
  }, [tools, updateTool]);

  // Convert to Ollama tool format
  const toOllamaFormat = useCallback(() => {
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
                ...(p.default && { default: p.default }),
              },
            ])
          ),
          required: tool.parameters.filter(p => p.required).map(p => p.name),
        },
      },
    }));
  }, [tools]);

  const handleCopyJson = () => {
    const json = JSON.stringify(toOllamaFormat(), null, 2);
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied to clipboard' });
  };

  const handleExport = () => {
    const json = JSON.stringify(tools, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tools.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const imported = JSON.parse(text);
        if (Array.isArray(imported)) {
          onToolsChange(imported.map(t => ({
            ...t,
            id: generateId(),
            parameters: t.parameters?.map((p: ToolParameter) => ({ ...p, id: generateId() })) || [],
          })));
          toast({ title: 'Tools imported successfully' });
        }
      } catch (err) {
        toast({ title: 'Invalid JSON file', variant: 'destructive' });
      }
    };
    input.click();
  };

  return (
    <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            <h3 className="font-bold text-lg">Tool Builder</h3>
            <Badge variant="secondary">{tools.length} tools</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleImport}
              className="border-2 border-black dark:border-gray-700"
            >
              <Upload className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={tools.length === 0}
              className="border-2 border-black dark:border-gray-700"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowJson(!showJson)}
              className={cn(
                "border-2 border-black dark:border-gray-700",
                showJson && "bg-black text-white dark:bg-white dark:text-black"
              )}
            >
              <Code className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Templates */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Quick Templates</Label>
          <div className="flex flex-wrap gap-2">
            {TOOL_TEMPLATES.map(template => (
              <Button
                key={template.id}
                variant="outline"
                size="sm"
                onClick={() => addTool(template)}
                className="border-2 border-black dark:border-gray-700 text-xs"
              >
                + {template.name}
              </Button>
            ))}
          </div>
        </div>

        <Separator className="bg-black dark:bg-gray-700" />

        {/* Tools List */}
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {tools.map(tool => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className="border-2 border-black dark:border-gray-700">
                    <Collapsible
                      open={expandedTool === tool.id}
                      onOpenChange={(open) => setExpandedTool(open ? tool.id : null)}
                    >
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                          <div className="flex items-center gap-2">
                            <Wrench className="w-4 h-4 text-purple-500" />
                            <span className="font-mono font-semibold">
                              {tool.name || 'Unnamed tool'}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {tool.parameters.length} params
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); duplicateTool(tool); }}
                              className="h-7 w-7 p-0"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); deleteTool(tool.id); }}
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                            {expandedTool === tool.id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="p-3 pt-0 space-y-4">
                          <Separator className="bg-gray-200 dark:bg-gray-700" />
                          
                          {/* Tool Name */}
                          <div className="space-y-1">
                            <Label className="text-xs">Function Name</Label>
                            <Input
                              value={tool.name}
                              onChange={(e) => updateTool(tool.id, { name: e.target.value.replace(/\s/g, '_') })}
                              placeholder="function_name"
                              className="font-mono border-2 border-black dark:border-gray-700"
                            />
                          </div>

                          {/* Description */}
                          <div className="space-y-1">
                            <Label className="text-xs">Description</Label>
                            <Textarea
                              value={tool.description}
                              onChange={(e) => updateTool(tool.id, { description: e.target.value })}
                              placeholder="What does this tool do?"
                              className="min-h-[60px] resize-none border-2 border-black dark:border-gray-700"
                            />
                          </div>

                          {/* Parameters */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-semibold">Parameters</Label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => addParameter(tool.id)}
                                className="h-6 text-xs"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Add
                              </Button>
                            </div>

                            <div className="space-y-2">
                              {tool.parameters.map((param) => (
                                <div
                                  key={param.id}
                                  className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2"
                                >
                                  <div className="flex items-center gap-2">
                                    <Input
                                      value={param.name}
                                      onChange={(e) => updateParameter(tool.id, param.id, { name: e.target.value.replace(/\s/g, '_') })}
                                      placeholder="param_name"
                                      className="flex-1 h-8 font-mono text-sm border border-gray-300 dark:border-gray-600"
                                    />
                                    <Select
                                      value={param.type}
                                      onValueChange={(v) => updateParameter(tool.id, param.id, { type: v as ToolParameter['type'] })}
                                    >
                                      <SelectTrigger className="w-24 h-8 text-xs border border-gray-300 dark:border-gray-600">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {PARAMETER_TYPES.map(t => (
                                          <SelectItem key={t.value} value={t.value}>
                                            {t.icon} {t.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <div className="flex items-center gap-1">
                                      <Switch
                                        checked={param.required}
                                        onCheckedChange={(v) => updateParameter(tool.id, param.id, { required: v })}
                                      />
                                      <Label className="text-xs">Req</Label>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteParameter(tool.id, param.id)}
                                      className="h-6 w-6 p-0 text-red-500"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  <Input
                                    value={param.description}
                                    onChange={(e) => updateParameter(tool.id, param.id, { description: e.target.value })}
                                    placeholder="Parameter description"
                                    className="h-7 text-xs border border-gray-300 dark:border-gray-600"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Test Tool */}
                          {onTestTool && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onTestTool(tool, {})}
                              className="w-full border-2 border-black dark:border-gray-700"
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Test Tool
                            </Button>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Add Tool Button */}
            <Button
              variant="outline"
              onClick={() => addTool()}
              className="w-full border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-purple-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Tool
            </Button>
          </div>
        </ScrollArea>

        {/* JSON Preview */}
        <AnimatePresence>
          {showJson && tools.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="border-2 border-black dark:border-gray-700 overflow-hidden">
                <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800">
                  <span className="text-xs font-semibold">Ollama Tool Format</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyJson}
                    className="h-6"
                  >
                    {copied ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
                <ScrollArea className="max-h-[200px]">
                  <pre className="p-3 text-xs font-mono overflow-x-auto">
                    {JSON.stringify(toOllamaFormat(), null, 2)}
                  </pre>
                </ScrollArea>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
}
