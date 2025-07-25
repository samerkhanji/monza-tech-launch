
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useTabState = () => {
  const [activeTab, setActiveTab] = useState('repairs');
  const [garageFilterTab, setGarageFilterTab] = useState('all');
  const location = useLocation();

  // Check if we should show garage tab from navigation state
  useEffect(() => {
    if (location.state?.showGarageTab) {
      setActiveTab('garage');
    }
  }, [location.state]);

  return {
    activeTab,
    setActiveTab,
    garageFilterTab,
    setGarageFilterTab
  };
};
