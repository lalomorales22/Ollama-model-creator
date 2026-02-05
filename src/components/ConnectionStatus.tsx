/**
 * Connection Status Component
 * 
 * Displays the current Ollama connection status with auto-retry
 */

import { useEffect } from 'react';
import { useConnectionStore } from '@/stores/connection-store';
import { Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  className?: string;
  showDetails?: boolean;
}

export function ConnectionStatus({ className, showDetails = false }: ConnectionStatusProps) {
  const { status, error, version, checkConnection, startHealthCheck, stopHealthCheck } = useConnectionStore();

  useEffect(() => {
    // Initial connection check
    checkConnection();
    
    // Start health checks
    startHealthCheck(30000); // Every 30 seconds
    
    return () => {
      stopHealthCheck();
    };
  }, [checkConnection, startHealthCheck, stopHealthCheck]);

  const statusConfig = {
    connected: {
      icon: Wifi,
      text: 'Connected',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-300',
    },
    disconnected: {
      icon: WifiOff,
      text: 'Disconnected',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-300',
    },
    connecting: {
      icon: Loader2,
      text: 'Connecting...',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-300',
    },
    error: {
      icon: AlertCircle,
      text: 'Error',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-300',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  if (!showDetails) {
    // Compact version
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full border-2',
          config.bgColor,
          config.borderColor,
          className
        )}
      >
        <Icon
          className={cn(
            'w-4 h-4',
            config.color,
            status === 'connecting' && 'animate-spin'
          )}
        />
        <span className={cn('text-sm font-medium', config.color)}>
          {config.text}
        </span>
      </div>
    );
  }

  // Detailed version
  return (
    <div
      className={cn(
        'p-4 rounded-lg border-2',
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon
            className={cn(
              'w-5 h-5',
              config.color,
              status === 'connecting' && 'animate-spin'
            )}
          />
          <div>
            <p className={cn('font-semibold', config.color)}>{config.text}</p>
            {version && status === 'connected' && (
              <p className="text-sm text-gray-600">Ollama v{version}</p>
            )}
            {error && status === 'error' && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
        </div>
        
        {(status === 'error' || status === 'disconnected') && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => checkConnection()}
            className="border-2 border-current"
          >
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}
