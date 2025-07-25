
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { useRequestData } from './hooks/useRequestData';
import RequestHeader from './components/RequestHeader';
import RequestList from './components/RequestList';
import RequestHistorySidebar from './components/RequestHistorySidebar';

const RequestCenter: React.FC = () => {
  const { user } = useAuth();
  const {
    requests,
    requestHistory,
    expandedRequestId,
    historyOpen,
    getPriorityClass,
    getStatusClass,
    handleToggleExpand,
    handleAddComment,
    handleMarkAsDone,
    handleViewHistory,
    setHistoryOpen
  } = useRequestData();

  // Only allow owners to access the Request Center
  if (user?.role !== 'owner') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            You do not have permission to view the Request Center.
          </p>
          <p className="text-sm text-muted-foreground">
            Only owners can access this section.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RequestHeader onViewHistory={handleViewHistory} />
      
      <RequestList 
        requests={requests}
        expandedRequestId={expandedRequestId}
        onToggleExpand={handleToggleExpand}
        onAddComment={handleAddComment}
        onMarkAsDone={handleMarkAsDone}
        getPriorityClass={getPriorityClass}
        getStatusClass={getStatusClass}
      />
      
      {/* Request History Sidebar */}
      <RequestHistorySidebar 
        isOpen={historyOpen} 
        onClose={() => setHistoryOpen(false)} 
        requestHistory={requestHistory}
      />
    </div>
  );
};

export default RequestCenter;
