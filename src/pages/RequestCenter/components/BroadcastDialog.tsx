import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Users, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface BroadcastDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BroadcastDialog: React.FC<BroadcastDialogProps> = ({
  open,
  onOpenChange
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Create a broadcast request that includes all users
      const broadcastRequest = {
        id: `broadcast-${Date.now()}`,
        title: `Broadcast: ${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}`,
        description: messageText,
        priority: 'high',
        status: 'open',
        category: 'broadcast',
        created_by: user?.id || '',
        created_by_user: {
          id: user?.id || '',
          full_name: user?.full_name || user?.email || 'Unknown User',
          email: user?.email || '',
          avatar_url: user?.avatar_url || '',
        },
        assigned_to: 'all', // Indicates this is for all users
        recipients: ['all'], // All users will be included
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        messages: [
          {
            id: `msg-${Date.now()}`,
            message_text: messageText,
            created_by: user?.id || '',
            created_by_user: {
              id: user?.id || '',
              full_name: user?.full_name || user?.email || 'Unknown User',
              email: user?.email || '',
              avatar_url: user?.avatar_url || '',
            },
            created_at: new Date().toISOString(),
            is_broadcast: true
          }
        ]
      };

      // Store the broadcast request in localStorage for the messaging system
      const existingRequests = JSON.parse(localStorage.getItem('broadcastRequests') || '[]');
      existingRequests.push(broadcastRequest);
      localStorage.setItem('broadcastRequests', JSON.stringify(existingRequests));

      // Show success message
      toast({
        title: "Broadcast Created",
        description: "Opening chat with all users to discuss the broadcast!",
      });
      
      // Close dialog and reset form
      onOpenChange(false);
      setMessageText('');
      
      // Navigate to the messaging section with the broadcast request selected
      navigate('/request-center', { 
        state: { 
          openTab: 'messages',
          selectedRequest: broadcastRequest,
          isBroadcast: true
        }
      });
      
    } catch (error) {
      console.error('Error creating broadcast:', error);
      toast({
        title: "Error",
        description: "Failed to create broadcast. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[95vh] overflow-y-auto" aria-describedby="broadcast-dialog-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Send Broadcast Message
          </DialogTitle>
          <p id="broadcast-dialog-description" className="text-sm text-gray-600">
            Compose your broadcast message below.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Message */}
          <div className="space-y-3">
            <Label htmlFor="message" className="text-sm font-semibold text-gray-700">Message *</Label>
            <Textarea
              id="message"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Enter your broadcast message..."
              rows={4}
              required
              className="min-h-[100px] resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!messageText.trim() || isLoading}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4 mr-2" />
              {isLoading ? 'Creating Broadcast...' : 'Send Broadcast'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BroadcastDialog; 