import { useAppDispatch } from '@/store';
import { initializeGeolocationWatcher } from '@/store/slices/location/initialize';
import { useEffect } from 'react';

export default function InitializeServices() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    initializeGeolocationWatcher(dispatch);
  }, [dispatch]);
  return null;
}
