/**
 * Streaming Text Component
 * 
 * Displays text with a streaming/typewriter effect and cursor
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface StreamingTextProps {
  content: string;
  isStreaming?: boolean;
  className?: string;
}

export function StreamingText({ content, isStreaming = false, className }: StreamingTextProps) {
  return (
    <div className={cn('whitespace-pre-wrap', className)}>
      {content}
      {isStreaming && (
        <span className="inline-block w-2 h-5 bg-black ml-0.5 animate-pulse" />
      )}
    </div>
  );
}

/**
 * Typing indicator for when assistant is thinking
 */
export function TypingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center space-x-1', className)}>
      <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}
