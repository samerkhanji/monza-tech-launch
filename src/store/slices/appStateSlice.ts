import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AppState {
  currentUser: string | null;
  isLoading: boolean;
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
}

const initialState: AppState = {
  currentUser: null,
  isLoading: false,
  theme: 'light',
  sidebarCollapsed: false,
};

export const appStateSlice = createSlice({
  name: 'appState',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<string | null>) => {
      state.currentUser = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
  },
});

export const { setCurrentUser, setLoading, toggleSidebar } = appStateSlice.actions;
export default appStateSlice.reducer;
