import React from 'react';

const DataLinkingSummary: React.FC = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Data Linking Summary</h2>
      <p>Car-client data linking system is being loaded...</p>
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          This page shows comprehensive car-client relationships across all inventory locations.
        </p>
      </div>
    </div>
  );
};

export default DataLinkingSummary; 