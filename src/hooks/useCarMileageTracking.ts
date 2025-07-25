import { useState, useEffect } from 'react';

interface MileageRecord {
  id: string;
  vin: string;
  date: string;
  mileage: number;
  previousMileage: number;
  weeklyDistance: number;
  recordedBy: string;
  notes?: string;
}

interface CarMileageData {
  vin: string;
  model: string;
  location: string;
  currentMileage: number;
  lastUpdated: string;
  weeklyAverage: number;
  totalDistance: number;
  mileageHistory: MileageRecord[];
}

interface WeeklyMileageSummary {
  totalCars: number;
  carsWithUpdates: number;
  averageWeeklyDistance: number;
  highestWeeklyDistance: number;
  lowestWeeklyDistance: number;
  carsNeedingUpdate: string[];
}

export const useCarMileageTracking = () => {
  const [mileageData, setMileageData] = useState<CarMileageData[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<WeeklyMileageSummary>({
    totalCars: 0,
    carsWithUpdates: 0,
    averageWeeklyDistance: 0,
    highestWeeklyDistance: 0,
    lowestWeeklyDistance: 0,
    carsNeedingUpdate: []
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadMileageData = () => {
    try {
      setIsLoading(true);
      
      // Load data from all inventory sources
      const carInventory = JSON.parse(localStorage.getItem('carInventory') || '[]');
      const garageInventory = JSON.parse(localStorage.getItem('garageInventory') || '[]');
      const showroomFloor1 = JSON.parse(localStorage.getItem('showroomFloor1') || '[]');
      const showroomFloor2 = JSON.parse(localStorage.getItem('showroomFloor2') || '[]');

      // Load existing mileage records
      const mileageRecords = JSON.parse(localStorage.getItem('carMileageRecords') || '[]');
      
      // Combine all car data
      const allCars = [
        ...carInventory.map((car: any) => ({ ...car, source: 'carInventory' })),
        ...garageInventory.map((car: any) => ({ ...car, source: 'garageInventory' })),
        ...showroomFloor1.map((car: any) => ({ ...car, source: 'showroomFloor1' })),
        ...showroomFloor2.map((car: any) => ({ ...car, source: 'showroomFloor2' }))
      ];

      // Process and normalize car mileage data
      const processedCars: CarMileageData[] = allCars.map((car: any) => {
        const vin = car.vin || car.vinNumber || car.id || 'Unknown';
        const carMileageRecords = mileageRecords.filter((record: MileageRecord) => record.vin === vin);
        
        // Get current mileage from records or car data
        const currentMileage = carMileageRecords.length > 0 
          ? carMileageRecords[carMileageRecords.length - 1].mileage 
          : car.mileage || car.range || car.odometer || 0;

        // Calculate weekly average
        const weeklyDistances = carMileageRecords
          .filter((record: MileageRecord) => record.weeklyDistance > 0)
          .map((record: MileageRecord) => record.weeklyDistance);
        
        const weeklyAverage = weeklyDistances.length > 0 
          ? weeklyDistances.reduce((sum: number, distance: number) => sum + distance, 0) / weeklyDistances.length 
          : 0;

        // Calculate total distance
        const totalDistance = carMileageRecords.length > 0 
          ? carMileageRecords[carMileageRecords.length - 1].mileage - (carMileageRecords[0].previousMileage || 0)
          : 0;

        return {
          vin,
          model: car.model || car.make || car.brand || 'Unknown Model',
          location: car.location || car.source || 'Unknown',
          currentMileage,
          lastUpdated: carMileageRecords.length > 0 
            ? carMileageRecords[carMileageRecords.length - 1].date 
            : new Date().toISOString(),
          weeklyAverage: Math.round(weeklyAverage),
          totalDistance: Math.round(totalDistance),
          mileageHistory: carMileageRecords.sort((a: MileageRecord, b: MileageRecord) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          )
        };
      });

      // Remove duplicates based on VIN
      const uniqueCars = processedCars.filter((car, index, self) => 
        index === self.findIndex(c => c.vin === car.vin)
      );

      setMileageData(uniqueCars);

      // Calculate weekly summary
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const recentRecords = mileageRecords.filter((record: MileageRecord) => 
        new Date(record.date) >= oneWeekAgo
      );

      const weeklyDistances = recentRecords.map((record: MileageRecord) => record.weeklyDistance);
      
      const summary: WeeklyMileageSummary = {
        totalCars: uniqueCars.length,
        carsWithUpdates: recentRecords.length,
        averageWeeklyDistance: weeklyDistances.length > 0 
          ? Math.round(weeklyDistances.reduce((sum, distance) => sum + distance, 0) / weeklyDistances.length)
          : 0,
        highestWeeklyDistance: weeklyDistances.length > 0 ? Math.max(...weeklyDistances) : 0,
        lowestWeeklyDistance: weeklyDistances.length > 0 ? Math.min(...weeklyDistances) : 0,
        carsNeedingUpdate: uniqueCars
          .filter(car => {
            const lastUpdate = new Date(car.lastUpdated);
            return lastUpdate < oneWeekAgo;
          })
          .map(car => car.vin)
      };

      setWeeklySummary(summary);
    } catch (error) {
      console.error('Error loading mileage data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addMileageRecord = (vin: string, mileage: number, recordedBy: string, notes?: string) => {
    try {
      const existingRecords = JSON.parse(localStorage.getItem('carMileageRecords') || '[]');
      const carRecords = existingRecords.filter((record: MileageRecord) => record.vin === vin);
      
      const previousMileage = carRecords.length > 0 
        ? carRecords[carRecords.length - 1].mileage 
        : mileage;
      
      const weeklyDistance = mileage - previousMileage;
      
      const newRecord: MileageRecord = {
        id: `mileage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        vin,
        date: new Date().toISOString(),
        mileage,
        previousMileage,
        weeklyDistance: Math.max(0, weeklyDistance), // Ensure non-negative
        recordedBy,
        notes
      };

      const updatedRecords = [...existingRecords, newRecord];
      localStorage.setItem('carMileageRecords', JSON.stringify(updatedRecords));
      
      // Reload data
      loadMileageData();
      
      return newRecord;
    } catch (error) {
      console.error('Error adding mileage record:', error);
      throw error;
    }
  };

  const getMileageHistory = (vin: string): MileageRecord[] => {
    const records = JSON.parse(localStorage.getItem('carMileageRecords') || '[]');
    return records
      .filter((record: MileageRecord) => record.vin === vin)
      .sort((a: MileageRecord, b: MileageRecord) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
  };

  const getWeeklyMileageReport = (startDate?: Date, endDate?: Date) => {
    const records = JSON.parse(localStorage.getItem('carMileageRecords') || '[]');
    const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();
    
    return records.filter((record: MileageRecord) => {
      const recordDate = new Date(record.date);
      return recordDate >= start && recordDate <= end;
    });
  };

  const exportMileageData = (format: 'csv' | 'json' = 'csv') => {
    const records = JSON.parse(localStorage.getItem('carMileageRecords') || '[]');
    
    if (format === 'json') {
      return JSON.stringify(records, null, 2);
    }
    
    // CSV format
    const headers = ['VIN', 'Date', 'Mileage', 'Previous Mileage', 'Weekly Distance', 'Recorded By', 'Notes'];
    const csvData = [
      headers.join(','),
      ...records.map((record: MileageRecord) => [
        record.vin,
        new Date(record.date).toLocaleDateString(),
        record.mileage,
        record.previousMileage,
        record.weeklyDistance,
        record.recordedBy,
        `"${record.notes || ''}"`
      ].join(','))
    ].join('\n');
    
    return csvData;
  };

  const getCarsNeedingMileageUpdate = () => {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return mileageData.filter(car => new Date(car.lastUpdated) < oneWeekAgo);
  };

  const getMileageTrends = (vin: string, weeks: number = 4) => {
    const records = getMileageHistory(vin);
    const recentRecords = records.slice(0, weeks);
    
    return recentRecords.map(record => ({
      date: new Date(record.date).toLocaleDateString(),
      weeklyDistance: record.weeklyDistance,
      totalMileage: record.mileage
    }));
  };

  useEffect(() => {
    loadMileageData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(loadMileageData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    mileageData,
    weeklySummary,
    isLoading,
    addMileageRecord,
    getMileageHistory,
    getWeeklyMileageReport,
    exportMileageData,
    getCarsNeedingMileageUpdate,
    getMileageTrends,
    refreshData: loadMileageData
  };
}; 