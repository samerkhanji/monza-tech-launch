import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  Database, 
  LinkIcon, 
  Calendar, 
  Wrench, 
  DollarSign, 
  Package,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export const UnifiedCarSystemInfo: React.FC = () => {
  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <LinkIcon className="h-5 w-5" />
          Unified Car Data System - Active
          <Badge className="bg-green-100 text-green-800">LINKED</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-blue-700">
          <strong>All car data is now linked across systems!</strong> Click on any car in any component to see its complete history.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4 text-purple-600" />
            <span>Inventory Data</span>
            <CheckCircle className="h-3 w-3 text-green-600" />
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Wrench className="h-4 w-4 text-orange-600" />
            <span>Garage Status</span>
            <CheckCircle className="h-3 w-3 text-green-600" />
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span>Schedule Data</span>
            <CheckCircle className="h-3 w-3 text-green-600" />
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span>Financial Records</span>
            <CheckCircle className="h-3 w-3 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-3 rounded border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2">How to Use:</h4>
          <div className="space-y-1 text-sm text-blue-700">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-3 w-3" />
              <span><strong>Financial Dashboard:</strong> Click "Car History" button next to any financial record</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="h-3 w-3" />
              <span><strong>Garage Schedule:</strong> Use the dropdown menu → "View Car History"</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="h-3 w-3" />
              <span><strong>Cross-System Search:</strong> Search by car code (VIN) in any component</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-blue-600">
          <Database className="h-3 w-3 inline mr-1" />
          Data automatically syncs across all systems via CarDataContext
        </div>
      </CardContent>
    </Card>
  );
}; 