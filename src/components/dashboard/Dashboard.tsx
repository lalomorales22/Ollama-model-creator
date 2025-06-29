import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, 
  Cpu, 
  HardDrive, 
  Clock, 
  TrendingUp,
  Plus,
  MessageSquare,
  FileText,
  Download,
  AlertCircle
} from 'lucide-react';
import { ollamaService } from '@/services/ollama';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const [stats, setStats] = useState({
    totalModels: 0,
    runningModels: 0,
    totalSize: 0,
    ollamaVersion: 'Unknown'
  });
  const [recentActivity, setRecentActivity] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      
      const [models, runningModels, version] = await Promise.all([
        ollamaService.getModels(),
        ollamaService.getRunningModels(),
        ollamaService.getVersion().catch(() => 'Unknown')
      ]);

      const totalSize = models.reduce((acc, model) => acc + model.size, 0);

      setStats({
        totalModels: models.length,
        runningModels: runningModels.length,
        totalSize,
        ollamaVersion: version
      });

      // Simulate recent activity
      setRecentActivity([
        'Created custom coding assistant model',
        'Downloaded llama3.2:latest',
        'Generated ModelFile for writing helper',
        'Copied model to "my-assistant"',
        'Started AI assistant session'
      ]);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setHasError(true);
      
      toast({
        title: "Connection Error",
        description: "Failed to connect to Ollama service. Please ensure Ollama is running on localhost:11434",
        variant: "destructive",
      });
      
      // Set default values when connection fails
      setStats({
        totalModels: 0,
        runningModels: 0,
        totalSize: 0,
        ollamaVersion: 'Connection Failed'
      });
      
      setRecentActivity([
        'Unable to load recent activity',
        'Check Ollama service status'
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const retryConnection = () => {
    loadDashboardData();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Dashboard</h1>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6 border-4 border-black bg-white animate-pulse">
              <div className="h-16 bg-gray-200 rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black mb-2">Dashboard</h1>
        <p className="text-gray-600">Create and manage your custom Ollama models</p>
        {hasError && (
          <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div className="flex-1">
              <p className="text-sm text-red-800">Unable to connect to Ollama service</p>
              <p className="text-xs text-red-600">Make sure Ollama is running on localhost:11434</p>
            </div>
            <Button 
              onClick={retryConnection}
              size="sm"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Retry
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className={`p-6 border-4 ${hasError ? 'border-red-300 bg-red-50' : 'border-black bg-white'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Models</p>
              <p className="text-2xl font-bold text-black">{stats.totalModels}</p>
            </div>
            <div className={`w-12 h-12 ${hasError ? 'bg-red-600' : 'bg-black'} rounded-lg flex items-center justify-center`}>
              <Brain className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className={`p-6 border-4 ${hasError ? 'border-red-300 bg-red-50' : 'border-black bg-white'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Running Models</p>
              <p className="text-2xl font-bold text-black">{stats.runningModels}</p>
            </div>
            <div className={`w-12 h-12 ${hasError ? 'bg-red-600' : 'bg-black'} rounded-lg flex items-center justify-center`}>
              <Cpu className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className={`p-6 border-4 ${hasError ? 'border-red-300 bg-red-50' : 'border-black bg-white'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Size</p>
              <p className="text-2xl font-bold text-black">{formatSize(stats.totalSize)}</p>
            </div>
            <div className={`w-12 h-12 ${hasError ? 'bg-red-600' : 'bg-black'} rounded-lg flex items-center justify-center`}>
              <HardDrive className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className={`p-6 border-4 ${hasError ? 'border-red-300 bg-red-50' : 'border-black bg-white'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ollama Version</p>
              <p className="text-lg font-bold text-black">{stats.ollamaVersion}</p>
            </div>
            <div className={`w-12 h-12 ${hasError ? 'bg-red-600' : 'bg-black'} rounded-lg flex items-center justify-center`}>
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border-4 border-black bg-white">
          <h2 className="text-xl font-bold text-black mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => navigate('/assistant')}
              className="h-20 bg-black text-white hover:bg-gray-800 border-2 border-black flex flex-col items-center justify-center space-y-2"
            >
              <MessageSquare className="w-6 h-6" />
              <span className="text-sm">AI Assistant</span>
            </Button>
            
            <Button
              onClick={() => navigate('/create')}
              variant="outline"
              className="h-20 border-2 border-black hover:bg-black hover:text-white flex flex-col items-center justify-center space-y-2"
            >
              <Plus className="w-6 h-6" />
              <span className="text-sm">Create Model</span>
            </Button>
            
            <Button
              onClick={() => navigate('/models')}
              variant="outline"
              className="h-20 border-2 border-black hover:bg-black hover:text-white flex flex-col items-center justify-center space-y-2"
            >
              <Brain className="w-6 h-6" />
              <span className="text-sm">View Models</span>
            </Button>
            
            <Button
              onClick={() => navigate('/modelfiles')}
              variant="outline"
              className="h-20 border-2 border-black hover:bg-black hover:text-white flex flex-col items-center justify-center space-y-2"
            >
              <FileText className="w-6 h-6" />
              <span className="text-sm">ModelFiles</span>
            </Button>
          </div>
        </Card>

        <Card className="p-6 border-4 border-black bg-white">
          <h2 className="text-xl font-bold text-black mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-lg">
                <div className={`w-2 h-2 ${hasError ? 'bg-red-500' : 'bg-black'} rounded-full`}></div>
                <span className="text-sm text-gray-700">{activity}</span>
                <Badge variant="outline" className="ml-auto text-xs">
                  {hasError ? 'Error' : `${index + 1}h ago`}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* System Status */}
      <Card className="p-6 border-4 border-black bg-white">
        <h2 className="text-xl font-bold text-black mb-4">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 ${hasError ? 'bg-red-500' : 'bg-green-500'} rounded-full`}></div>
            <span className="text-sm text-gray-700">
              Ollama Service: {hasError ? 'Disconnected' : 'Running'}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 ${hasError ? 'bg-red-500' : 'bg-green-500'} rounded-full`}></div>
            <span className="text-sm text-gray-700">
              API Connection: {hasError ? 'Failed' : 'Active'}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Port: localhost:11434</span>
          </div>
        </div>
      </Card>
    </div>
  );
}