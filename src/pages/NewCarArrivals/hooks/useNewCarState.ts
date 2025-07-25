
import { useState, useEffect } from 'react';
import { initialNewCars, NewCarArrival } from '../types';

export const useNewCarState = () => {
  const [newCars, setNewCars] = useState<NewCarArrival[]>(() => {
    const saved = localStorage.getItem('newCarArrivals');
    return saved ? JSON.parse(saved) : initialNewCars;
  });

  const [newVin, setNewVin] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newColor, setNewColor] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newBatteryPercentage, setNewBatteryPercentage] = useState(50);
  const [vehicleCategory, setVehicleCategory] = useState<'EV' | 'REV' | 'ICEV' | 'Other'>('EV');
  const [hasDamages, setHasDamages] = useState(false);
  const [damageDescription, setDamageDescription] = useState('');
  const [showPdiForm, setShowPdiForm] = useState<boolean>(false);
  const [technician, setTechnician] = useState('');
  const [pdiNotes, setPdiNotes] = useState('');

  useEffect(() => {
    localStorage.setItem('newCarArrivals', JSON.stringify(newCars));
  }, [newCars]);

  return {
    newCars,
    setNewCars,
    newVin,
    setNewVin,
    newModel,
    setNewModel,
    newColor,
    setNewColor,
    newNotes,
    setNewNotes,
    newBatteryPercentage,
    setNewBatteryPercentage,
    vehicleCategory,
    setVehicleCategory,
    hasDamages,
    setHasDamages,
    damageDescription,
    setDamageDescription,
    showPdiForm,
    setShowPdiForm,
    technician,
    setTechnician,
    pdiNotes,
    setPdiNotes,
  };
};
