
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const SalesHeader: React.FC = () => {
  const navigate = useNavigate();

  const goToSalesAnalytics = () => {
    navigate('/analytics', { state: { defaultTab: 'sales' } });
  };

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold text-monza-black">Sales Lead Sources</h1>
      <Button variant="outline" onClick={goToSalesAnalytics}>
        View Analytics
      </Button>
    </div>
  );
};

export default SalesHeader;
