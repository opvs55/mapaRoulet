import { useState } from 'react';
import { Coordinates } from '../types/index.ts';

interface GeolocationState {
  location: Coordinates | null;
  error: string | null;
  requestLocation: () => void;
}

const useGeolocation = (): GeolocationState => {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocalização não é suportada pelo seu navegador.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setError(null);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Permissão para geolocalização negada.");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Informação de localização indisponível.");
            break;
          case err.TIMEOUT:
            setError("A requisição de localização expirou.");
            break;
          default:
            setError("Ocorreu um erro desconhecido.");
            break;
        }
      }
    );
  };

  return { location, error, requestLocation };
};

export default useGeolocation;