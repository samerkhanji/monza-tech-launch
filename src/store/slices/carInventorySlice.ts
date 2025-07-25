import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Car } from '@/pages/CarInventory/types';
import { carInventoryData } from '@/pages/CarInventory/data';

interface CarInventoryState {
  cars: Car[];
  loading: boolean;
  error: string | null;
  lastSynced: string | null;
  isDirty: boolean;
}

const initialState: CarInventoryState = {
  cars: [],
  loading: false,
  error: null,
  lastSynced: null,
  isDirty: false,
};

export const loadCarsFromStorage = createAsyncThunk(
  'carInventory/loadFromStorage',
  async () => {
    try {
      const savedCars = localStorage.getItem('carInventory');
      if (savedCars) {
        return JSON.parse(savedCars) as Car[];
      }
      return carInventoryData;
    } catch (error) {
      console.error('Error loading cars from storage:', error);
      return carInventoryData;
    }
  }
);

export const saveCarsToStorage = createAsyncThunk(
  'carInventory/saveToStorage',
  async (cars: Car[]) => {
    try {
      localStorage.setItem('carInventory', JSON.stringify(cars));
      return cars;
    } catch (error) {
      console.error('Error saving cars to storage:', error);
      throw error;
    }
  }
);

export const carInventorySlice = createSlice({
  name: 'carInventory',
  initialState,
  reducers: {
    updateCarStatus: (state, action: PayloadAction<{ carId: string; status: 'in_stock' | 'sold' | 'reserved' }>) => {
      const { carId, status } = action.payload;
      const car = state.cars.find(car => car.id === carId);
      if (car) {
        car.status = status;
        car.soldDate = status === 'sold' ? new Date().toISOString() : car.soldDate;
        car.reservedDate = status === 'reserved' ? new Date().toISOString() : car.reservedDate;
        car.lastUpdated = new Date().toISOString();
        state.isDirty = true;
      }
    },
    updateCar: (state, action: PayloadAction<{ carId: string; updates: Partial<Car> }>) => {
      const { carId, updates } = action.payload;
      const car = state.cars.find(car => car.id === carId);
      if (car) {
        Object.assign(car, updates);
        car.lastUpdated = new Date().toISOString();
        state.isDirty = true;
      }
    },
    markSynced: (state) => {
      state.isDirty = false;
      state.lastSynced = new Date().toISOString();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCarsFromStorage.fulfilled, (state, action) => {
        state.loading = false;
        state.cars = action.payload;
        state.lastSynced = new Date().toISOString();
        state.isDirty = false;
      })
      .addCase(saveCarsToStorage.fulfilled, (state) => {
        state.loading = false;
        state.isDirty = false;
        state.lastSynced = new Date().toISOString();
      });
  },
});

export const { updateCarStatus, updateCar, markSynced } = carInventorySlice.actions;
export default carInventorySlice.reducer;
