
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Request, Comment, RequestStatus } from '@/types';

// Mock request data
const MOCK_REQUESTS: Request[] = [
  {
    id: '1',
    requestType: 'Inventory',
    message: 'Need more brake pads for Voyah Free models',
    priority: 'medium',
    status: 'submitted',
    submittedBy: 'Mark',
    submittedAt: '2025-05-19T14:30:00',
    details: 'We are completely out of the standard brake pads for Voyah Free. The next maintenance is scheduled for tomorrow.',
    comments: [
      { 
        author: 'Khalil', 
        text: 'I have contacted the supplier, they will deliver by tomorrow morning.', 
        timestamp: '2025-05-19T15:45:00' 
      }
    ]
  },
  {
    id: '2',
    requestType: 'Approval',
    message: 'Customer discount approval for fleet purchase',
    priority: 'high',
    status: 'reviewed',
    submittedBy: 'Khalil',
    submittedAt: '2025-05-18T09:15:00',
    details: 'Customer wants to purchase 5 Voyah Free vehicles for their company fleet. Requesting 10% discount approval.',
    comments: [
      { 
        author: 'Tamara', 
        text: 'I reviewed the proposal. This looks acceptable given our current sales targets.', 
        timestamp: '2025-05-18T11:30:00' 
      }
    ]
  },
  {
    id: '3', 
    requestType: 'Question',
    message: 'When will the new marketing materials arrive?',
    priority: 'low',
    status: 'answered',
    submittedBy: 'Tamara',
    submittedAt: '2025-05-17T11:45:00',
    details: 'We need the new brochures for the trade show next week. Have they been shipped yet?',
    comments: [
      { 
        author: 'Mark', 
        text: 'Marketing department confirmed they will arrive on Monday.', 
        timestamp: '2025-05-17T13:20:00' 
      }
    ]
  }
];

export const useRequestData = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [requestHistory, setRequestHistory] = useState<Request[]>([]);
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState<boolean>(false);

  // Load requests and history from localStorage on mount
  useEffect(() => {
    const savedRequests = localStorage.getItem('activeRequests');
    const savedHistory = localStorage.getItem('requestHistory');
    
    if (savedRequests) {
      try {
        setRequests(JSON.parse(savedRequests));
      } catch (error) {
        console.error('Error parsing active requests:', error);
        setRequests(MOCK_REQUESTS);
      }
    } else {
      setRequests(MOCK_REQUESTS);
    }
    
    if (savedHistory) {
      try {
        setRequestHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error parsing request history:', error);
        setRequestHistory([]);
      }
    }
  }, []);
  
  // Save requests and history to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('activeRequests', JSON.stringify(requests));
  }, [requests]);
  
  useEffect(() => {
    localStorage.setItem('requestHistory', JSON.stringify(requestHistory));
  }, [requestHistory]);
  
  const getPriorityClass = (priority: string) => {
    switch(priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
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

  const handleToggleExpand = (requestId: string) => {
    setExpandedRequestId(expandedRequestId === requestId ? null : requestId);
  };

  const handleAddComment = (requestId: string, commentText: string) => {
    if (!commentText.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    setRequests(prevRequests => 
      prevRequests.map(request => {
        if (request.id === requestId) {
          const newComments = [...(request.comments || []), {
            author: 'Current User', // In a real app, this would be the logged-in user
            text: commentText,
            timestamp: new Date().toISOString()
          }];
          
          return {
            ...request,
            comments: newComments
          };
        }
        return request;
      })
    );

    toast.success("Comment added successfully");
  };

  // Handle marking a request as done
  const handleMarkAsDone = (request: Request) => {
    // Update the request status
    const completedRequest = {
      ...request,
      status: 'closed' as RequestStatus,
      completedAt: new Date().toISOString(),
    };
    
    // Remove from active requests
    const updatedRequests = requests.filter(r => r.id !== request.id);
    setRequests(updatedRequests);
    
    // Add to request history
    const updatedHistory = [...requestHistory, completedRequest];
    setRequestHistory(updatedHistory);
    
    // Show success notification
    toast.success(`Request "${request.requestType}" has been marked as completed`);
  };
  
  // Handle viewing request history
  const handleViewHistory = () => {
    setHistoryOpen(true);
  };

  return {
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
  };
};

export default useRequestData;
