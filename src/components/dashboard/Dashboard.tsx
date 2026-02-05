import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Cpu, 
  HardDrive, 
  Plus,
  MessageSquare,
  FileText,
  AlertCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  TrendingUp,
  Clock,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useModelsStore } from '@/stores/models-store';
import { useConnectionStore } from '@/stores/connection-store';
import { useActivityStore } from '@/stores/activity-store';
import { useChatStore } from '@/stores/chat-store';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip,
  Legend
} from 'recharts';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

// Colors for charts
const COLORS = ['#000000', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB'];
const DARK_COLORS = ['#FFFFFF', '#E5E7EB', '#D1D5DB', '#9CA3AF', '#6B7280'];

export function Dashboard() {
  const navigate = useNavigate();
  
  // Use stores instead of local state
  const { models, runningModels, isLoading, fetchModels } = useModelsStore();
  const { status, version, checkConnection } = useConnectionStore();
  const { activities, getRecentActivities } = useActivityStore();
  const { conversations } = useChatStore();
  
  const hasError = status === 'error' || status === 'disconnected';
  const isConnecting = status === 'connecting';
  
  // Computed values
  const totalSize = models.reduce((acc, model) => acc + model.size, 0);
  const recentActivities = getRecentActivities(5);
  const recentConversations = conversations.slice(0, 3);

  // Prepare chart data
  const modelSizeData = models.slice(0, 5).map(model => ({
    name: model.name.split(':')[0],
    size: model.size / (1024 * 1024 * 1024), // Convert to GB
    fullName: model.name,
  }));

  const storageData = [
    { name: 'Used', value: totalSize },
    { name: 'Free', value: Math.max(0, 100 * 1024 * 1024 * 1024 - totalSize) }, // Assume 100GB total
  ];

  const formatSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const handleRefresh = async () => {
    await checkConnection();
    await fetchModels();
  };

  if (isLoading && models.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white mb-2">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6 border-4 border-black dark:border-gray-700 bg-white dark:bg-gray-900 animate-pulse">
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white mb-2">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Create and manage your custom Ollama models</p>
        </div>
        <div className="flex items-center gap-3">
          <ConnectionStatus />
          <Button 
            onClick={handleRefresh}
            size="sm"
            variant="outline"
            className="border-2 border-black dark:border-gray-600 hover:bg-black hover:text-white dark:hover:bg-gray-700"
            disabled={isConnecting}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isConnecting ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {hasError && (
        <motion.div variants={itemVariants}>
          <Card className="p-4 border-4 border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-800">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <p className="text-sm text-red-800 dark:text-red-200">Unable to connect to Ollama service</p>
                <p className="text-xs text-red-600 dark:text-red-400">Make sure Ollama is running on localhost:11434</p>
              </div>
              <Button 
                onClick={handleRefresh}
                size="sm"
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300"
              >
                Retry
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className={`p-6 border-4 ${hasError ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950' : 'border-black dark:border-gray-700 bg-white dark:bg-gray-900'} cursor-pointer transition-shadow hover:shadow-lg`}
            onClick={() => navigate('/models')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Models</p>
                <p className="text-3xl font-bold text-black dark:text-white">{models.length}</p>
                <p className="text-xs text-gray-500 mt-1">Click to view all</p>
              </div>
              <div className={`w-12 h-12 ${hasError ? 'bg-red-600' : 'bg-black dark:bg-gray-700'} rounded-lg flex items-center justify-center`}>
                <Brain className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className={`p-6 border-4 ${hasError ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950' : 'border-black dark:border-gray-700 bg-white dark:bg-gray-900'} cursor-pointer transition-shadow hover:shadow-lg`}
            onClick={() => navigate('/running')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Running Models</p>
                <p className="text-3xl font-bold text-black dark:text-white">{runningModels.length}</p>
                {runningModels.length > 0 && (
                  <p className="text-xs text-green-600 mt-1 flex items-center">
                    <Zap className="w-3 h-3 mr-1" /> Active
                  </p>
                )}
              </div>
              <div className={`w-12 h-12 ${runningModels.length > 0 ? 'bg-green-600' : hasError ? 'bg-red-600' : 'bg-black dark:bg-gray-700'} rounded-lg flex items-center justify-center`}>
                <Cpu className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className={`p-6 border-4 ${hasError ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950' : 'border-black dark:border-gray-700 bg-white dark:bg-gray-900'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Size</p>
                <p className="text-3xl font-bold text-black dark:text-white">{formatSize(totalSize)}</p>
                <p className="text-xs text-gray-500 mt-1">{models.length} models</p>
              </div>
              <div className={`w-12 h-12 ${hasError ? 'bg-red-600' : 'bg-black dark:bg-gray-700'} rounded-lg flex items-center justify-center`}>
                <HardDrive className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className={`p-6 border-4 ${hasError ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950' : 'border-black dark:border-gray-700 bg-white dark:bg-gray-900'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ollama Version</p>
                <p className="text-lg font-bold text-black dark:text-white">{version || 'Unknown'}</p>
                <p className={`text-xs mt-1 ${status === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
                  {status === 'connected' ? '● Connected' : '○ Disconnected'}
                </p>
              </div>
              <div className={`w-12 h-12 ${hasError ? 'bg-red-600' : 'bg-black dark:bg-gray-700'} rounded-lg flex items-center justify-center`}>
                {status === 'connected' ? (
                  <Wifi className="w-6 h-6 text-white" />
                ) : (
                  <WifiOff className="w-6 h-6 text-white" />
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Sizes Chart */}
        <Card className="p-6 border-4 border-black dark:border-gray-700 bg-white dark:bg-gray-900">
          <h2 className="text-xl font-bold text-black dark:text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Model Sizes (GB)
          </h2>
          {modelSizeData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelSizeData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fontSize: 12 }} 
                    width={80}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(2)} GB`, 'Size']}
                    labelFormatter={(label) => modelSizeData.find(d => d.name === label)?.fullName || label}
                    contentStyle={{ 
                      backgroundColor: 'var(--background)', 
                      border: '2px solid black',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="size" 
                    fill="#000000" 
                    radius={[0, 4, 4, 0]}
                    className="dark:fill-white"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No models installed</p>
              </div>
            </div>
          )}
        </Card>

        {/* Storage Usage Pie Chart */}
        <Card className="p-6 border-4 border-black dark:border-gray-700 bg-white dark:bg-gray-900">
          <h2 className="text-xl font-bold text-black dark:text-white mb-4 flex items-center">
            <HardDrive className="w-5 h-5 mr-2" />
            Storage Distribution
          </h2>
          <div className="h-64 flex items-center">
            {models.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={models.slice(0, 5).map((m, i) => ({
                      name: m.name.split(':')[0],
                      value: m.size,
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {models.slice(0, 5).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatSize(value)}
                    contentStyle={{ 
                      backgroundColor: 'var(--background)', 
                      border: '2px solid black',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend 
                    formatter={(value) => <span className="text-sm dark:text-gray-300">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <HardDrive className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No storage data</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Quick Actions & Activity */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="p-6 border-4 border-black dark:border-gray-700 bg-white dark:bg-gray-900">
          <h2 className="text-xl font-bold text-black dark:text-white mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => navigate('/assistant')}
                className="w-full h-20 bg-black dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600 border-2 border-black dark:border-gray-600 flex flex-col items-center justify-center gap-2"
              >
                <MessageSquare className="w-6 h-6" />
                <span className="text-sm">AI Assistant</span>
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => navigate('/create')}
                variant="outline"
                className="w-full h-20 border-2 border-black dark:border-gray-600 hover:bg-black hover:text-white dark:hover:bg-gray-700 flex flex-col items-center justify-center gap-2"
              >
                <Plus className="w-6 h-6" />
                <span className="text-sm">Create Model</span>
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => navigate('/models')}
                variant="outline"
                className="w-full h-20 border-2 border-black dark:border-gray-600 hover:bg-black hover:text-white dark:hover:bg-gray-700 flex flex-col items-center justify-center gap-2"
              >
                <Brain className="w-6 h-6" />
                <span className="text-sm">View Models</span>
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => navigate('/modelfiles')}
                variant="outline"
                className="w-full h-20 border-2 border-black dark:border-gray-600 hover:bg-black hover:text-white dark:hover:bg-gray-700 flex flex-col items-center justify-center gap-2"
              >
                <FileText className="w-6 h-6" />
                <span className="text-sm">ModelFiles</span>
              </Button>
            </motion.div>
          </div>
        </Card>

        {/* Recent Conversations */}
        <Card className="p-6 border-4 border-black dark:border-gray-700 bg-white dark:bg-gray-900">
          <h2 className="text-xl font-bold text-black dark:text-white mb-4 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Recent Conversations
          </h2>
          <div className="space-y-3">
            {recentConversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20 text-black dark:text-white" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No conversations yet</p>
                <Button
                  onClick={() => navigate('/assistant')}
                  size="sm"
                  className="mt-3"
                >
                  Start a Chat
                </Button>
              </div>
            ) : (
              recentConversations.map((conv) => (
                <motion.div 
                  key={conv.id}
                  whileHover={{ x: 4 }}
                  onClick={() => navigate('/assistant')}
                  className="p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-black dark:hover:border-gray-500 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="overflow-hidden">
                      <p className="font-medium text-black dark:text-white truncate">{conv.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {conv.messages.length} messages • {conv.model}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {formatTimeAgo(conv.updatedAt)}
                    </Badge>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6 border-4 border-black dark:border-gray-700 bg-white dark:bg-gray-900">
          <h2 className="text-xl font-bold text-black dark:text-white mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Recent Activity
          </h2>
          <div className="space-y-3">
            {recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-20 text-black dark:text-white" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
              </div>
            ) : (
              recentActivities.map((activity) => (
                <motion.div 
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center space-x-3 p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    activity.type === 'error' ? 'bg-red-500' :
                    activity.type === 'model_created' ? 'bg-green-500' :
                    activity.type === 'model_downloaded' ? 'bg-blue-500' :
                    'bg-black dark:bg-white'
                  }`}></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">{activity.title}</span>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {formatTimeAgo(activity.timestamp)}
                  </Badge>
                </motion.div>
              ))
            )}
          </div>
        </Card>
      </motion.div>

      {/* System Status */}
      <motion.div variants={itemVariants}>
        <Card className="p-6 border-4 border-black dark:border-gray-700 bg-white dark:bg-gray-900">
          <h2 className="text-xl font-bold text-black dark:text-white mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${
                status === 'connected' ? 'bg-green-500' :
                status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Ollama Service: <strong>{status === 'connected' ? 'Running' : status === 'connecting' ? 'Connecting...' : 'Disconnected'}</strong>
              </span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                API Connection: <strong>{status === 'connected' ? 'Active' : 'Inactive'}</strong>
              </span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Endpoint: <strong>localhost:11434</strong>
              </span>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}