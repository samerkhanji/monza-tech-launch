
import React from 'react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CheckCircle, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { Comment, Request } from '@/types';

interface RequestCardProps {
  request: Request;
  expandedRequestId: string | null;
  onToggleExpand: (requestId: string) => void;
  onAddComment: (requestId: string, comment: string) => void;
  onMarkAsDone: (request: Request) => void;
  getPriorityClass: (priority: string) => string;
  getStatusClass: (status: string) => string;
}

const RequestCard: React.FC<RequestCardProps> = ({
  request,
  expandedRequestId,
  onToggleExpand,
  onAddComment,
  onMarkAsDone,
  getPriorityClass,
  getStatusClass
}) => {
  const [newComment, setNewComment] = React.useState<string>('');
  
  const handleAddComment = (requestId: string) => {
    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    
    onAddComment(requestId, newComment);
    setNewComment('');
  };

  return (
    <Collapsible 
      key={request.id}
      open={expandedRequestId === request.id}
      onOpenChange={() => onToggleExpand(request.id)}
      className="border rounded-lg hover:shadow-sm transition-all"
    >
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{request.requestType}</h3>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityClass(request.priority)}`}>
                {request.priority}
              </span>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusClass(request.status)}`}>
                {request.status}
              </span>
            </div>
            <p className="mt-1">{request.message}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Submitted by {request.submittedBy} • {new Date(request.submittedAt).toLocaleString()}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="success" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsDone(request);
              }}
              className="flex items-center gap-1"
            >
              <CheckCircle size={16} />
              Done
            </Button>
            
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                {expandedRequestId === request.id ? (
                  <>
                    <ChevronUp size={16} />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} />
                    View Details
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>
      </div>
      
      <CollapsibleContent>
        <div className="px-4 pb-4 border-t pt-4 space-y-4 bg-slate-50">
          <div>
            <h4 className="text-sm font-semibold flex items-center">
              <FileText className="w-4 h-4 mr-1" />
              Detailed Information
            </h4>
            <p className="mt-2 text-sm">{request.details || 'No detailed information provided.'}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold mb-2">Comments & Updates</h4>
            
            <div className="space-y-3 mb-4">
              {request.comments && request.comments.length > 0 ? (
                request.comments.map((comment, index) => (
                  <CommentItem key={index} comment={comment} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No comments yet.</p>
              )}
            </div>
            
            <div className="space-y-2">
              <h5 className="text-xs font-medium">Add Comment</h5>
              <Textarea 
                placeholder="Type your comment here..." 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px]"
              />
              <Button 
                size="sm" 
                onClick={() => handleAddComment(request.id)}
              >
                Add Comment
              </Button>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

// CommentItem component
const CommentItem: React.FC<{ comment: Comment }> = ({ comment }) => {
  return (
    <div className="bg-white p-3 rounded border">
      <div className="flex justify-between">
        <span className="font-medium">{comment.author}</span>
        <span className="text-xs text-muted-foreground">
          {new Date(comment.timestamp).toLocaleString()}
        </span>
      </div>
      <p className="mt-1 text-sm">{comment.text}</p>
    </div>
  );
};

export default RequestCard;
