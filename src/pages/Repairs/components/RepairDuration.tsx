
import React from 'react';

interface RepairDurationProps {
  startTimestamp: string;
  endTimestamp: string;
}

const RepairDuration: React.FC<RepairDurationProps> = ({ startTimestamp, endTimestamp }) => {
  if (!startTimestamp || !endTimestamp) {
    return <span className="text-gray-500">Duration not available</span>;
  }

  try {
    const start = new Date(startTimestamp);
    const end = new Date(endTimestamp);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;

    if (diffDays > 0) {
      return <span>{diffDays} days, {remainingHours} hours</span>;
    } else {
      return <span>{diffHours} hours</span>;
    }
  } catch (e) {
    return <span className="text-gray-500">Invalid duration</span>;
  }
};

export default RepairDuration;
