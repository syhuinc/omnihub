import { useEffect, useRef, useState } from 'react';

export type GeoStatus = 'checking' | 'denied' | 'unavailable' | 'ready';

export interface GeoCoords {
  lat: number;
  lng: number;
  accuracy: number;
  altitude: number | null;
}

export interface GeoState {
  status: GeoStatus;
  coords: GeoCoords | null;
  refresh: () => void;
}

/**
 * Live location for the Compass tool's Location/Altitude/Accuracy cards. Calling
 * getCurrentPosition/watchPosition is what actually triggers Capacitor's WebView bridge to
 * request the Android runtime permission - no separate plugin call needed for that.
 */
export function useGeolocation(): GeoState {
  const [status, setStatus] = useState<GeoStatus>('checking');
  const [coords, setCoords] = useState<GeoCoords | null>(null);
  const watchIdRef = useRef<number | null>(null);

  function start() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unavailable');
      return;
    }
    setStatus('checking');
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
        });
        setStatus('ready');
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable');
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
    );
  }

  function stop() {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }

  useEffect(() => {
    start();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function refresh() {
    stop();
    start();
  }

  return { status, coords, refresh };
}
