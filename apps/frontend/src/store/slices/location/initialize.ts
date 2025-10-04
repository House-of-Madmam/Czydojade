import GeolocationService from "@/api/hardware/position/geolocation";
import { AppDispatch } from "@/store";
import { setGeolocationError, setGeolocation } from "./locationSlice";

export const initializeGeolocationWatcher = (dispatch: AppDispatch): number | null => {
  if (!GeolocationService.isGeolocationSupported()) {
    dispatch(setGeolocationError('Geolocation is not supported by this browser.'));
    return null;
  }

  const watchId = GeolocationService.watchPosition(
    (position: GeolocationPosition) => {
      dispatch(
        setGeolocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      );
    },
    (error: GeolocationPositionError) => {
      dispatch(setGeolocationError(error.message));
    }
  );

  return watchId;
};