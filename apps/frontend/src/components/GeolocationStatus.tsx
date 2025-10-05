import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

const GeolocationStatus: React.FC = () => {
  const { latitude, longitude, error } = useSelector((state: RootState) => state.geolocation);
  const isOk = !error && latitude !== null && longitude !== null;

  return (
    <div className="text-sm my-4">
      <h2>Geolocation Status</h2>
      <span className="text-xs">{!isOk ? <span>Problem, wait a bit</span> : <span>OK</span>}</span>
    </div>
  );
};

export default GeolocationStatus;
