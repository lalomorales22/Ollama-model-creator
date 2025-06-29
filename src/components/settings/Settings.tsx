import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Settings as SettingsIcon, 
  Server, 
  Palette, 
  Bell, 
  Shield,
  Download,
  Trash2,
  RefreshCw,
  Save,
  AlertCircle,
  CheckCircle,
  Monitor,
  Moon,
  Sun,
  Globe,
  Database,
  Cpu,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ollamaService } from '@/services/ollama';
import { OllamaModel } from '@/types/ollama';

interface AppSettings {
  // Connection Settings
  ollamaUrl: string;
  connectionTimeout: number;
  autoReconnect: boolean;
  
  // UI Settings
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
  showTooltips: boolean;
  animationsEnabled: boolean;
  
  // Model Settings
  defaultModel: string;
  defaultTemperature: number;
  defaultContextLength: number;
  autoLoadModels: boolean;
  
  // Notifications
  showNotifications: boolean;
  notifyOnDownload: boolean;
  notifyOnModelCreation: boolean;
  notifyOnErrors: boolean;
  
  // Advanced
  enableDebugMode: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  maxLogEntries: number;
  clearDataOnExit: boolean;
}

export function Settings() {
  const [settings, setSettings] = useState<AppSettings>({
    // Connection Settings
    ollamaUrl: 'http://localhost:11434',
    connectionTimeout: 30000,
    autoReconnect: true,
    
    // UI Settings
    theme: 'light',
    compactMode: false,
    showTooltips: true,
    animationsEnabled: true,
    
    // Model Settings
    defaultModel: 'llama3.2',
    defaultTemperature: 0.8,
    defaultContextLength: 2048,
    autoLoadModels: true,
    
    // Notifications
    showNotifications: true,
    notifyOnDownload: true,
    notifyOnModelCreation: true,
    notifyOnErrors: true,
    
    // Advanced
    enableDebugMode: false,
    logLevel: 'info',
    maxLogEntries: 1000,
    clearDataOnExit: false,
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'testing'>('disconnected');
  const [availableModels, setAvailableModels] = useState<OllamaModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    testConnection();
    loadAvailableModels();
  }, []);

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('ollama-app-settings');
      if (saved) {
        const parsedSettings = JSON.parse(saved);
        setSettings({ ...settings, ...parsedSettings });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadAvailableModels = async () => {
    setIsLoadingModels(true);
    try {
      const models = await ollamaService.getModels();
      setAvailableModels(models);
    } catch (error) {
      console.error('Error loading models:', error);
      // Set fallback models if Ollama is not available
      setAvailableModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const saveSettings = () => {
    try {
      localStorage.setItem('ollama-app-settings', JSON.stringify(settings));
      setHasUnsavedChanges(false);
      toast({
        title: "Settings Saved",
        description: "Your preferences have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error Saving Settings",
        description: "Failed to save your settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      const defaultSettings: AppSettings = {
        ollamaUrl: 'http://localhost:11434',
        connectionTimeout: 30000,
        autoReconnect: true,
        theme: 'light',
        compactMode: false,
        showTooltips: true,
        animationsEnabled: true,
        defaultModel: 'llama3.2',
        defaultTemperature: 0.8,
        defaultContextLength: 2048,
        autoLoadModels: true,
        showNotifications: true,
        notifyOnDownload: true,
        notifyOnModelCreation: true,
        notifyOnErrors: true,
        enableDebugMode: false,
        logLevel: 'info',
        maxLogEntries: 1000,
        clearDataOnExit: false,
      };
      setSettings(defaultSettings);
      setHasUnsavedChanges(true);
      toast({
        title: "Settings Reset",
        description: "All settings have been reset to defaults. Don't forget to save!",
      });
    }
  };

  const testConnection = async () => {
    setConnectionStatus('testing');
    try {
      const response = await fetch(`${settings.ollamaUrl}/api/version`, {
        method: 'GET',
        signal: AbortSignal.timeout(settings.connectionTimeout)
      });
      
      if (response.ok) {
        setConnectionStatus('connected');
        // Reload models when connection is successful
        loadAvailableModels();
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      setConnectionStatus('disconnected');
    }
  };

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all app data? This will remove all ModelFiles and settings.')) {
      localStorage.clear();
      toast({
        title: "Data Cleared",
        description: "All application data has been cleared. The page will reload.",
      });
      setTimeout(() => window.location.reload(), 2000);
    }
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ollama-app-settings.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Settings Exported",
      description: "Your settings have been downloaded as a JSON file.",
    });
  };

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  // Get available models for dropdown
  const getModelOptions = () => {
    const fallbackModels = [
      { name: 'llama3.2', displayName: 'Llama 3.2' },
      { name: 'llama3.1', displayName: 'Llama 3.1' },
      { name: 'mistral', displayName: 'Mistral' },
      { name: 'codellama', displayName: 'Code Llama' },
      { name: 'gemma2', displayName: 'Gemma 2' },
    ];

    if (availableModels.length > 0) {
      return availableModels.map(model => ({
        name: model.name,
        displayName: model.name
      }));
    }

    return fallbackModels;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Settings</h1>
          <p className="text-gray-600">Configure your Ollama ModelFile Creator preferences</p>
        </div>
        <div className="flex space-x-2">
          {hasUnsavedChanges && (
            <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">
              Unsaved Changes
            </Badge>
          )}
          <Button
            onClick={saveSettings}
            disabled={!hasUnsavedChanges}
            className="bg-black text-white hover:bg-gray-800 border-2 border-black"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>

      <Tabs defaultValue="connection" className="w-full">
        <TabsList className="grid w-full grid-cols-5 border-4 border-black bg-white">
          <TabsTrigger 
            value="connection" 
            className="data-[state=active]:bg-black data-[state=active]:text-white border-2 border-black"
          >
            <Server className="w-4 h-4 mr-2" />
            Connection
          </TabsTrigger>
          <TabsTrigger 
            value="interface" 
            className="data-[state=active]:bg-black data-[state=active]:text-white border-2 border-black"
          >
            <Palette className="w-4 h-4 mr-2" />
            Interface
          </TabsTrigger>
          <TabsTrigger 
            value="models" 
            className="data-[state=active]:bg-black data-[state=active]:text-white border-2 border-black"
          >
            <Cpu className="w-4 h-4 mr-2" />
            Models
          </TabsTrigger>
          <TabsTrigger 
            value="notifications" 
            className="data-[state=active]:bg-black data-[state=active]:text-white border-2 border-black"
          >
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger 
            value="advanced" 
            className="data-[state=active]:bg-black data-[state=active]:text-white border-2 border-black"
          >
            <Shield className="w-4 h-4 mr-2" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-6">
          <Card className="p-6 border-4 border-black bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-black">Ollama Connection</h3>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' :
                  connectionStatus === 'testing' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-600">
                  {connectionStatus === 'connected' ? 'Connected' :
                   connectionStatus === 'testing' ? 'Testing...' :
                   'Disconnected'}
                </span>
                <Button
                  onClick={testConnection}
                  variant="outline"
                  size="sm"
                  className="border-2 border-black hover:bg-black hover:text-white"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="ollamaUrl">Ollama API URL</Label>
                <Input
                  id="ollamaUrl"
                  value={settings.ollamaUrl}
                  onChange={(e) => updateSetting('ollamaUrl', e.target.value)}
                  className="border-2 border-black"
                  placeholder="http://localhost:11434"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The URL where your Ollama service is running
                </p>
              </div>

              <div>
                <Label htmlFor="connectionTimeout">Connection Timeout (ms)</Label>
                <Input
                  id="connectionTimeout"
                  type="number"
                  value={settings.connectionTimeout}
                  onChange={(e) => updateSetting('connectionTimeout', parseInt(e.target.value))}
                  className="border-2 border-black"
                  min="1000"
                  max="60000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  How long to wait for API responses before timing out
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoReconnect">Auto Reconnect</Label>
                  <p className="text-xs text-gray-500">
                    Automatically try to reconnect when connection is lost
                  </p>
                </div>
                <Switch
                  id="autoReconnect"
                  checked={settings.autoReconnect}
                  onCheckedChange={(checked) => updateSetting('autoReconnect', checked)}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="interface" className="space-y-6">
          <Card className="p-6 border-4 border-black bg-white">
            <h3 className="text-xl font-bold text-black mb-4">Appearance</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="theme">Theme</Label>
                <Select value={settings.theme} onValueChange={(value: any) => updateSetting('theme', value)}>
                  <SelectTrigger className="border-2 border-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center">
                        <Sun className="w-4 h-4 mr-2" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center">
                        <Moon className="w-4 h-4 mr-2" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center">
                        <Monitor className="w-4 h-4 mr-2" />
                        System
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="compactMode">Compact Mode</Label>
                  <p className="text-xs text-gray-500">
                    Use smaller spacing and components
                  </p>
                </div>
                <Switch
                  id="compactMode"
                  checked={settings.compactMode}
                  onCheckedChange={(checked) => updateSetting('compactMode', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="showTooltips">Show Tooltips</Label>
                  <p className="text-xs text-gray-500">
                    Display helpful tooltips on hover
                  </p>
                </div>
                <Switch
                  id="showTooltips"
                  checked={settings.showTooltips}
                  onCheckedChange={(checked) => updateSetting('showTooltips', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="animationsEnabled">Enable Animations</Label>
                  <p className="text-xs text-gray-500">
                    Use smooth transitions and animations
                  </p>
                </div>
                <Switch
                  id="animationsEnabled"
                  checked={settings.animationsEnabled}
                  onCheckedChange={(checked) => updateSetting('animationsEnabled', checked)}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <Card className="p-6 border-4 border-black bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-black">Model Defaults</h3>
              <Button
                onClick={loadAvailableModels}
                variant="outline"
                size="sm"
                disabled={isLoadingModels}
                className="border-2 border-black hover:bg-black hover:text-white"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingModels ? 'animate-spin' : ''}`} />
                Refresh Models
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="defaultModel">Default Model</Label>
                <Select 
                  value={settings.defaultModel} 
                  onValueChange={(value) => updateSetting('defaultModel', value)}
                >
                  <SelectTrigger className="border-2 border-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getModelOptions().map((model) => (
                      <SelectItem key={model.name} value={model.name}>
                        {model.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Default model for AI Assistant and new ModelFiles
                  {availableModels.length === 0 && (
                    <span className="text-yellow-600"> • Showing fallback models (Ollama not connected)</span>
                  )}
                </p>
              </div>

              <div>
                <Label htmlFor="defaultTemperature">Default Temperature</Label>
                <Input
                  id="defaultTemperature"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="2.0"
                  value={settings.defaultTemperature}
                  onChange={(e) => updateSetting('defaultTemperature', parseFloat(e.target.value))}
                  className="border-2 border-black"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default creativity setting for new models (0.1 = focused, 2.0 = creative)
                </p>
              </div>

              <div>
                <Label htmlFor="defaultContextLength">Default Context Length</Label>
                <Input
                  id="defaultContextLength"
                  type="number"
                  min="512"
                  max="32768"
                  value={settings.defaultContextLength}
                  onChange={(e) => updateSetting('defaultContextLength', parseInt(e.target.value))}
                  className="border-2 border-black"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default context window size for new models
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoLoadModels">Auto Load Models</Label>
                  <p className="text-xs text-gray-500">
                    Automatically refresh model list on app start
                  </p>
                </div>
                <Switch
                  id="autoLoadModels"
                  checked={settings.autoLoadModels}
                  onCheckedChange={(checked) => updateSetting('autoLoadModels', checked)}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="p-6 border-4 border-black bg-white">
            <h3 className="text-xl font-bold text-black mb-4">Notification Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="showNotifications">Enable Notifications</Label>
                  <p className="text-xs text-gray-500">
                    Show toast notifications for various events
                  </p>
                </div>
                <Switch
                  id="showNotifications"
                  checked={settings.showNotifications}
                  onCheckedChange={(checked) => updateSetting('showNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifyOnDownload">Download Notifications</Label>
                  <p className="text-xs text-gray-500">
                    Notify when model downloads complete
                  </p>
                </div>
                <Switch
                  id="notifyOnDownload"
                  checked={settings.notifyOnDownload}
                  onCheckedChange={(checked) => updateSetting('notifyOnDownload', checked)}
                  disabled={!settings.showNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifyOnModelCreation">Model Creation Notifications</Label>
                  <p className="text-xs text-gray-500">
                    Notify when custom models are created
                  </p>
                </div>
                <Switch
                  id="notifyOnModelCreation"
                  checked={settings.notifyOnModelCreation}
                  onCheckedChange={(checked) => updateSetting('notifyOnModelCreation', checked)}
                  disabled={!settings.showNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifyOnErrors">Error Notifications</Label>
                  <p className="text-xs text-gray-500">
                    Notify when errors occur
                  </p>
                </div>
                <Switch
                  id="notifyOnErrors"
                  checked={settings.notifyOnErrors}
                  onCheckedChange={(checked) => updateSetting('notifyOnErrors', checked)}
                  disabled={!settings.showNotifications}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card className="p-6 border-4 border-black bg-white">
            <h3 className="text-xl font-bold text-black mb-4">Advanced Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableDebugMode">Debug Mode</Label>
                  <p className="text-xs text-gray-500">
                    Enable detailed logging and debug information
                  </p>
                </div>
                <Switch
                  id="enableDebugMode"
                  checked={settings.enableDebugMode}
                  onCheckedChange={(checked) => updateSetting('enableDebugMode', checked)}
                />
              </div>

              <div>
                <Label htmlFor="logLevel">Log Level</Label>
                <Select value={settings.logLevel} onValueChange={(value: any) => updateSetting('logLevel', value)}>
                  <SelectTrigger className="border-2 border-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warn">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Minimum level of messages to log
                </p>
              </div>

              <div>
                <Label htmlFor="maxLogEntries">Max Log Entries</Label>
                <Input
                  id="maxLogEntries"
                  type="number"
                  min="100"
                  max="10000"
                  value={settings.maxLogEntries}
                  onChange={(e) => updateSetting('maxLogEntries', parseInt(e.target.value))}
                  className="border-2 border-black"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum number of log entries to keep in memory
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="clearDataOnExit">Clear Data on Exit</Label>
                  <p className="text-xs text-gray-500">
                    Clear all temporary data when closing the app
                  </p>
                </div>
                <Switch
                  id="clearDataOnExit"
                  checked={settings.clearDataOnExit}
                  onCheckedChange={(checked) => updateSetting('clearDataOnExit', checked)}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-4 border-black bg-white">
            <h3 className="text-xl font-bold text-black mb-4">Data Management</h3>
            <div className="space-y-4">
              <div className="flex space-x-4">
                <Button
                  onClick={exportSettings}
                  variant="outline"
                  className="flex-1 border-2 border-black hover:bg-black hover:text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Settings
                </Button>
                <Button
                  onClick={resetSettings}
                  variant="outline"
                  className="flex-1 border-2 border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset to Defaults
                </Button>
              </div>
              
              <Button
                onClick={clearAllData}
                variant="outline"
                className="w-full border-2 border-red-500 text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All App Data
              </Button>
              
              <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-yellow-800">Warning</h4>
                    <p className="text-sm text-yellow-700">
                      Clearing all app data will permanently delete your ModelFiles, settings, and other stored information. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}