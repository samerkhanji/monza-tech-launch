
import React from 'react';
import SalesHeader from './Sales/components/SalesHeader';
import LeadSourceForm from './Sales/components/LeadSourceForm';
import ClientCommentsCard from './Sales/components/ClientCommentsCard';
import SalesInfoCard from './Sales/components/SalesInfoCard';

const Sales: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <SalesHeader />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeadSourceForm />
        <ClientCommentsCard />
      </div>

      <div className="mt-8">
        <SalesInfoCard />
      </div>
    </div>
  );
};

export default Sales;
