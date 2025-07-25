
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RequestPriority, Request } from '@/types';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';

const NewRequest: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [requestType, setRequestType] = useState('');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState('');
  const [priority, setPriority] = useState<RequestPriority>('medium');
  const [file, setFile] = useState<File | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!requestType || !message) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create new request object
      const newRequest: Request = {
        id: Date.now().toString(),
        requestType,
        message,
        details,
        priority,
        status: 'submitted',
        submittedBy: user?.name || 'Unknown User',
        submittedAt: new Date().toISOString(),
        comments: []
      };
      
      // Get existing requests from localStorage
      const existingRequests = localStorage.getItem('activeRequests');
      const requests: Request[] = existingRequests ? JSON.parse(existingRequests) : [];
      
      // Add new request to the beginning of the array
      requests.unshift(newRequest);
      
      // Save back to localStorage
      localStorage.setItem('activeRequests', JSON.stringify(requests));
      
      toast.success('Request submitted successfully!');
      navigate('/requests');
    } catch (error) {
      toast.error('Failed to submit request. Please try again.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">New Request</h1>
        <p className="text-muted-foreground">
          Submit a new request to the appropriate team
        </p>
      </div>
      
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="requestType" className="form-label block">
              Request Type*
            </label>
            <select
              id="requestType"
              className="form-input w-full rounded-md border border-input p-2"
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              disabled={isSubmitting}
              required
            >
              <option value="" disabled>Select request type</option>
              <option value="Inventory">Inventory</option>
              <option value="Approval">Approval</option>
              <option value="Question">Question</option>
              <option value="Problem">Problem</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="message" className="form-label block">
              Message*
            </label>
            <Textarea
              id="message"
              placeholder="Describe your request in brief..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSubmitting}
              required
              className="min-h-[80px]"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="details" className="form-label block">
              Detailed Information
            </label>
            <Textarea
              id="details"
              placeholder="Provide any additional details or context for your request..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              disabled={isSubmitting}
              className="min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground">
              Adding detailed information helps us process your request faster
            </p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="priority" className="form-label block">
              Priority Level*
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div
                className={`border rounded-md p-3 cursor-pointer text-center ${
                  priority === 'low' ? 'bg-green-100 border-green-500' : 'hover:bg-secondary'
                }`}
                onClick={() => setPriority('low')}
              >
                <div className="font-medium">Low</div>
                <div className="text-xs text-muted-foreground">
                  For non-urgent matters
                </div>
              </div>
              <div
                className={`border rounded-md p-3 cursor-pointer text-center ${
                  priority === 'medium' ? 'bg-yellow-100 border-yellow-500' : 'hover:bg-secondary'
                }`}
                onClick={() => setPriority('medium')}
              >
                <div className="font-medium">Medium</div>
                <div className="text-xs text-muted-foreground">
                  Needs attention soon
                </div>
              </div>
              <div
                className={`border rounded-md p-3 cursor-pointer text-center ${
                  priority === 'high' ? 'bg-red-100 border-red-500' : 'hover:bg-secondary'
                }`}
                onClick={() => setPriority('high')}
              >
                <div className="font-medium">High</div>
                <div className="text-xs text-muted-foreground">
                  Urgent attention required
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="file" className="form-label block">
              Attachment (Optional)
            </label>
            <input
              id="file"
              type="file"
              className="form-input w-full rounded-md border border-input p-2"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Upload any relevant documents or images
            </p>
          </div>
          
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/requests')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default NewRequest;
