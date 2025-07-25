
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { History } from 'lucide-react';

interface RequestHeaderProps {
  onViewHistory: () => void;
}

const RequestHeader: React.FC<RequestHeaderProps> = ({ onViewHistory }) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold mb-2">Request Center</h1>
        <p className="text-muted-foreground">
          View and manage all requests across the organization
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onViewHistory} className="flex items-center gap-1">
          <History size={16} />
          View History
        </Button>
        <Button onClick={() => navigate('/requests/new')}>
          New Request
        </Button>
      </div>
    </div>
  );
};

export default RequestHeader;
