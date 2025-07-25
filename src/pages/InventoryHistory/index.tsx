
import React, { useState, useEffect } from 'react';
import { dateUtils, numberUtils, stringUtils, validationUtils } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Search, 
  User,
  Car,
  Phone,
  MapPin,
  History,
  Package,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface PartsUsageRecord {
  id: string;
  part_number: string;
  part_name: string;
  quantity: number;
  car_vin: string;
  car_model?: string;
  client_name: string;
  client_phone?: string;
  client_license_plate?: string;
  repair_id?: string;
  technician: string;
  usage_date: string;
  arrival_date?: string;
  cost_per_unit?: number;
  total_cost?: number;
  location_used?: string;
  repair_type?: string;
  notes?: string;
}

const InventoryHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<PartsUsageRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  console.log('InventoryHistoryPage component is rendering');
  
  useEffect(() => {
    console.log('InventoryHistoryPage useEffect triggered');
    loadPartsUsageHistory();
  }, []);

  const loadPartsUsageHistory = async () => {
    try {
      setLoading(true);
      console.log('Loading parts usage history...');
      
      const { data, error } = await supabase
        .from('parts_usage_tracking')
        .select('*')
        .order('usage_date', { ascending: false });

      if (error) {
        console.error('Error loading parts usage history:', error);
        toast({
          title: "Error",
          description: "Failed to load parts usage history",
          variant: "destructive",
        });
        return;
      }

      console.log('Parts usage history loaded:', data);
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading parts usage history:', error);
      toast({
        title: "Error",
        description: "Failed to load parts usage history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSampleData = async () => {
    try {
      const sampleData = [
        {
          part_number: 'BRK-001',
          part_name: 'Brake Pad Set Front',
          quantity: 1,
          car_vin: 'WVWZZZ1JZ3W386752',
          car_model: 'Tesla Model 3',
          client_name: 'John Smith',
          client_phone: '+1234567890',
          client_license_plate: 'ABC123',
          technician: 'Mike Johnson',
          usage_date: new Date().toISOString(),
          arrival_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          cost_per_unit: 150.00,
          total_cost: 150.00,
          location_used: 'garage',
          repair_type: 'Brake Replacement',
          notes: 'Standard brake pad replacement'
        }
      ];

      const { error } = await supabase
        .from('parts_usage_tracking')
        .insert(sampleData);

      if (error) {
        console.error('Error creating sample data:', error);
        toast({
          title: "Error",
          description: "Failed to create sample data",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sample Data Created",
        description: "Sample parts usage data has been added",
      });

      loadPartsUsageHistory();
    } catch (error) {
      console.error('Error creating sample data:', error);
      toast({
        title: "Error",
        description: "Failed to create sample data",
        variant: "destructive",
      });
    }
  };
  
  // Filter history based on search
  const filteredHistory = history.filter(item => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      item.part_name.toLowerCase().includes(searchLower) ||
      item.part_number.toLowerCase().includes(searchLower) ||
      item.car_vin.toLowerCase().includes(searchLower) ||
      item.client_name.toLowerCase().includes(searchLower) ||
      item.technician.toLowerCase().includes(searchLower) ||
      (item.car_model && item.car_model.toLowerCase().includes(searchLower)) ||
      (item.repair_type && item.repair_type.toLowerCase().includes(searchLower))
    );
  });
  
  // Removed local formatDateTime - using dateUtils.formatDateTime from utils

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };
  
  const getLocationBadge = (location?: string) => {
    if (!location) return <Badge variant="outline">N/A</Badge>;
    
    const locationColors = {
      garage: 'bg-blue-100 text-blue-800',
      showroom: 'bg-green-100 text-green-800',
      'floor 1': 'bg-purple-100 text-purple-800',
      'floor 2': 'bg-orange-100 text-orange-800',
    };
    
    const colorClass = locationColors[location.toLowerCase() as keyof typeof locationColors] || 'bg-gray-100 text-gray-800';
    
    return (
      <Badge variant="outline" className={colorClass}>
        {location}
      </Badge>
    );
  };
  
  const handleExportToExcel = () => {
    toast({
      title: "Export Feature",
      description: "Excel export functionality will be implemented soon.",
    });
  };
  
  console.log('Rendering InventoryHistoryPage with history length:', history.length);
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Parts Usage History</h1>
          <p className="text-muted-foreground mt-1">
            Complete tracking of parts usage with client and car details
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={createSampleData}>
            <Package className="mr-2 h-4 w-4" />
            Add Sample Data
          </Button>
          <Button variant="outline" onClick={handleExportToExcel}>
            <Download className="mr-2 h-4 w-4" />
            Export to Excel
          </Button>
        </div>
      </div>
      
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search parts, VIN, client, technician..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableCaption>
              {filteredHistory.length > 0 
                ? `Showing ${filteredHistory.length} parts usage records`
                : "No parts usage records found. Add sample data to see how it works."
              }
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[140px]">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Usage Date & Time
                  </div>
                </TableHead>
                <TableHead className="min-w-[200px]">
                  <div className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    Part Details
                  </div>
                </TableHead>
                <TableHead>Quantity Used</TableHead>
                <TableHead className="min-w-[180px]">
                  <div className="flex items-center gap-1">
                    <Car className="h-4 w-4" />
                    Car Information
                  </div>
                </TableHead>
                <TableHead className="min-w-[150px]">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Client Details
                  </div>
                </TableHead>
                <TableHead>Technician</TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Location
                  </div>
                </TableHead>
                <TableHead>Cost Information</TableHead>
                <TableHead>
                  Arrival Date
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <History className="h-6 w-6 text-muted-foreground mr-2 animate-spin" />
                      Loading parts usage history...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredHistory.length > 0 ? (
                filteredHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {dateUtils.formatDateTime(item.usage_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{item.part_name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{item.part_number}</div>
                        {item.repair_type && (
                          <Badge variant="outline" className="text-xs">
                            {item.repair_type}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-semibold">
                        {item.quantity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Car className="h-3 w-3" />
                          <span className="font-mono text-xs">{item.car_vin}</span>
                        </div>
                        {item.car_model && (
                          <div className="text-sm text-muted-foreground">{item.car_model}</div>
                        )}
                        {item.client_license_plate && (
                          <Badge variant="outline" className="text-xs">
                            {item.client_license_plate}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{item.client_name}</div>
                        {item.client_phone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{item.client_phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.technician}</Badge>
                    </TableCell>
                    <TableCell>
                      {getLocationBadge(item.location_used)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {item.cost_per_unit && (
                          <div className="text-sm">${item.cost_per_unit.toFixed(2)}/unit</div>
                        )}
                        {item.total_cost && (
                          <div className="font-medium text-green-600">${item.total_cost.toFixed(2)}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(item.arrival_date)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <History className="h-12 w-12 text-muted-foreground" />
                      <div className="space-y-2">
                        <p className="font-medium text-lg">No Parts Usage History Found</p>
                        <p className="text-sm text-muted-foreground max-w-md">
                          This table will show detailed records of parts usage including usage date & time, 
                          part details, quantities, car information, client details, technician info, 
                          location, cost information, and arrival dates.
                        </p>
                      </div>
                      <Button onClick={createSampleData} className="mt-4">
                        <Package className="mr-2 h-4 w-4" />
                        Add Sample Data to Get Started
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {filteredHistory.length > 0 && (
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredHistory.length} of {history.length} records
        </div>
      )}
    </div>
  );
};

export default InventoryHistoryPage;
