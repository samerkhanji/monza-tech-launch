import React from 'react';
import PDIDebugTest from '@/components/PDIDebugTest';

const PDIDebug: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">PDI Debug Page</h1>
        <p className="text-gray-600">Debug the PDI functionality issues</p>
      </div>
      
      <PDIDebugTest />
      
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">Debug Instructions:</h3>
        <ol className="list-decimal list-inside text-yellow-700 space-y-1">
          <li>Click "Open PDI Dialog" button</li>
          <li>Check if the form fields are populated with default values</li>
          <li>Try typing in the fields to see if they update</li>
          <li>Check the browser console for any error messages</li>
          <li>Fill in the required fields and submit</li>
        </ol>
      </div>
    </div>
  );
};

export default PDIDebug; 