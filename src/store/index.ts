import { configureStore } from '@reduxjs/toolkit';
import carInventoryReducer from './slices/carInventorySlice';
import appStateReducer from './slices/appStateSlice';
import garageScheduleReducer from './slices/garageScheduleSlice';
import notificationReducer from './slices/notificationSlice';

export const store = configureStore({
  reducer: {
    carInventory: carInventoryReducer,
    appState: appStateReducer,
    garageSchedule: garageScheduleReducer,
    notifications: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 