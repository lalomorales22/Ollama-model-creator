/**
 * Parameter Panel
 *
 * Comprehensive live parameter tuning controls for the playground.
 * Supports all Ollama model parameters including sampling, repetition,
 * generation, performance, and mirostat settings.
 */

import { useState } from 'react';
import { RotateCcw, ChevronDown, ChevronUp, Info, Plus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { KEEP_ALIVE_PRESETS } from '@/lib/constants';

export interface GenerationParams {
  temperature: number;
  topP: number;
  topK: number;
  minP: number;
  typicalP: number;
  repeatPenalty: number;
  repeatLastN: number;
  presencePenalty: number;
  frequencyPenalty: number;
  numPredict: number;
  numCtx: number;
  seed: number;
  stop: string[];
  mirostat: number;
  mirostatTau: number;
  mirostatEta: number;
  numGpu: number;
  numThread: number;
  penalizeNewline: boolean;
  // Chat-level options
  format: '' | 'json';
  keepAlive: string;
}

interface ParameterPanelProps {
  params: GenerationParams;
  onChange: (params: GenerationParams) => void;
  onReset: () => void;
}

interface ParamConfig {
  key: keyof GenerationParams;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
}

const CORE_PARAMS: ParamConfig[] = [
  {
    key: 'temperature',
    label: 'Temperature',
    description: 'Controls randomness. Lower = more focused, Higher = more creative',
    min: 0,
    max: 2,
    step: 0.1,
    format: (v) => v.toFixed(1),
  },
  {
    key: 'topP',
    label: 'Top P',
    description: 'Nucleus sampling. Considers tokens with top_p cumulative probability mass',
    min: 0,
    max: 1,
    step: 0.05,
    format: (v) => v.toFixed(2),
  },
  {
    key: 'topK',
    label: 'Top K',
    description: 'Limits vocabulary to top K tokens. Lower = more focused',
    min: 1,
    max: 100,
    step: 1,
  },
  {
    key: 'repeatPenalty',
    label: 'Repeat Penalty',
    description: 'Penalizes repetition. Higher = less repetitive output',
    min: 0.5,
    max: 2,
    step: 0.05,
    format: (v) => v.toFixed(2),
  },
];

const SAMPLING_ADVANCED: ParamConfig[] = [
  {
    key: 'minP',
    label: 'Min P',
    description: 'Minimum probability threshold relative to the most likely token',
    min: 0,
    max: 1,
    step: 0.01,
    format: (v) => v.toFixed(2),
  },
  {
    key: 'typicalP',
    label: 'Typical P',
    description: 'Locally typical sampling. Selects tokens near expected information content',
    min: 0,
    max: 1,
    step: 0.05,
    format: (v) => v.toFixed(2),
  },
];

const REPETITION_ADVANCED: ParamConfig[] = [
  {
    key: 'repeatLastN',
    label: 'Repeat Last N',
    description: 'Lookback window for repetition. 0 = disabled, -1 = context size',
    min: -1,
    max: 4096,
    step: 1,
  },
  {
    key: 'presencePenalty',
    label: 'Presence Penalty',
    description: 'Penalizes tokens already in the context. Encourages new topics',
    min: -2,
    max: 2,
    step: 0.1,
    format: (v) => v.toFixed(1),
  },
  {
    key: 'frequencyPenalty',
    label: 'Frequency Penalty',
    description: 'Penalizes tokens by frequency. Reduces word repetition',
    min: -2,
    max: 2,
    step: 0.1,
    format: (v) => v.toFixed(1),
  },
];

const GENERATION_PARAMS: ParamConfig[] = [
  {
    key: 'numPredict',
    label: 'Max Tokens',
    description: 'Maximum number of tokens to generate. -1 = infinite',
    min: -1,
    max: 32768,
    step: 64,
  },
  {
    key: 'numCtx',
    label: 'Context Length',
    description: 'Context window size in tokens',
    min: 256,
    max: 131072,
    step: 256,
  },
  {
    key: 'seed',
    label: 'Seed',
    description: 'Random seed for reproducibility. 0 = random',
    min: 0,
    max: 999999999,
    step: 1,
  },
];

const PERFORMANCE_PARAMS: ParamConfig[] = [
  {
    key: 'numGpu',
    label: 'GPU Layers',
    description: 'Number of layers to offload to GPU. -1 = all, 0 = CPU only',
    min: -1,
    max: 999,
    step: 1,
  },
  {
    key: 'numThread',
    label: 'CPU Threads',
    description: 'Number of CPU threads. 0 = auto-detect',
    min: 0,
    max: 128,
    step: 1,
  },
];

const MIROSTAT_PARAMS: ParamConfig[] = [
  {
    key: 'mirostatTau',
    label: 'Mirostat Tau',
    description: 'Target entropy. Lower = more focused',
    min: 0,
    max: 10,
    step: 0.1,
    format: (v) => v.toFixed(1),
  },
  {
    key: 'mirostatEta',
    label: 'Mirostat Eta',
    description: 'Learning rate for adaptation speed',
    min: 0,
    max: 1,
    step: 0.01,
    format: (v) => v.toFixed(2),
  },
];

// Preset configurations
const PRESETS = [
  {
    name: 'Precise',
    emoji: '🎯',
    params: { temperature: 0.2, topP: 0.8, topK: 20, repeatPenalty: 1.1, minP: 0.1 },
  },
  {
    name: 'Balanced',
    emoji: '⚖️',
    params: { temperature: 0.7, topP: 0.9, topK: 40, repeatPenalty: 1.1, minP: 0.0 },
  },
  {
    name: 'Creative',
    emoji: '🎨',
    params: { temperature: 1.2, topP: 0.95, topK: 60, repeatPenalty: 1.05, minP: 0.05 },
  },
  {
    name: 'Random',
    emoji: '��',
    params: { temperature: 1.8, topP: 1.0, topK: 100, repeatPenalty: 1.0, minP: 0.0 },
  },
];

export function ParameterPanel({ params, onChange, onReset }: ParameterPanelProps) {
  const [samplingOpen, setSamplingOpen] = useState(false);
  const [repetitionOpen, setRepetitionOpen] = useState(false);
  const [generationOpen, setGenerationOpen] = useState(false);
  const [performanceOpen, setPerformanceOpen] = useState(false);
  const [stopInput, setStopInput] = useState('');

  const updateParam = (key: keyof GenerationParams, value: number | string[] | string | boolean) => {
    onChange({ ...params, [key]: value });
  };

  const applyPreset = (preset: (typeof PRESETS)[0]) => {
    onChange({ ...params, ...preset.params });
  };

  const addStopSequence = () => {
    if (stopInput.trim() && !params.stop.includes(stopInput.trim())) {
      updateParam('stop', [...params.stop, stopInput.trim()]);
      setStopInput('');
    }
  };

  const removeStopSequence = (seq: string) => {
    updateParam('stop', params.stop.filter(s => s !== seq));
  };

  const renderSlider = (config: ParamConfig) => (
    <div key={config.key} className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Label className="text-sm font-medium">{config.label}</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-3 h-3 text-gray-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[200px]">
              {config.description}
            </TooltipContent>
          </Tooltip>
        </div>
        <Input
          type="number"
          value={params[config.key] as number}
          onChange={(e) => updateParam(config.key, parseFloat(e.target.value) || config.min)}
          min={config.min}
          max={config.max}
          step={config.step}
          className="w-24 h-7 text-sm border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800"
        />
      </div>
      <Slider
        value={[params[config.key] as number]}
        onValueChange={([value]) => updateParam(config.key, value)}
        min={config.min}
        max={config.max}
        step={config.step}
        className="cursor-pointer"
      />
    </div>
  );

  const renderCollapsible = (
    label: string,
    open: boolean,
    setOpen: (v: boolean) => void,
    configs: ParamConfig[]
  ) => (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <span className="font-semibold text-xs">{label}</span>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-5 pt-3">
        {configs.map(renderSlider)}
      </CollapsibleContent>
    </Collapsible>
  );

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Parameters</h3>
          <Button variant="ghost" size="sm" onClick={onReset} className="text-xs">
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        </div>

        {/* Presets */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Presets</Label>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map(preset => (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                onClick={() => applyPreset(preset)}
                className="border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <span className="mr-1">{preset.emoji}</span>
                {preset.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Output Format */}
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label className="text-sm font-semibold">Output Format</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3 h-3 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[200px]">
                Force the model to output valid JSON
              </TooltipContent>
            </Tooltip>
          </div>
          <Select value={params.format || 'text'} onValueChange={(v) => updateParam('format', v === 'text' ? '' : v)}>
            <SelectTrigger className="border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 h-8 text-sm">
              <SelectValue placeholder="Default (text)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Default (text)</SelectItem>
              <SelectItem value="json">JSON Mode</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Keep Alive */}
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label className="text-sm font-semibold">Keep Alive</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3 h-3 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[200px]">
                How long to keep the model loaded in memory after this request
              </TooltipContent>
            </Tooltip>
          </div>
          <Select value={params.keepAlive || '5m'} onValueChange={(v) => updateParam('keepAlive', v)}>
            <SelectTrigger className="border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KEEP_ALIVE_PRESETS.map(preset => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Core Sampling Parameters */}
        <div className="space-y-5">
          {CORE_PARAMS.map(renderSlider)}
        </div>

        {/* Advanced Sampling */}
        {renderCollapsible('Advanced Sampling', samplingOpen, setSamplingOpen, SAMPLING_ADVANCED)}

        {/* Repetition Control */}
        {renderCollapsible('Repetition Control', repetitionOpen, setRepetitionOpen, REPETITION_ADVANCED)}

        {/* Penalize Newline toggle */}
        {repetitionOpen && (
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1">
              <Label className="text-sm font-medium">Penalize Newlines</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[200px]">
                  Include newlines in repetition penalty
                </TooltipContent>
              </Tooltip>
            </div>
            <Switch
              checked={params.penalizeNewline}
              onCheckedChange={(v) => updateParam('penalizeNewline', v)}
            />
          </div>
        )}

        {/* Generation Settings */}
        {renderCollapsible('Generation', generationOpen, setGenerationOpen, GENERATION_PARAMS)}

        {/* Performance */}
        {renderCollapsible('Performance', performanceOpen, setPerformanceOpen, PERFORMANCE_PARAMS)}

        {/* Mirostat */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Label className="text-sm font-semibold">Mirostat</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[200px]">
                  Alternative sampling that maintains constant perplexity. 0=off, 1=v1, 2=v2
                </TooltipContent>
              </Tooltip>
            </div>
            <Select
              value={String(params.mirostat)}
              onValueChange={(v) => updateParam('mirostat', parseInt(v))}
            >
              <SelectTrigger className="w-32 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 h-7 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Disabled</SelectItem>
                <SelectItem value="1">Mirostat 1</SelectItem>
                <SelectItem value="2">Mirostat 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {params.mirostat > 0 && (
            <div className="space-y-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              {MIROSTAT_PARAMS.map(renderSlider)}
            </div>
          )}
        </div>

        {/* Stop Sequences */}
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label className="text-sm font-semibold">Stop Sequences</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3 h-3 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[200px]">
                Sequences that will stop generation when encountered
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex gap-2">
            <Input
              value={stopInput}
              onChange={(e) => setStopInput(e.target.value)}
              placeholder="Add stop sequence"
              className="flex-1 h-8 text-sm border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800"
              onKeyDown={(e) => e.key === 'Enter' && addStopSequence()}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={addStopSequence}
              disabled={!stopInput.trim()}
              className="border-2 border-gray-200 dark:border-gray-700"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
          {params.stop.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {params.stop.map(seq => (
                <Badge
                  key={seq}
                  variant="secondary"
                  className="cursor-pointer hover:bg-red-100 dark:hover:bg-red-900"
                  onClick={() => removeStopSequence(seq)}
                >
                  <code className="text-xs">{seq}</code> <span className="ml-1">x</span>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
