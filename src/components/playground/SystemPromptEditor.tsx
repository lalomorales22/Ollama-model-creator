/**
 * System Prompt Editor
 * 
 * System prompt editor with templates for the playground
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface SystemPromptEditorProps {
  value: string;
  onChange: (value: string) => void;
}

interface PromptTemplate {
  name: string;
  emoji: string;
  category: string;
  prompt: string;
}

const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    name: 'Helpful Assistant',
    emoji: '🤖',
    category: 'General',
    prompt: `You are a helpful, harmless, and honest AI assistant. You provide clear, accurate, and thoughtful responses. If you're unsure about something, you say so. You don't pretend to have capabilities you don't have.`,
  },
  {
    name: 'Code Expert',
    emoji: '💻',
    category: 'Technical',
    prompt: `You are an expert software developer with deep knowledge of multiple programming languages, frameworks, and best practices. You write clean, efficient, well-documented code. You explain your reasoning and suggest improvements when relevant. Always include proper error handling and follow security best practices.`,
  },
  {
    name: 'Creative Writer',
    emoji: '✍️',
    category: 'Creative',
    prompt: `You are a creative writing assistant with expertise in storytelling, poetry, and various literary forms. You help users develop compelling narratives, interesting characters, and vivid descriptions. You can adapt your style to match different genres and tones.`,
  },
  {
    name: 'Socratic Teacher',
    emoji: '🎓',
    category: 'Education',
    prompt: `You are a patient and thoughtful teacher who uses the Socratic method. Instead of giving direct answers, you ask guiding questions to help the user discover the answer themselves. You break down complex topics into understandable parts and celebrate progress.`,
  },
  {
    name: 'Data Analyst',
    emoji: '📊',
    category: 'Technical',
    prompt: `You are a data analysis expert skilled in statistics, data visualization, and deriving insights from data. You explain statistical concepts clearly, suggest appropriate analytical methods, and help interpret results. You're proficient with pandas, numpy, SQL, and visualization libraries.`,
  },
  {
    name: 'Technical Writer',
    emoji: '📝',
    category: 'Technical',
    prompt: `You are a technical documentation specialist. You write clear, concise, and well-structured documentation. You organize information logically, use appropriate formatting, and ensure accuracy. You can create API docs, user guides, tutorials, and README files.`,
  },
  {
    name: 'Brainstorm Partner',
    emoji: '💡',
    category: 'Creative',
    prompt: `You are an enthusiastic brainstorming partner. You build on ideas, suggest alternatives, play devil's advocate when helpful, and help explore possibilities. You encourage creative thinking while also considering practical constraints. No idea is too wild to explore.`,
  },
  {
    name: 'Debate Partner',
    emoji: '⚔️',
    category: 'General',
    prompt: `You are a skilled debate partner who can argue any position thoughtfully. You present well-reasoned arguments, acknowledge counterpoints, and help users strengthen their reasoning. You're fair, logical, and help identify weaknesses in arguments.`,
  },
  {
    name: 'Shell Expert',
    emoji: '🖥️',
    category: 'Technical',
    prompt: `You are a command-line and shell scripting expert. You know bash, zsh, PowerShell, and common CLI tools inside out. You write efficient one-liners and scripts, explain commands clearly, and always warn about potentially destructive operations. You follow security best practices.`,
  },
  {
    name: 'Concise Responder',
    emoji: '⚡',
    category: 'General',
    prompt: `You give extremely concise responses. No fluff, no unnecessary words. Direct and to the point. If asked to explain, you do so briefly. You prioritize clarity and brevity above all else.`,
  },
  {
    name: 'ELI5 Explainer',
    emoji: '🧒',
    category: 'Education',
    prompt: `You explain complex topics as if explaining to a 5-year-old. You use simple words, relatable analogies, and everyday examples. You avoid jargon and technical terms. You make learning fun and accessible.`,
  },
  {
    name: 'Devil\'s Advocate',
    emoji: '😈',
    category: 'General',
    prompt: `You challenge every idea and assumption. You find potential flaws, ask hard questions, and push back on assertions. Your goal is to strengthen ideas through rigorous questioning. You're not negative—you're thorough.`,
  },
];

const CATEGORIES = [...new Set(PROMPT_TEMPLATES.map(t => t.category))];

export function SystemPromptEditor({ value, onChange }: SystemPromptEditorProps) {
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const filteredTemplates = selectedCategory
    ? PROMPT_TEMPLATES.filter(t => t.category === selectedCategory)
    : PROMPT_TEMPLATES;

  const applyTemplate = (template: PromptTemplate) => {
    onChange(template.prompt);
    setShowTemplates(false);
  };

  const handleCopy = () => {
    if (value) {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="font-bold text-lg">System Prompt</Label>
        <div className="flex gap-1">
          {value && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 px-2"
            >
              {copied ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange('')}
            disabled={!value}
            className="h-7 px-2 text-xs"
          >
            Clear
          </Button>
        </div>
      </div>

      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter a system prompt to define the AI's behavior and personality..."
        className="min-h-[100px] resize-none border-2 border-black dark:border-gray-700"
      />

      {/* Templates Section */}
      <Collapsible open={showTemplates} onOpenChange={setShowTemplates}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between border-2 border-black dark:border-gray-700"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Template Library
            </span>
            {showTemplates ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-3">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-1">
            <Badge
              variant={selectedCategory === null ? "default" : "outline"}
              className={cn(
                "cursor-pointer",
                selectedCategory === null 
                  ? "bg-black text-white dark:bg-white dark:text-black" 
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Badge>
            {CATEGORIES.map(cat => (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                className={cn(
                  "cursor-pointer",
                  selectedCategory === cat 
                    ? "bg-black text-white dark:bg-white dark:text-black" 
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>

          {/* Template Cards */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {filteredTemplates.map((template) => (
              <button
                key={template.name}
                onClick={() => applyTemplate(template)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border-2 border-black dark:border-gray-700",
                  "hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-purple-500"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span>{template.emoji}</span>
                  <span className="font-semibold text-sm">{template.name}</span>
                  <Badge variant="secondary" className="text-xs ml-auto">
                    {template.category}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {template.prompt}
                </p>
              </button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
