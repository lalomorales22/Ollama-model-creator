/**
 * Parameter Panel
 * 
 * Live parameter tuning controls for the playground
 */

import { useState } from 'react';
import { RotateCcw, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

interface GenerationParams {
  temperature: number;
  topP: number;
  topK: number;
  repeatPenalty: number;
  numPredict: number;
  numCtx: number;
  seed: number;
  stop: string[];
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

const PARAM_CONFIGS: ParamConfig[] = [
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
    description: 'Nucleus sampling. Considers tokens with top_p probability mass',
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
    min: 1,
    max: 2,
    step: 0.05,
    format: (v) => v.toFixed(2),
  },
];

const ADVANCED_CONFIGS: ParamConfig[] = [
  {
    key: 'numPredict',
    label: 'Max Tokens',
    description: 'Maximum number of tokens to generate',
    min: 1,
    max: 8192,
    step: 64,
  },
  {
    key: 'numCtx',
    label: 'Context Length',
    description: 'Context window size in tokens',
    min: 512,
    max: 32768,
    step: 512,
  },
  {
    key: 'seed',
    label: 'Seed',
    description: 'Random seed for reproducibility. -1 for random',
    min: -1,
    max: 999999999,
    step: 1,
  },
];

// Preset configurations
const PRESETS = [
  { 
    name: 'Precise', 
    emoji: '🎯',
    params: { temperature: 0.2, topP: 0.8, topK: 20, repeatPenalty: 1.1 } 
  },
  { 
    name: 'Balanced', 
    emoji: '⚖️',
    params: { temperature: 0.7, topP: 0.9, topK: 40, repeatPenalty: 1.1 } 
  },
  { 
    name: 'Creative', 
    emoji: '🎨',
    params: { temperature: 1.2, topP: 0.95, topK: 60, repeatPenalty: 1.05 } 
  },
  { 
    name: 'Random', 
    emoji: '🎲',
    params: { temperature: 1.8, topP: 1.0, topK: 100, repeatPenalty: 1.0 } 
  },
];

export function ParameterPanel({ params, onChange, onReset }: ParameterPanelProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [stopInput, setStopInput] = useState('');

  const updateParam = (key: keyof GenerationParams, value: number | string[]) => {
    onChange({ ...params, [key]: value });
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    onChange({
      ...params,
      ...preset.params,
    });
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

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Parameters</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-xs"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        </div>

        {/* Presets */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Presets</Label>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                onClick={() => applyPreset(preset)}
                className="border-2 border-black dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <span className="mr-1">{preset.emoji}</span>
                {preset.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Main Parameters */}
        <div className="space-y-5">
          {PARAM_CONFIGS.map((config) => (
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
                <span className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                  {config.format 
                    ? config.format(params[config.key] as number)
                    : params[config.key]
                  }
                </span>
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
          ))}
        </div>

        {/* Advanced Section */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span className="font-semibold">Advanced Settings</span>
              {advancedOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-5 pt-4">
            {ADVANCED_CONFIGS.map((config) => (
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
                    onChange={(e) => updateParam(config.key, parseInt(e.target.value) || config.min)}
                    min={config.min}
                    max={config.max}
                    className="w-24 h-7 text-sm border-2 border-black dark:border-gray-700"
                  />
                </div>
              </div>
            ))}

            {/* Stop Sequences */}
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label className="text-sm font-medium">Stop Sequences</Label>
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
                  className="flex-1 h-8 text-sm border-2 border-black dark:border-gray-700"
                  onKeyDown={(e) => e.key === 'Enter' && addStopSequence()}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addStopSequence}
                  disabled={!stopInput.trim()}
                  className="border-2 border-black dark:border-gray-700"
                >
                  Add
                </Button>
              </div>
              {params.stop.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {params.stop.map((seq) => (
                    <Badge
                      key={seq}
                      variant="secondary"
                      className="cursor-pointer hover:bg-red-100 dark:hover:bg-red-900"
                      onClick={() => removeStopSequence(seq)}
                    >
                      {seq} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </TooltipProvider>
  );
}
