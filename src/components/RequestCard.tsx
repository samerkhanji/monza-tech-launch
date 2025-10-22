import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, User, AlertCircle } from 'lucide-react';

interface Request {
  id: string;
  title: string;
  description?: string;
  category?: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'done' | 'cancelled';
  created_by: string;
  assignee_id?: string;
  recipients: string[];
  channel_id?: string;
  sla_due_at?: string;
  sla_breached?: boolean;
  created_at: string;
  updated_at: string;
}

const PRIORITY_COLORS = {
  urgent: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200', 
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-gray-100 text-gray-800 border-gray-200'
};

const PRIORITY_LABELS = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium', 
  low: 'Low'
};

interface RequestCardProps {
  request: Request;
}

export function RequestCard({ request }: RequestCardProps) {
  return (
    <div className="p-3 border rounded-lg hover:shadow-sm transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm line-clamp-2">{request.title}</h4>
        {request.sla_breached && (
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 ml-2" />
        )}
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        <Badge className={`text-xs ${PRIORITY_COLORS[request.priority]}`}>
          {PRIORITY_LABELS[request.priority]}
        </Badge>
        {request.category && (
          <Badge variant="outline" className="text-xs">
            {request.category}
          </Badge>
        )}
      </div>

      {request.description && (
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
          {request.description}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(request.created_at).toLocaleDateString()}
        </div>
        {request.assignee_id && (
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            Assigned
          </div>
        )}
      </div>
    </div>
  );
}
