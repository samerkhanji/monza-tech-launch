import React from 'react';
import { Building } from 'lucide-react';

const ShowroomFloor1Header: React.FC = () => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div className="flex items-center gap-3">
        <Building className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Showroom Floor 1</h1>
          <p className="text-muted-foreground mt-1">
            Ground floor showroom vehicles on display
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShowroomFloor1Header;
