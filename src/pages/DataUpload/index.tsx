import React from 'react';
import SupabaseDataUploader from '@/components/SupabaseDataUploader';

const DataUploadPage: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Data Upload</h1>
        <p className="text-muted-foreground mt-2">
          Upload your car inventory data directly to the Supabase database
        </p>
      </div>
      
      <SupabaseDataUploader />
    </div>
  );
};

export default DataUploadPage; 