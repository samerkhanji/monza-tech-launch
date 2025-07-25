import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Request } from '@/types';
import { format } from 'date-fns';
import { CheckCircle, Clock, User } from 'lucide-react';

interface RequestHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  requestHistory: Request[];
}

const RequestHistorySidebar: React.FC<RequestHistorySidebarProps> = ({
  isOpen,
  onClose,
  requestHistory,
}) => {
  // Helper function to format dates
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get status badge classes
  const getStatusClass = (status: string) => {
    switch(status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'reviewed': return 'bg-purple-100 text-purple-800';
      case 'answered': return 'bg-indigo-100 text-indigo-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg bg-white">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Request History
          </SheetTitle>
        </SheetHeader>
        
        <Separator className="my-2" />
        
        <ScrollArea className="h-[calc(100vh-120px)] pr-4">
          {requestHistory.length > 0 ? (
            <div className="space-y-4">
              {requestHistory.map((request) => (
                <div 
                  key={request.id} 
                  className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{request.requestType}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusClass(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                      <p className="text-sm">{request.message}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>Submitted by {request.submittedBy}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Submitted: {formatDate(request.submittedAt)}</span>
                    </div>
                    
                    {request.completedAt && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span>Completed: {formatDate(request.completedAt)}</span>
                      </div>
                    )}
                  </div>
                  
                  {request.details && (
                    <div className="mt-3 p-2 bg-slate-50 rounded text-xs">
                      <div className="font-medium mb-1">Details:</div>
                      <p>{request.details}</p>
                    </div>
                  )}
                  
                  {request.comments && request.comments.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs font-medium mb-1">Last comment:</div>
                      <div className="bg-slate-50 p-2 rounded text-xs">
                        <div className="flex justify-between">
                          <span className="font-medium">{request.comments[request.comments.length - 1].author}</span>
                          <span className="text-muted-foreground">
                            {formatDate(request.comments[request.comments.length - 1].timestamp)}
                          </span>
                        </div>
                        <p className="mt-1">{request.comments[request.comments.length - 1].text}</p>
                      </div>
                      {request.comments.length > 1 && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          +{request.comments.length - 1} more comments
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium">No completed requests yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                When you mark requests as done, they will appear here
              </p>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default RequestHistorySidebar;
