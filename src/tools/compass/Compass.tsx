import { useEffect, useRef, useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { useRouter } from '../../app/Router';
import './Compass.css';

type Status = 'checking' | 'unavailable' | 'needsPermission' | 'ready';

const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

function directionLabel(heading: number): string {
  const index = Math.round(heading / 45) % 8;
  return DIRECTIONS[index];
}

// Some browsers expose event.webkitCompassHeading (already 0=N, clockwise);
// otherwise fall back to 360 - alpha, the standard conversion for absolute orientation.
interface CompassOrientationEvent extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

export function Compass() {
  const { back } = useRouter();
  const [status, setStatus] = useState<Status>('checking');
  const [heading, setHeading] = useState(0);
  const listenerRef = useRef<((e: DeviceOrientationEvent) => void) | null>(null);

  function handleOrientation(e: CompassOrientationEvent) {
    let value: number | null = null;
    if (typeof e.webkitCompassHeading === 'number') {
      value = e.webkitCompassHeading;
    } else if (e.alpha !== null) {
      value = 360 - e.alpha;
    }
    if (value !== null) {
      setHeading(((value % 360) + 360) % 360);
      setStatus('ready');
    }
  }

  function attachListener() {
    const eventName = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
    listenerRef.current = handleOrientation as (e: DeviceOrientationEvent) => void;
    window.addEventListener(eventName, listenerRef.current, true);
  }

  useEffect(() => {
    if (typeof DeviceOrientationEvent === 'undefined') {
      setStatus('unavailable');
      return;
    }

    const requestPermission = (
      DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<'granted' | 'denied'> }
    ).requestPermission;

    if (typeof requestPermission === 'function') {
      setStatus('needsPermission');
    } else {
      attachListener();
      // If no orientation event ever arrives, the device likely has no compass sensor.
      const timeout = setTimeout(() => setStatus((s) => (s === 'checking' ? 'unavailable' : s)), 2500);
      return () => {
        clearTimeout(timeout);
        if (listenerRef.current) {
          window.removeEventListener('deviceorientationabsolute', listenerRef.current, true);
          window.removeEventListener('deviceorientation', listenerRef.current, true);
        }
      };
    }

    return () => {
      if (listenerRef.current) {
        window.removeEventListener('deviceorientationabsolute', listenerRef.current, true);
        window.removeEventListener('deviceorientation', listenerRef.current, true);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function grantPermission() {
    const requestPermission = (
      DeviceOrientationEvent as unknown as { requestPermission: () => Promise<'granted' | 'denied'> }
    ).requestPermission;
    try {
      const result = await requestPermission();
      if (result === 'granted') {
        setStatus('checking');
        attachListener();
      } else {
        setStatus('unavailable');
      }
    } catch {
      setStatus('unavailable');
    }
  }

  return (
    <div className="screen">
      <ScreenHeader title="Compass" onBack={back} />

      <div className="cp__body">
        {status === 'checking' && <p className="cp__hint">Finding compass sensor…</p>}

        {status === 'unavailable' && (
          <>
            <Icon name="info" size={32} className="cp__hint-icon" />
            <p className="cp__hint">This device doesn't have a compass sensor.</p>
          </>
        )}

        {status === 'needsPermission' && (
          <>
            <p className="cp__hint">Compass needs access to motion &amp; orientation sensors.</p>
            <button type="button" className="cp__btn" onClick={grantPermission}>
              Enable Compass
            </button>
          </>
        )}

        {status === 'ready' && (
          <>
            <div className="cp__dial-wrap">
              <div className="cp__dial" style={{ transform: `rotate(${-heading}deg)` }}>
                <span className="cp__dial-label cp__dial-label--n">N</span>
                <span className="cp__dial-label cp__dial-label--e">E</span>
                <span className="cp__dial-label cp__dial-label--s">S</span>
                <span className="cp__dial-label cp__dial-label--w">W</span>
                <span className="cp__dial-tick cp__dial-tick--ne" />
                <span className="cp__dial-tick cp__dial-tick--se" />
                <span className="cp__dial-tick cp__dial-tick--sw" />
                <span className="cp__dial-tick cp__dial-tick--nw" />
              </div>
              <span className="cp__needle" />
            </div>
            <span className="cp__heading">{Math.round(heading)}°</span>
            <span className="cp__direction">{directionLabel(heading)}</span>
          </>
        )}
      </div>
    </div>
  );
}
