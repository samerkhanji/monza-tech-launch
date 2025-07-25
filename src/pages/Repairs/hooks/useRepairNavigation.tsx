
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

export const useRepairNavigation = () => {
  const navigate = useNavigate();

  const handleAddNewRepair = () => {
    navigate('/repairs/new');
  };

  return {
    handleAddNewRepair
  };
};
