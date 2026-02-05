import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Copy, Download, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settings-store';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  maxHeight?: string;
}

// Language display names
const languageNames: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  rust: 'Rust',
  go: 'Go',
  java: 'Java',
  cpp: 'C++',
  c: 'C',
  csharp: 'C#',
  ruby: 'Ruby',
  php: 'PHP',
  swift: 'Swift',
  kotlin: 'Kotlin',
  bash: 'Bash',
  shell: 'Shell',
  sql: 'SQL',
  json: 'JSON',
  yaml: 'YAML',
  xml: 'XML',
  html: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  markdown: 'Markdown',
  dockerfile: 'Dockerfile',
  modelfile: 'ModelFile',
};

export function CodeBlock({ 
  code, 
  language = 'text', 
  filename,
  showLineNumbers = true,
  maxHeight = '400px'
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { settings } = useSettingsStore();
  const isDark = settings.theme === 'dark';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const extension = getFileExtension(language);
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `code.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFileExtension = (lang: string): string => {
    const extensions: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      rust: 'rs',
      go: 'go',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      csharp: 'cs',
      ruby: 'rb',
      php: 'php',
      swift: 'swift',
      kotlin: 'kt',
      bash: 'sh',
      shell: 'sh',
      sql: 'sql',
      json: 'json',
      yaml: 'yml',
      xml: 'xml',
      html: 'html',
      css: 'css',
      scss: 'scss',
      markdown: 'md',
      dockerfile: 'dockerfile',
      modelfile: 'modelfile',
    };
    return extensions[lang.toLowerCase()] || 'txt';
  };

  // Custom style overrides
  const customStyle = {
    margin: 0,
    borderRadius: 0,
    fontSize: '0.875rem',
    lineHeight: '1.5',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-lg border-2 overflow-hidden my-3",
        isDark 
          ? "border-gray-700 bg-gray-900" 
          : "border-black bg-gray-900"
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between px-4 py-2 border-b-2",
        isDark ? "border-gray-700 bg-gray-800" : "border-gray-700 bg-gray-800"
      )}>
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-gray-400" />
          {filename ? (
            <span className="text-sm font-mono text-gray-300">{filename}</span>
          ) : (
            <span className="text-sm text-gray-400">
              {languageNames[language.toLowerCase()] || language}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <Download className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2 text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <AnimatePresence mode="wait" initial={false}>
              {copied ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-xs text-green-400">Copied!</span>
                </motion.div>
              ) : (
                <motion.div
                  key="copy"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span className="text-xs">Copy</span>
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </div>

      {/* Code content */}
      <div 
        className="overflow-auto"
        style={{ maxHeight }}
      >
        <SyntaxHighlighter
          language={language === 'modelfile' ? 'dockerfile' : language}
          style={oneDark}
          showLineNumbers={showLineNumbers}
          customStyle={customStyle}
          lineNumberStyle={{
            minWidth: '2.5em',
            paddingRight: '1em',
            color: '#636d83',
            userSelect: 'none',
          }}
          wrapLines
        >
          {code.trim()}
        </SyntaxHighlighter>
      </div>
    </motion.div>
  );
}

// Inline code component for single-line code
interface InlineCodeProps {
  children: React.ReactNode;
}

export function InlineCode({ children }: InlineCodeProps) {
  return (
    <code className="px-1.5 py-0.5 text-sm font-mono bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400 rounded border border-gray-200 dark:border-gray-700">
      {children}
    </code>
  );
}
