
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import ClientCommentsSection from '@/components/sales/ClientCommentsSection';

const ClientCommentsCard: React.FC = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-monza-black">
          <MessageSquare className="h-5 w-5 text-monza-yellow" />
          Client Comments
        </CardTitle>
        <CardDescription className="text-monza-grey">
          View and manage client feedback about our vehicles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ClientCommentsSection />
      </CardContent>
    </Card>
  );
};

export default ClientCommentsCard;
