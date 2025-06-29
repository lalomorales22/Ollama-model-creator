import React from 'react';
import { Brain, Settings, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b-4 border-black flex items-center justify-between px-6 z-20">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-black">Ollama Model Creator</h1>
          <p className="text-sm text-gray-600">Create Custom AI Models with ModelFiles</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button 
          onClick={() => navigate('/help')}
          variant="outline" 
          size="sm" 
          className="border-2 border-black bg-white text-black hover:bg-black hover:text-white"
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          Help
        </Button>
        <Button 
          onClick={() => navigate('/settings')}
          variant="outline" 
          size="sm" 
          className="border-2 border-black bg-white text-black hover:bg-black hover:text-white"
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>
    </header>
  );
}