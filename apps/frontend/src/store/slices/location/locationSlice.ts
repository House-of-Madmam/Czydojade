import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
}

const initialState: GeolocationState = {
  latitude: null,
  longitude: null,
  error: null,
};

const geolocationSlice = createSlice({
  name: 'geolocation',
  initialState,
  reducers: {
    setGeolocation(state, action: PayloadAction<{ latitude: number; longitude: number }>) {
      state.latitude = action.payload.latitude;
      state.longitude = action.payload.longitude;
      state.error = null;
    },
    setGeolocationError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.latitude = null;
      state.longitude = null;
    },
    resetGeolocation(state) {
      state.latitude = null;
      state.longitude = null;
      state.error = null;
    },
  },
});

export const { setGeolocation, setGeolocationError, resetGeolocation } = geolocationSlice.actions;
export const geolocationReducer = geolocationSlice.reducer;