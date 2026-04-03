import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { OllamaModel } from '@/types/ollama';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Copy, 
  Trash2, 
  Download, 
  Info,
  MoreVertical,
  Play,
  Pause,
  Zap,
  Clock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ollamaService } from '@/services/ollama';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ModelCardProps {
  model: OllamaModel;
  onModelDeleted: () => void;
  onModelCopied: () => void;
  isRunning?: boolean;
}

export function ModelCard({ model, onModelDeleted, onModelCopied, isRunning = false }: ModelCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);

  // 3D tilt effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7.5deg', '-7.5deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7.5deg', '7.5deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  const formatSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTimeSinceModified = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  // Calculate storage percentage (assuming 100GB max for visualization)
  const storagePercentage = Math.min((model.size / (10 * 1024 * 1024 * 1024)) * 100, 100);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete model "${model.name}"?`)) {
      return;
    }

    setIsLoading(true);
    try {
      await ollamaService.deleteModel(model.name);
      toast({
        title: "Model deleted",
        description: `Successfully deleted ${model.name}`,
      });
      onModelDeleted();
    } catch (error) {
      toast({
        title: "Error deleting model",
        description: "Failed to delete the model. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    const newName = prompt(`Enter new name for copy of "${model.name}":`);
    if (!newName) return;

    setIsLoading(true);
    try {
      await ollamaService.copyModel(model.name, newName);
      toast({
        title: "Model copied",
        description: `Successfully copied to ${newName}`,
      });
      onModelCopied();
    } catch (error) {
      toast({
        title: "Error copying model",
        description: "Failed to copy the model. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowInfo = async () => {
    try {
      const info = await ollamaService.getModelInfo(model.name);
      console.log('Model info:', info);
      toast({
        title: "Model info",
        description: "Model information logged to console",
      });
    } catch (error) {
      toast({
        title: "Error getting model info",
        description: "Failed to retrieve model information.",
        variant: "destructive",
      });
    }
  };

  const handleUseModel = () => {
    navigate('/assistant', { state: { selectedModel: model.name } });
    toast({
      title: "Opening AI Assistant",
      description: `Starting chat with ${model.name}`,
    });
  };

  return (
    <motion.div
      ref={cardRef}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="relative"
    >
      <Card
        className={cn(
          "p-5 border-2 bg-white dark:bg-gray-900 transition-all duration-300 overflow-hidden",
          isRunning
            ? "border-green-500 dark:border-green-600"
            : "border-gray-200 dark:border-gray-700",
          isHovered && "shadow-xl"
        )}
        style={{
          transform: 'translateZ(0)',
        }}
      >
        {/* Running indicator */}
        {isRunning && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
          >
            <Zap className="w-3 h-3 text-white" />
          </motion.div>
        )}

        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-center space-x-3 min-w-0">
            <motion.div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                isRunning ? "bg-green-500" : "bg-black dark:bg-gray-700"
              )}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Brain className="w-5 h-5 text-white" />
            </motion.div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-black dark:text-white truncate" title={model.name}>{model.name}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">{model.details.family}</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex-shrink-0 h-8 w-8 p-0 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-2 border-black dark:border-gray-600">
              <DropdownMenuItem onClick={handleShowInfo}>
                <Info className="w-4 h-4 mr-2" />
                Show Info
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopy}>
                <Copy className="w-4 h-4 mr-2" />
                Copy Model
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600 dark:text-red-400">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Model
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-3">
          {/* Size with progress bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Size:</span>
              <Badge variant="outline" className="border-black dark:border-gray-600">
                {formatSize(model.size)}
              </Badge>
            </div>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Progress value={storagePercentage} className="h-1.5" />
            </motion.div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Format:</span>
            <Badge variant="outline" className="border-black dark:border-gray-600">
              {model.details.format}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Parameters:</span>
            <Badge 
              variant="outline" 
              className={cn(
                "border-black dark:border-gray-600",
                model.details.parameter_size?.includes('B') && "bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700"
              )}
            >
              {model.details.parameter_size}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              Modified:
            </span>
            <span className="text-black dark:text-white text-xs">
              {getTimeSinceModified(model.modified_at)}
            </span>
          </div>
        </div>

        <motion.div 
          className="flex space-x-2 mt-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Button 
            size="sm" 
            className={cn(
              "flex-1 border-2 transition-colors",
              isRunning 
                ? "bg-green-500 text-white hover:bg-green-600 border-green-500" 
                : "bg-black dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600 border-black dark:border-gray-600"
            )}
            disabled={isLoading}
            onClick={handleUseModel}
          >
            <Play className="w-4 h-4 mr-2" />
            {isRunning ? 'Continue' : 'Use Model'}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="border-2 border-black dark:border-gray-600 hover:bg-black hover:text-white dark:hover:bg-gray-700"
            disabled={isLoading}
          >
            <Download className="w-4 h-4" />
          </Button>
        </motion.div>

        {/* Hover glow effect */}
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            background: `radial-gradient(600px circle at ${isHovered ? 'var(--mouse-x, 50%)' : '50%'} ${isHovered ? 'var(--mouse-y, 50%)' : '50%'}, rgba(0,0,0,0.05), transparent 40%)`,
          }}
          animate={{ opacity: isHovered ? 1 : 0 }}
        />
      </Card>
    </motion.div>
  );
}