import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  Home,
  Brain,
  MessageSquare,
  FileText,
  Cpu,
  Download,
  PlayCircle,
  Settings,
  HelpCircle,
  Plus,
  Search,
  Moon,
  Sun,
  RefreshCw,
  Trash2,
  FolderOpen,
} from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { useModelsStore } from '@/stores/models-store';
import { useChatStore } from '@/stores/chat-store';
import { useSettingsStore } from '@/stores/settings-store';
import { useConnectionStore } from '@/stores/connection-store';
import { useToast } from '@/hooks/use-toast';

// Navigation items
const navigationItems = [
  { icon: Home, label: 'Go to Dashboard', path: '/', keywords: ['home', 'main'] },
  { icon: Brain, label: 'Go to Models', path: '/models', keywords: ['list', 'available'] },
  { icon: MessageSquare, label: 'Go to AI Assistant', path: '/assistant', keywords: ['chat', 'talk', 'conversation'] },
  { icon: FileText, label: 'Go to ModelFiles', path: '/modelfiles', keywords: ['files', 'templates'] },
  { icon: Cpu, label: 'Go to Create Model', path: '/create', keywords: ['new', 'build', 'make'] },
  { icon: PlayCircle, label: 'Go to Running Models', path: '/running', keywords: ['active', 'live'] },
  { icon: Download, label: 'Go to Downloads', path: '/downloads', keywords: ['pull', 'get'] },
  { icon: Settings, label: 'Go to Settings', path: '/settings', keywords: ['preferences', 'config'] },
  { icon: HelpCircle, label: 'Go to Help', path: '/help', keywords: ['docs', 'documentation', 'faq'] },
];

export function CommandPalette() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { commandPaletteOpen, setCommandPaletteOpen, toggleSidebar } = useUIStore();
  const { models, fetchModels, runningModels } = useModelsStore();
  const { createConversation, setActiveConversation, clearAllConversations } = useChatStore();
  const { settings, updateSettings } = useSettingsStore();
  const { checkConnection } = useConnectionStore();

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      
      // Cmd/Ctrl + / to toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        toggleSidebar();
      }
      
      // Cmd/Ctrl + N for new chat
      if ((e.metaKey || e.ctrlKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        handleNewChat();
      }
      
      // Number shortcuts for navigation (Cmd + 1-7)
      if ((e.metaKey || e.ctrlKey) && /^[1-7]$/.test(e.key)) {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (navigationItems[index]) {
          navigate(navigationItems[index].path);
          setCommandPaletteOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen, toggleSidebar, navigate]);

  const handleNavigation = useCallback((path: string) => {
    navigate(path);
    setCommandPaletteOpen(false);
  }, [navigate, setCommandPaletteOpen]);

  const handleNewChat = useCallback(() => {
    const newConvId = createConversation(settings.defaultModel || 'assistant', 'New Chat');
    setActiveConversation(newConvId);
    navigate('/assistant');
    setCommandPaletteOpen(false);
    toast({
      title: 'New Chat Created',
      description: 'Started a fresh conversation.',
    });
  }, [createConversation, setActiveConversation, navigate, setCommandPaletteOpen, settings.defaultModel, toast]);

  const handleRefreshModels = useCallback(async () => {
    setCommandPaletteOpen(false);
    await fetchModels();
    toast({
      title: 'Models Refreshed',
      description: `Found ${models.length} models.`,
    });
  }, [fetchModels, models.length, setCommandPaletteOpen, toast]);

  const handleToggleTheme = useCallback(() => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: newTheme });
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    setCommandPaletteOpen(false);
    toast({
      title: 'Theme Changed',
      description: `Switched to ${newTheme} mode.`,
    });
  }, [settings.theme, updateSettings, setCommandPaletteOpen, toast]);

  const handleCheckConnection = useCallback(async () => {
    setCommandPaletteOpen(false);
    await checkConnection();
    toast({
      title: 'Connection Checked',
      description: 'Ollama connection status updated.',
    });
  }, [checkConnection, setCommandPaletteOpen, toast]);

  const handleClearChats = useCallback(() => {
    clearAllConversations();
    setCommandPaletteOpen(false);
    toast({
      title: 'Chats Cleared',
      description: 'All conversations have been deleted.',
    });
  }, [clearAllConversations, setCommandPaletteOpen, toast]);

  const handleChatWithModel = useCallback((modelName: string) => {
    const newConvId = createConversation(modelName, `Chat with ${modelName}`);
    setActiveConversation(newConvId);
    navigate('/assistant', { state: { selectedModel: modelName } });
    setCommandPaletteOpen(false);
  }, [createConversation, setActiveConversation, navigate, setCommandPaletteOpen]);

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={handleNewChat}>
            <Plus className="mr-2 h-4 w-4" />
            <span>New Chat</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={handleRefreshModels}>
            <RefreshCw className="mr-2 h-4 w-4" />
            <span>Refresh Models</span>
          </CommandItem>
          <CommandItem onSelect={handleToggleTheme}>
            {settings.theme === 'dark' ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            <span>Toggle Theme</span>
          </CommandItem>
          <CommandItem onSelect={handleCheckConnection}>
            <RefreshCw className="mr-2 h-4 w-4" />
            <span>Check Connection</span>
          </CommandItem>
          <CommandItem onSelect={() => { toggleSidebar(); setCommandPaletteOpen(false); }}>
            <FolderOpen className="mr-2 h-4 w-4" />
            <span>Toggle Sidebar</span>
            <CommandShortcut>⌘/</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          {navigationItems.map((item, index) => (
            <CommandItem key={item.path} onSelect={() => handleNavigation(item.path)}>
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
              {index < 7 && <CommandShortcut>⌘{index + 1}</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Available Models - Quick Chat */}
        {models.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Chat with Model">
              {models.slice(0, 5).map((model) => (
                <CommandItem 
                  key={model.name} 
                  onSelect={() => handleChatWithModel(model.name)}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>{model.name}</span>
                  {runningModels.some(r => r.name === model.name) && (
                    <span className="ml-2 text-xs text-green-600">● Running</span>
                  )}
                </CommandItem>
              ))}
              {models.length > 5 && (
                <CommandItem onSelect={() => handleNavigation('/models')}>
                  <Search className="mr-2 h-4 w-4" />
                  <span>View all {models.length} models...</span>
                </CommandItem>
              )}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />

        {/* Danger Zone */}
        <CommandGroup heading="Danger Zone">
          <CommandItem 
            onSelect={handleClearChats}
            className="text-red-600 dark:text-red-400"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Clear All Chats</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
