import { useMemo } from 'react';
import { CodeBlock, InlineCode } from './CodeBlock';
import { cn } from '@/lib/utils';

interface ChatMessageContentProps {
  content: string;
  className?: string;
}

interface ParsedSegment {
  type: 'text' | 'code' | 'inline-code';
  content: string;
  language?: string;
}

export function ChatMessageContent({ content, className }: ChatMessageContentProps) {
  const segments = useMemo(() => parseMarkdown(content), [content]);

  return (
    <div className={cn("prose dark:prose-invert max-w-none", className)}>
      {segments.map((segment, index) => {
        if (segment.type === 'code') {
          return (
            <CodeBlock
              key={index}
              code={segment.content}
              language={segment.language || 'text'}
            />
          );
        }
        
        if (segment.type === 'inline-code') {
          return <InlineCode key={index}>{segment.content}</InlineCode>;
        }

        // Render text with basic markdown
        return (
          <span 
            key={index}
            dangerouslySetInnerHTML={{ __html: renderBasicMarkdown(segment.content) }}
          />
        );
      })}
    </div>
  );
}

function parseMarkdown(text: string): ParsedSegment[] {
  const segments: ParsedSegment[] = [];
  
  // Match code blocks: ```language\ncode\n```
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;

  let lastIndex = 0;
  let match;

  // First, extract code blocks
  const codeBlocks: { start: number; end: number; content: string; language: string }[] = [];
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    codeBlocks.push({
      start: match.index,
      end: match.index + match[0].length,
      content: match[2],
      language: match[1] || 'text',
    });
  }

  // Process text with code blocks
  lastIndex = 0;
  for (const block of codeBlocks) {
    // Add text before code block
    if (block.start > lastIndex) {
      const textBefore = text.slice(lastIndex, block.start);
      segments.push(...parseInlineCode(textBefore));
    }
    
    // Add code block
    segments.push({
      type: 'code',
      content: block.content,
      language: block.language,
    });
    
    lastIndex = block.end;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex);
    segments.push(...parseInlineCode(remaining));
  }

  return segments;
}

function parseInlineCode(text: string): ParsedSegment[] {
  const segments: ParsedSegment[] = [];
  const inlineCodeRegex = /`([^`]+)`/g;
  
  let lastIndex = 0;
  let match;

  while ((match = inlineCodeRegex.exec(text)) !== null) {
    // Add text before inline code
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
      });
    }
    
    // Add inline code
    segments.push({
      type: 'inline-code',
      content: match[1],
    });
    
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }

  return segments;
}

function renderBasicMarkdown(text: string): string {
  let result = text;
  
  // Escape HTML
  result = result
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold: **text** or __text__
  result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Italic: *text* or _text_
  result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  result = result.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Strikethrough: ~~text~~
  result = result.replace(/~~(.*?)~~/g, '<del>$1</del>');

  // Headers: # text
  result = result.replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>');
  result = result.replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>');
  result = result.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>');

  // Bullet points: - item or * item
  result = result.replace(/^[\-\*] (.*)$/gm, '<li class="ml-4">• $1</li>');
  
  // Numbered lists: 1. item
  result = result.replace(/^\d+\. (.*)$/gm, '<li class="ml-4 list-decimal">$1</li>');

  // Line breaks
  result = result.replace(/\n/g, '<br/>');

  // Links: [text](url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 underline hover:no-underline">$1</a>');

  return result;
}
