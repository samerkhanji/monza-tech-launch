import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ScheduledCar {
  id: string;
  carCode: string;
  carModel: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'paused';
  startTime: string;
  estimatedDuration: string;
}

interface GarageScheduleState {
  scheduledCars: ScheduledCar[];
  currentDate: string;
  realTimeEnabled: boolean;
}

const initialState: GarageScheduleState = {
  scheduledCars: [],
  currentDate: new Date().toISOString().split('T')[0],
  realTimeEnabled: true,
};

export const garageScheduleSlice = createSlice({
  name: 'garageSchedule',
  initialState,
  reducers: {
    addScheduledCar: (state, action: PayloadAction<ScheduledCar>) => {
      state.scheduledCars.push(action.payload);
    },
    updateCarStatus: (state, action: PayloadAction<{ carId: string; status: ScheduledCar['status'] }>) => {
      const car = state.scheduledCars.find(car => car.id === action.payload.carId);
      if (car) {
        car.status = action.payload.status;
      }
    },
    setRealTimeEnabled: (state, action: PayloadAction<boolean>) => {
      state.realTimeEnabled = action.payload;
    },
  },
});

export const { addScheduledCar, updateCarStatus, setRealTimeEnabled } = garageScheduleSlice.actions;
export default garageScheduleSlice.reducer;
