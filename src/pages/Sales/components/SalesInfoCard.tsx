
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SalesInfoCard: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-monza-black">Why Lead Sources Matter</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-monza-grey">
        <p>
          Understanding where our clients first hear about Voyah and MHero helps us:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Optimize marketing spend on channels that deliver results</li>
          <li>Identify trends in customer acquisition</li>
          <li>Measure the effectiveness of different marketing campaigns</li>
          <li>Improve customer journey mapping</li>
        </ul>
      </CardContent>
    </Card>
  );
};

export default SalesInfoCard;
