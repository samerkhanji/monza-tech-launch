// =============================================
// CAR CARD COMPONENT
// =============================================
// Displays car information with warranty badges and action buttons

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Eye, MessageSquare, Wrench, Calendar, DollarSign, Move } from 'lucide-react';
import { loadWarrantyLife, type Car } from '@/lib/supabase-patterns';
import { EditCarDialog } from '@/components/forms/EditCarDialog';
import { PDIForm } from '@/components/forms/PDIForm';
import { TestDriveDialog } from '@/components/forms/TestDriveDialog';
import { ThreadPanel } from '@/components/forms/ThreadPanel';
import { format } from 'date-fns';

interface CarCardProps {
  car: Car;
  onCarUpdate?: (car: Car) => void;
  onMoveCar?: (carId: number, newLocation: string) => void;
}

const LOCATION_LABELS = {
  'FLOOR_1': 'Floor 1',
  'FLOOR_2': 'Floor 2',
  'GARAGE': 'Garage',
  'INVENTORY': 'Inventory',
  'ORDERED': 'Ordered',
};

const STATUS_COLORS = {
  'In Showroom': 'bg-green-100 text-green-800',
  'Under Repair': 'bg-red-100 text-red-800',
  'Reserved': 'bg-yellow-100 text-yellow-800',
  'Available': 'bg-blue-100 text-blue-800',
  'Sold': 'bg-gray-100 text-gray-800',
  'Maintenance': 'bg-orange-100 text-orange-800',
  'Test Drive': 'bg-purple-100 text-purple-800',
};

export function CarCard({ car, onCarUpdate, onMoveCar }: CarCardProps) {
  const [warrantyLife, setWarrantyLife] = useState<{ days_remaining: number | null } | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [pdiDialogOpen, setPdiDialogOpen] = useState(false);
  const [testDriveDialogOpen, setTestDriveDialogOpen] = useState(false);
  const [threadPanelOpen, setThreadPanelOpen] = useState(false);

  // Load warranty life when component mounts
  useEffect(() => {
    loadWarrantyData();
  }, [car.id]);

  const loadWarrantyData = async () => {
    try {
      const warranty = await loadWarrantyLife(car.id);
      setWarrantyLife(warranty);
    } catch (error) {
      console.error('Error loading warranty life:', error);
    }
  };

  const getWarrantyBadge = () => {
    if (!warrantyLife?.days_remaining) return null;
    
    const days = warrantyLife.days_remaining;
    if (days < 0) {
      return <Badge variant="destructive">Warranty Expired</Badge>;
    } else if (days < 30) {
      return <Badge variant="destructive">Warranty Expires Soon ({days} days)</Badge>;
    } else if (days < 90) {
      return <Badge variant="secondary">Warranty Expires in {days} days</Badge>;
    } else {
      return <Badge variant="outline">{days} days warranty left</Badge>;
    }
  };

  const getStatusBadge = () => {
    const colorClass = STATUS_COLORS[car.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800';
    return (
      <Badge className={colorClass}>
        {car.status || 'Unknown'}
      </Badge>
    );
  };

  const handleCarUpdate = (updatedCar: Car) => {
    onCarUpdate?.(updatedCar);
    setEditDialogOpen(false);
  };

  const handleMoveCar = (newLocation: string) => {
    onMoveCar?.(car.id, newLocation);
  };

  return (
    <>
      <Card className="w-full hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{car.model}</CardTitle>
              <p className="text-sm text-muted-foreground">VIN: {car.vin}</p>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {LOCATION_LABELS[car.location as keyof typeof LOCATION_LABELS] || car.location}
                </Badge>
                {getStatusBadge()}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Car
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPdiDialogOpen(true)}>
                  <Wrench className="h-4 w-4 mr-2" />
                  PDI Inspection
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTestDriveDialogOpen(true)}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Test Drive
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setThreadPanelOpen(true)}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Messages
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {/* TODO: Financial details */}}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Financial
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Car Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Year:</span>
              <p className="font-medium">{car.year || 'N/A'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Category:</span>
              <p className="font-medium">{car.category || 'N/A'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Color:</span>
              <p className="font-medium">{car.color || 'N/A'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">KM Driven:</span>
              <p className="font-medium">{car.km_driven ? car.km_driven.toLocaleString() : 'N/A'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Price:</span>
              <p className="font-medium">{car.price ? `$${car.price.toLocaleString()}` : 'N/A'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Battery:</span>
              <p className="font-medium">{car.battery_range_capacity || 'N/A'}</p>
            </div>
          </div>

          {/* Warranty Information */}
          {warrantyLife && (
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Warranty:</span>
                {getWarrantyBadge()}
              </div>
              {car.warranty_start && car.warranty_end && (
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(car.warranty_start), 'MMM d, yyyy')} - {format(new Date(car.warranty_end), 'MMM d, yyyy')}
                </p>
              )}
            </div>
          )}

          {/* Software & Customs */}
          <div className="pt-2 border-t space-y-2">
            {car.software_model && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Software:</span>
                <span className="text-sm font-medium">{car.software_model}</span>
              </div>
            )}
            {car.customs_status && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Customs:</span>
                <Badge variant="outline">{car.customs_status}</Badge>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="pt-2 border-t">
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditDialogOpen(true)}
                className="flex-1"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPdiDialogOpen(true)}
                className="flex-1"
              >
                <Wrench className="h-4 w-4 mr-1" />
                PDI
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTestDriveDialogOpen(true)}
                className="flex-1"
              >
                <Calendar className="h-4 w-4 mr-1" />
                Test Drive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <EditCarDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        carId={car.id}
        onSuccess={handleCarUpdate}
      />
      
      <PDIForm
        open={pdiDialogOpen}
        onOpenChange={setPdiDialogOpen}
        carId={car.id}
        carModel={car.model}
        onSuccess={() => {
          setPdiDialogOpen(false);
          // Reload warranty data if PDI affects warranty
          loadWarrantyData();
        }}
      />
      
      <TestDriveDialog
        open={testDriveDialogOpen}
        onOpenChange={setTestDriveDialogOpen}
        carId={car.id}
        carModel={car.model}
        onSuccess={() => setTestDriveDialogOpen(false)}
      />
      
      <ThreadPanel
        open={threadPanelOpen}
        onOpenChange={setThreadPanelOpen}
        carId={car.id}
        carModel={car.model}
        onSuccess={() => setThreadPanelOpen(false)}
      />
    </>
  );
}
