import React, { useState, useEffect } from 'react';
import { SparklesIcon, QrCodeIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import TableSearch from '@/components/ui/table-search';
import { useSorting } from '@/hooks/use-sorting';
import { Car } from '@/types';

const ShowroomFloor2Page = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showPdiDialog, setShowPdiDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showTestDriveSelectionDialog, setShowTestDriveSelectionDialog] = useState(false);
  const [showTestDriveDialog, setShowTestDriveDialog] = useState(false);
  const [selectedTestDriveType, setSelectedTestDriveType] = useState<boolean>(true);
  const [sortState, onSort] = useSorting<Car>();
  const [filters, setFilters] = useState({
    model: '',
    color: '',
    status: ''
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Filter cars based on search query
  const filteredCars = cars.filter(car => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      car.vinNumber?.toLowerCase().includes(query) ||
      car.model?.toLowerCase().includes(query) ||
      car.color?.toLowerCase().includes(query) ||
      car.status?.toLowerCase().includes(query) ||
      car.clientName?.toLowerCase().includes(query) ||
      car.notes?.toLowerCase().includes(query) ||
      car.year?.toString().includes(query) ||
      car.batteryPercentage?.toString().includes(query)
    );
  });

  // Load cars on component mount
  useEffect(() => {
    loadCars();
  }, []);

  const loadCars = async () => {
    try {
      setIsLoading(true);
      // Load cars from localStorage as fallback
      const savedCars = localStorage.getItem('carInventory');
      if (savedCars) {
        const parsedCars = JSON.parse(savedCars);
        setCars(parsedCars);
      }
    } catch (error) {
      console.error('Error loading cars:', error);
      toast({
        title: "Error",
        description: "Failed to load car inventory",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Showroom Floor 2</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowScanner(true)}>
            <QrCodeIcon className="w-4 h-4 mr-2" />
            Scan QR
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <SparklesIcon className="w-4 h-4 mr-2" />
            Add Car
          </Button>
        </div>
      </div>

      <TableSearch
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search cars..."
      />

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">
              Cars in Showroom Floor 2 ({filteredCars.length})
            </h2>
            
            {filteredCars.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No cars found in Showroom Floor 2
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCars.map((car) => (
                  <div key={car.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold">{car.model}</h3>
                    <p className="text-sm text-gray-600">{car.year} • {car.color}</p>
                    <p className="text-xs text-gray-500">VIN: {car.vinNumber}</p>
                    <div className="mt-2">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        car.status === 'in_stock' ? 'bg-green-100 text-green-800' :
                        car.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {car.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowroomFloor2Page; 