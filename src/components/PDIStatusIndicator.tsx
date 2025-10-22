import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';

interface PDIStatusIndicatorProps {
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | null;
  technicianName?: string;
  completionDate?: string;
  className?: string;
}

export const PDIStatusIndicator: React.FC<PDIStatusIndicatorProps> = ({
  status,
  technicianName,
  completionDate,
  className = ''
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          variant: 'default' as const,
          text: 'PDI Completed',
          color: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'in_progress':
        return {
          icon: <Clock className="h-3 w-3" />,
          variant: 'secondary' as const,
          text: 'PDI In Progress',
          color: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'failed':
        return {
          icon: <XCircle className="h-3 w-3" />,
          variant: 'destructive' as const,
          text: 'PDI Failed',
          color: 'bg-red-100 text-red-800 border-red-200'
        };
      case 'pending':
      default:
        return {
          icon: <AlertTriangle className="h-3 w-3" />,
          variant: 'outline' as const,
          text: 'PDI Pending',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge 
        variant={config.variant}
        className={`flex items-center gap-1 ${config.color}`}
      >
        {config.icon}
        {config.text}
      </Badge>
      {status === 'completed' && technicianName && (
        <span className="text-xs text-gray-500">
          by {technicianName}
        </span>
      )}
      {status === 'completed' && completionDate && (
        <span className="text-xs text-gray-400">
          {new Date(completionDate).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}; 