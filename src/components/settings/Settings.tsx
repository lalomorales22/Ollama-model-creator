import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Settings as SettingsIcon, 
  Server, 
  Palette, 
  Bell, 
  Shield,
  Download,
  Upload,
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
import { useSettingsStore, AppSettings } from '@/stores/settings-store';
import { useModelsStore } from '@/stores/models-store';
import { useConnectionStore } from '@/stores/connection-store';
import { ConnectionStatus } from '@/components/ConnectionStatus';

export function Settings() {
  const { settings, updateSettings, resetSettings: resetStoreSettings } = useSettingsStore();
  const { models, isLoading: isLoadingModels, fetchModels } = useModelsStore();
  const { status, checkConnection } = useConnectionStore();
  
  // Default settings fallback
  const defaultSettings: AppSettings = {
    ollamaUrl: 'http://localhost:11434',
    connectionTimeout: 30000,
    autoReconnect: true,
    theme: 'system',
    sidebarCollapsed: false,
    compactMode: false,
    showTooltips: true,
    animationsEnabled: true,
    defaultModel: 'gpt-oss:20b',
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
    streamingEnabled: true,
  };
  
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings || defaultSettings);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { toast } = useToast();

  const connectionStatus = status === 'connected' ? 'connected' : status === 'connecting' ? 'testing' : 'disconnected';

  useEffect(() => {
    fetchModels();
    checkConnection();
  }, []);

  // Sync local settings with store
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const saveSettings = () => {
    updateSettings(localSettings);
    setHasUnsavedChanges(false);
    toast({
      title: "Settings Saved",
      description: "Your preferences have been saved successfully.",
    });
    
    // Apply theme immediately
    if (localSettings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (localSettings.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const resetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      resetStoreSettings();
      setLocalSettings(useSettingsStore.getState().settings);
      setHasUnsavedChanges(false);
      toast({
        title: "Settings Reset",
        description: "All settings have been reset to defaults.",
      });
    }
  };

  const testConnection = async () => {
    await checkConnection();
    if (status === 'connected') {
      fetchModels();
      toast({
        title: "Connection Successful",
        description: "Connected to Ollama service.",
      });
    } else {
      toast({
        title: "Connection Failed",
        description: "Could not connect to Ollama. Make sure it's running.",
        variant: "destructive",
      });
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
    const dataStr = JSON.stringify(localSettings, null, 2);
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

  const importSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const imported = JSON.parse(text);
        // Merge with defaults to handle missing keys
        const merged = { ...defaultSettings, ...imported };
        setLocalSettings(merged);
        setHasUnsavedChanges(true);
        toast({
          title: "Settings Imported",
          description: "Settings loaded from file. Click Save to apply.",
        });
      } catch {
        toast({
          title: "Import Failed",
          description: "Invalid settings file.",
          variant: "destructive",
        });
      }
    };
    input.click();
  };

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  // Get available models for dropdown
  const getModelOptions = () => {
    if (models.length > 0) {
      return models.map(model => ({
        name: model.name,
        displayName: model.name
      }));
    }

    // Fallback models
    return [
      { name: 'llama3.2', displayName: 'Llama 3.2' },
      { name: 'llama3.1', displayName: 'Llama 3.1' },
      { name: 'mistral', displayName: 'Mistral' },
      { name: 'codellama', displayName: 'Code Llama' },
      { name: 'gemma2', displayName: 'Gemma 2' },
    ];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white mb-2">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Configure your Ollama ModelFile Creator preferences</p>
        </div>
        <div className="flex items-center space-x-2">
          <ConnectionStatus />
          {hasUnsavedChanges && (
            <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50 dark:bg-yellow-900 dark:text-yellow-300">
              Unsaved Changes
            </Badge>
          )}
          <Button
            onClick={saveSettings}
            disabled={!hasUnsavedChanges}
            className="bg-black dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600 border-2 border-gray-300 dark:border-gray-600"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>

      <Tabs defaultValue="connection" className="w-full">
        <TabsList className="grid w-full grid-cols-5 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <TabsTrigger 
            value="connection" 
            className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-gray-700 border-2 border-gray-300 dark:border-gray-600"
          >
            <Server className="w-4 h-4 mr-2" />
            Connection
          </TabsTrigger>
          <TabsTrigger 
            value="interface" 
            className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-gray-700 border-2 border-gray-300 dark:border-gray-600"
          >
            <Palette className="w-4 h-4 mr-2" />
            Interface
          </TabsTrigger>
          <TabsTrigger 
            value="models" 
            className="data-[state=active]:bg-black data-[state=active]:text-white border-2 border-gray-300 dark:border-gray-600"
          >
            <Cpu className="w-4 h-4 mr-2" />
            Models
          </TabsTrigger>
          <TabsTrigger 
            value="notifications" 
            className="data-[state=active]:bg-black data-[state=active]:text-white border-2 border-gray-300 dark:border-gray-600"
          >
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger 
            value="advanced" 
            className="data-[state=active]:bg-black data-[state=active]:text-white border-2 border-gray-300 dark:border-gray-600"
          >
            <Shield className="w-4 h-4 mr-2" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-6">
          <Card className="p-6 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold dark:text-white">Ollama Connection</h3>
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
                  className="border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
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
                  value={localSettings.ollamaUrl}
                  onChange={(e) => updateSetting('ollamaUrl', e.target.value)}
                  className="border-2 border-gray-300 dark:border-gray-600"
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
                  value={localSettings.connectionTimeout}
                  onChange={(e) => updateSetting('connectionTimeout', parseInt(e.target.value))}
                  className="border-2 border-gray-300 dark:border-gray-600"
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
                  checked={localSettings.autoReconnect}
                  onCheckedChange={(checked) => updateSetting('autoReconnect', checked)}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="interface" className="space-y-6">
          <Card className="p-6 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <h3 className="text-xl font-bold dark:text-white mb-4">Appearance</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="theme">Theme</Label>
                <Select value={localSettings.theme} onValueChange={(value: any) => updateSetting('theme', value)}>
                  <SelectTrigger className="border-2 border-gray-300 dark:border-gray-600">
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
                  checked={localSettings.compactMode}
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
                  checked={localSettings.showTooltips}
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
                  checked={localSettings.animationsEnabled}
                  onCheckedChange={(checked) => updateSetting('animationsEnabled', checked)}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <Card className="p-6 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold dark:text-white">Model Defaults</h3>
              <Button
                onClick={fetchModels}
                variant="outline"
                size="sm"
                disabled={isLoadingModels}
                className="border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingModels ? 'animate-spin' : ''}`} />
                Refresh Models
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="defaultModel">Default Model</Label>
                <Select 
                  value={localSettings.defaultModel} 
                  onValueChange={(value) => updateSetting('defaultModel', value)}
                >
                  <SelectTrigger className="border-2 border-gray-300 dark:border-gray-600">
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
                  {models.length === 0 && (
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
                  value={localSettings.defaultTemperature}
                  onChange={(e) => updateSetting('defaultTemperature', parseFloat(e.target.value))}
                  className="border-2 border-gray-300 dark:border-gray-600"
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
                  value={localSettings.defaultContextLength}
                  onChange={(e) => updateSetting('defaultContextLength', parseInt(e.target.value))}
                  className="border-2 border-gray-300 dark:border-gray-600"
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
                  checked={localSettings.autoLoadModels}
                  onCheckedChange={(checked) => updateSetting('autoLoadModels', checked)}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="p-6 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <h3 className="text-xl font-bold dark:text-white mb-4">Notification Preferences</h3>
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
                  checked={localSettings.showNotifications}
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
                  checked={localSettings.notifyOnDownload}
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
                  checked={localSettings.notifyOnModelCreation}
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
                  checked={localSettings.notifyOnErrors}
                  onCheckedChange={(checked) => updateSetting('notifyOnErrors', checked)}
                  disabled={!settings.showNotifications}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card className="p-6 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <h3 className="text-xl font-bold dark:text-white mb-4">Advanced Settings</h3>
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
                  checked={localSettings.enableDebugMode}
                  onCheckedChange={(checked) => updateSetting('enableDebugMode', checked)}
                />
              </div>

              <div>
                <Label htmlFor="logLevel">Log Level</Label>
                <Select value={localSettings.logLevel} onValueChange={(value: any) => updateSetting('logLevel', value)}>
                  <SelectTrigger className="border-2 border-gray-300 dark:border-gray-600">
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
                  value={localSettings.maxLogEntries}
                  onChange={(e) => updateSetting('maxLogEntries', parseInt(e.target.value))}
                  className="border-2 border-gray-300 dark:border-gray-600"
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
                  checked={localSettings.clearDataOnExit}
                  onCheckedChange={(checked) => updateSetting('clearDataOnExit', checked)}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <h3 className="text-xl font-bold dark:text-white mb-4">Data Management</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Button
                  onClick={exportSettings}
                  variant="outline"
                  className="border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button
                  onClick={importSettings}
                  variant="outline"
                  className="border-2 border-blue-500 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
                <Button
                  onClick={resetSettings}
                  variant="outline"
                  className="border-2 border-yellow-500 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
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
              
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg">
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