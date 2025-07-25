import React from 'react';
import { Building2 } from 'lucide-react';

const ShowroomFloor2Header: React.FC = () => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-8 w-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Showroom Floor 2</h1>
          <p className="text-muted-foreground mt-1">
            Premium upper floor display area for featured vehicles
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShowroomFloor2Header;
