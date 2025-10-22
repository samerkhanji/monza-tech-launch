
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  Car, 
  User, 
  Calendar, 
  Search, 
  Filter,
  TrendingUp,
  Package,
  DollarSign,
  Wrench,
  Settings,
  FileText,
  History
} from 'lucide-react';
import { WorkTypeHistorySection } from './components/WorkTypeHistorySection';
import { WorkTypeBasedHistory } from './components/WorkTypeBasedHistory';
import { EnhancedRepairHistorySection } from './components/EnhancedRepairHistorySection';

const RepairHistoryPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCarVin, setSelectedCarVin] = useState<string>('');
  const [activeTab, setActiveTab] = useState('work-type-based');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Repair History</h1>
          <p className="text-gray-600">
            Comprehensive repair history with work type tracking, parts, and tools
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              <History className="h-8 w-8 mx-auto mb-2" />
            </div>
            <div className="text-sm text-gray-600">Complete History</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Label htmlFor="search">Search Repair History</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Search by car VIN, model, or employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="w-64">
          <Label htmlFor="carVin">Filter by Car VIN</Label>
          <Input
            id="carVin"
            placeholder="Enter car VIN..."
            value={selectedCarVin}
            onChange={(e) => setSelectedCarVin(e.target.value)}
          />
        </div>
        
        <Button 
          variant="outline"
          className="self-end"
          onClick={() => {
            setSearchQuery('');
            setSelectedCarVin('');
          }}
        >
          <Filter className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="enhanced" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Enhanced History
          </TabsTrigger>
          <TabsTrigger value="work-type-based" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Work Type Based
          </TabsTrigger>
          <TabsTrigger value="chronological" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Chronological
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enhanced" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Enhanced Repair History with Photos & Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedRepairHistorySection 
                searchQuery={searchQuery}
                carVin={selectedCarVin || undefined}
                showAll={!selectedCarVin}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="work-type-based" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Work Type Based Repair History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WorkTypeBasedHistory 
                carVin={selectedCarVin || undefined}
                showAll={!selectedCarVin}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chronological" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Chronological Repair History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WorkTypeHistorySection 
                carVin={selectedCarVin || undefined}
                showAll={!selectedCarVin}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800">Total Cars</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">-</div>
            <div className="text-sm text-blue-600">in repair history</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">Total Parts</span>
            </div>
            <div className="text-2xl font-bold text-green-900">-</div>
            <div className="text-sm text-green-600">used across all repairs</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-orange-600" />
              <span className="font-medium text-orange-800">Total Tools</span>
            </div>
            <div className="text-2xl font-bold text-orange-900">-</div>
            <div className="text-sm text-orange-600">used across all repairs</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-purple-600" />
              <span className="font-medium text-purple-800">Total Mechanics</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">-</div>
            <div className="text-sm text-purple-600">involved in repairs</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RepairHistoryPage;
