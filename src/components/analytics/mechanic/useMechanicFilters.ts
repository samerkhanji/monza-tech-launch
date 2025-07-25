
import { useState, useMemo } from 'react';
import { MechanicData } from './types';

export const useMechanicFilters = (data: MechanicData[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('all');
  const [performanceFilter, setPerformanceFilter] = useState('all');

  const specializations = useMemo(() => 
    [...new Set(data.map(m => m.specialization))], [data]
  );

  const filteredData = useMemo(() => 
    data.filter(mechanic => {
      const matchesSearch = mechanic.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSpecialization = specializationFilter === 'all' || 
        mechanic.specialization === specializationFilter;
      
      let matchesPerformance = true;
      if (performanceFilter === 'high') {
        matchesPerformance = mechanic.onTimeRate >= 90;
      } else if (performanceFilter === 'medium') {
        matchesPerformance = mechanic.onTimeRate >= 80 && mechanic.onTimeRate < 90;
      } else if (performanceFilter === 'low') {
        matchesPerformance = mechanic.onTimeRate < 80;
      }
      
      return matchesSearch && matchesSpecialization && matchesPerformance;
    }), [data, searchTerm, specializationFilter, performanceFilter]
  );

  return {
    searchTerm,
    setSearchTerm,
    specializationFilter,
    setSpecializationFilter,
    performanceFilter,
    setPerformanceFilter,
    specializations,
    filteredData
  };
};
