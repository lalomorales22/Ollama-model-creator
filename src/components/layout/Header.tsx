import React from 'react';
import { Brain, Settings, HelpCircle, Menu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';

export function Header() {
  const navigate = useNavigate();
  const { setMobileSidebarOpen, setCommandPaletteOpen, sidebarCollapsed } = useUIStore();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-950 border-b-4 border-black dark:border-gray-700 flex items-center justify-between px-4 md:px-6 z-40">
      <div className="flex items-center space-x-3">
        {/* Mobile hamburger menu */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileSidebarOpen(true)}
          className="md:hidden w-10 h-10 p-0"
        >
          <Menu className="w-6 h-6" />
        </Button>
        
        <div className="w-10 h-10 bg-black dark:bg-white rounded-lg flex items-center justify-center">
          <Brain className="w-6 h-6 text-white dark:text-black" />
        </div>
        <div className="hidden sm:block">
          <h1 className="text-xl font-bold text-black dark:text-white">Ollama Model Creator</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Create Custom AI Models with ModelFiles</p>
        </div>
        <div className="sm:hidden">
          <h1 className="text-lg font-bold text-black dark:text-white">Ollama</h1>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {/* Command palette trigger */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden sm:flex items-center gap-2 border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white"
        >
          <Search className="w-4 h-4" />
          <span className="text-sm">Search...</span>
          <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 px-1.5 font-mono text-[10px] font-medium">
            ⌘K
          </kbd>
        </Button>
        
        {/* Mobile search button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCommandPaletteOpen(true)}
          className="sm:hidden w-10 h-10 p-0"
        >
          <Search className="w-5 h-5" />
        </Button>
        
        <Button 
          onClick={() => navigate('/help')}
          variant="outline" 
          size="sm" 
          className="hidden md:flex border-2 border-black dark:border-gray-600 bg-white dark:bg-gray-900 text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          Help
        </Button>
        <Button 
          onClick={() => navigate('/settings')}
          variant="outline" 
          size="sm" 
          className="border-2 border-black dark:border-gray-600 bg-white dark:bg-gray-900 text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
        >
          <Settings className="w-4 h-4 md:mr-2" />
          <span className="hidden md:inline">Settings</span>
        </Button>
      </div>
    </header>
  );
}