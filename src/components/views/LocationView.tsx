// =============================================
// LOCATION VIEW COMPONENT
// =============================================
// Displays cars filtered by location (Floor 1, Floor 2, Garage, etc.)

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Grid, List, Loader2 } from 'lucide-react';
import { loadCarsByLocation, moveCar, type Car } from '@/lib/supabase-patterns';
import { CarCard } from '@/components/cards/CarCard';
import { EditCarDialog } from '@/components/forms/EditCarDialog';
import { toast } from 'sonner';

interface LocationViewProps {
  location: 'FLOOR_1' | 'FLOOR_2' | 'GARAGE' | 'INVENTORY' | 'ORDERED';
  title: string;
  description?: string;
}

const LOCATION_LABELS = {
  'FLOOR_1': 'Floor 1',
  'FLOOR_2': 'Floor 2',
  'GARAGE': 'Garage',
  'INVENTORY': 'Inventory',
  'ORDERED': 'Ordered',
};

const STATUS_FILTERS = [
  'All',
  'In Showroom',
  'Under Repair',
  'Reserved',
  'Available',
  'Sold',
  'Maintenance',
  'Test Drive',
];

const CATEGORY_FILTERS = [
  'All',
  'Sedan',
  'SUV',
  'Truck',
  'Hatchback',
  'Coupe',
  'Convertible',
  'Crossover',
  'Wagon',
];

export function LocationView({ location, title, description }: LocationViewProps) {
  const [cars, setCars] = useState<Car[]>([]);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);

  // Load cars when component mounts
  useEffect(() => {
    loadCars();
  }, [location]);

  // Apply filters when search term or filters change
  useEffect(() => {
    applyFilters();
  }, [cars, searchTerm, statusFilter, categoryFilter]);

  const loadCars = async () => {
    setLoading(true);
    try {
      const locationCars = await loadCarsByLocation(location);
      setCars(locationCars);
    } catch (error) {
      console.error('Error loading cars:', error);
      toast.error('Failed to load cars');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = cars;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(car =>
        car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (car.color && car.color.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (car.category && car.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(car => car.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'All') {
      filtered = filtered.filter(car => car.category === categoryFilter);
    }

    setFilteredCars(filtered);
  };

  const handleMoveCar = async (carId: number, newLocation: string) => {
    try {
      await moveCar(carId, newLocation);
      toast.success(`Car moved to ${LOCATION_LABELS[newLocation as keyof typeof LOCATION_LABELS] || newLocation}`);
      loadCars(); // Reload to update the list
    } catch (error) {
      console.error('Error moving car:', error);
      toast.error('Failed to move car');
    }
  };

  const handleCarUpdate = (updatedCar: Car) => {
    setCars(prev => prev.map(car => car.id === updatedCar.id ? updatedCar : car));
    setEditDialogOpen(false);
    setSelectedCar(null);
  };

  const handleEditCar = (car: Car) => {
    setSelectedCar(car);
    setEditDialogOpen(true);
  };

  const handleAddNewCar = () => {
    setSelectedCar(null);
    setEditDialogOpen(true);
  };

  const getLocationStats = () => {
    const total = cars.length;
    const available = cars.filter(car => car.status === 'Available').length;
    const inShowroom = cars.filter(car => car.status === 'In Showroom').length;
    const underRepair = cars.filter(car => car.status === 'Under Repair').length;
    const reserved = cars.filter(car => car.status === 'Reserved').length;

    return { total, available, inShowroom, underRepair, reserved };
  };

  const stats = getLocationStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading {title}...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <Button onClick={handleAddNewCar} className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Car
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Cars</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
            <p className="text-sm text-muted-foreground">Available</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.inShowroom}</div>
            <p className="text-sm text-muted-foreground">In Showroom</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.underRepair}</div>
            <p className="text-sm text-muted-foreground">Under Repair</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.reserved}</div>
            <p className="text-sm text-muted-foreground">Reserved</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by model, VIN, color, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_FILTERS.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredCars.length} of {cars.length} cars
        </p>
        {(searchTerm || statusFilter !== 'All' || categoryFilter !== 'All') && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('All');
              setCategoryFilter('All');
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Cars Grid/List */}
      {filteredCars.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              {cars.length === 0 
                ? `No cars in ${title} yet. Add your first car to get started.`
                : 'No cars match your current filters. Try adjusting your search criteria.'
              }
            </p>
            {cars.length === 0 && (
              <Button onClick={handleAddNewCar} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add First Car
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }>
          {filteredCars.map((car) => (
            <CarCard
              key={car.id}
              car={car}
              onCarUpdate={handleCarUpdate}
              onMoveCar={handleMoveCar}
            />
          ))}
        </div>
      )}

      {/* Edit Car Dialog */}
      <EditCarDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        carId={selectedCar?.id}
        onSuccess={handleCarUpdate}
      />
    </div>
  );
}
