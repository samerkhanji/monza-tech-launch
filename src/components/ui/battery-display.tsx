
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Battery, BatteryLow, BatteryMedium, BatteryFull } from 'lucide-react';

interface BatteryDisplayProps {
  percentage?: number;
  showIcon?: boolean;
  className?: string;
}

const BatteryDisplay: React.FC<BatteryDisplayProps> = ({
  percentage,
  showIcon = true,
  className = '',
}) => {
  if (percentage === undefined) {
    return <span className="text-sm text-muted-foreground">N/A</span>;
  }

  const getBatteryIcon = () => {
    if (percentage <= 20) return <BatteryLow className="h-4 w-4 text-red-500" />;
    if (percentage <= 50) return <BatteryMedium className="h-4 w-4 text-yellow-500" />;
    if (percentage <= 80) return <Battery className="h-4 w-4 text-blue-500" />;
    return <BatteryFull className="h-4 w-4 text-green-500" />;
  };

  const getProgressColor = () => {
    if (percentage <= 20) return 'bg-red-500';
    if (percentage <= 50) return 'bg-yellow-500';
    if (percentage <= 80) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && getBatteryIcon()}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Progress 
          value={percentage} 
          className="h-2 flex-1"
          style={{
            '--progress-foreground': getProgressColor(),
          } as React.CSSProperties}
        />
        <span className="text-sm font-medium min-w-[3ch]">{percentage}%</span>
      </div>
    </div>
  );
};

export default BatteryDisplay;
