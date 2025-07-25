
import React from 'react';
import { Card } from '@/components/ui/card';
import { Request } from '@/types';
import RequestCard from './RequestCard';

interface RequestListProps {
  requests: Request[];
  expandedRequestId: string | null;
  onToggleExpand: (requestId: string) => void;
  onAddComment: (requestId: string, comment: string) => void;
  onMarkAsDone: (request: Request) => void;
  getPriorityClass: (priority: string) => string;
  getStatusClass: (status: string) => string;
}

const RequestList: React.FC<RequestListProps> = ({
  requests,
  expandedRequestId,
  onToggleExpand,
  onAddComment,
  onMarkAsDone,
  getPriorityClass,
  getStatusClass
}) => {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        {requests.length > 0 ? (
          requests.map(request => (
            <RequestCard 
              key={request.id}
              request={request}
              expandedRequestId={expandedRequestId}
              onToggleExpand={onToggleExpand}
              onAddComment={onAddComment}
              onMarkAsDone={onMarkAsDone}
              getPriorityClass={getPriorityClass}
              getStatusClass={getStatusClass}
            />
          ))
        ) : (
          <div className="text-center p-8">
            <p className="text-muted-foreground">No active requests. All requests have been completed.</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default RequestList;
