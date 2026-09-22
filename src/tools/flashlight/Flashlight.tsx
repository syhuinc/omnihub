import { useEffect, useState } from 'react';
import { Torch } from '@capawesome/capacitor-torch';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { useRouter } from '../../app/Router';
import { hapticTap } from '../../haptics';
import './Flashlight.css';

type Status = 'checking' | 'unavailable' | 'ready';

export function Flashlight() {
  const { back } = useRouter();
  const [status, setStatus] = useState<Status>('checking');
  const [on, setOn] = useState(false);

  useEffect(() => {
    let mounted = true;
    Torch.isAvailable()
      .then(({ available }) => {
        if (mounted) setStatus(available ? 'ready' : 'unavailable');
      })
      .catch(() => {
        if (mounted) setStatus('unavailable');
      });
    return () => {
      mounted = false;
      Torch.disable().catch(() => {
        // ignore
      });
    };
  }, []);

  async function toggle() {
    hapticTap();
    try {
      if (on) {
        await Torch.disable();
      } else {
        await Torch.enable();
      }
      setOn((v) => !v);
    } catch {
      setStatus('unavailable');
    }
  }

  return (
    <div className={`screen fl${on ? ' fl--on' : ''}`}>
      <ScreenHeader title="Flashlight" onBack={back} />

      <div className="fl__body">
        {status === 'checking' && <p className="fl__hint">Checking flashlight…</p>}

        {status === 'unavailable' && (
          <>
            <Icon name="info" size={32} className="fl__hint-icon" />
            <p className="fl__hint">This device doesn't have a flashlight.</p>
          </>
        )}

        {status === 'ready' && (
          <>
            <button
              type="button"
              className={`fl__toggle${on ? ' fl__toggle--on' : ''}`}
              onClick={toggle}
              aria-label={on ? 'Turn off flashlight' : 'Turn on flashlight'}
            >
              <Icon name="flashlight" size={64} />
            </button>
            <p className="fl__status">{on ? 'ON' : 'OFF'}</p>
            <p className="fl__hint">Tap to {on ? 'turn off' : 'turn on'}</p>
          </>
        )}
      </div>
    </div>
  );
}
