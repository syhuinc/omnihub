import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { Torch } from '@capawesome/capacitor-torch';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { useRouter } from '../../app/Router';
import { hapticTap } from '../../haptics';
import { FlashAlertPlugin, type FlashAlertSettings } from '../../flashalert/plugin';
import './Flashlight.css';

type Status = 'checking' | 'unavailable' | 'ready';

const DEFAULT_ALERT_SETTINGS: FlashAlertSettings = {
  notificationEnabled: false,
  callEnabled: false,
  alarmEnabled: false,
  notificationAccessGranted: false,
  callPermissionGranted: false,
};

export function Flashlight() {
  const { back } = useRouter();
  const [status, setStatus] = useState<Status>('checking');
  const [on, setOn] = useState(false);
  const [alerts, setAlerts] = useState<FlashAlertSettings>(DEFAULT_ALERT_SETTINGS);
  const isNative = Capacitor.isNativePlatform();

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

  useEffect(() => {
    if (!isNative) return;
    function refresh() {
      FlashAlertPlugin.getSettings().then(setAlerts).catch(() => {});
    }
    refresh();
    const listener = CapacitorApp.addListener('resume', refresh);
    return () => {
      listener.then((l) => l.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  async function toggleAlarmAlert() {
    hapticTap();
    setAlerts(await FlashAlertPlugin.setAlarmEnabled({ enabled: !alerts.alarmEnabled }));
  }

  async function toggleCallAlert() {
    hapticTap();
    if (!alerts.callPermissionGranted) {
      const granted = await FlashAlertPlugin.requestCallPermission();
      setAlerts(granted);
      if (!granted.callPermissionGranted) return;
      setAlerts(await FlashAlertPlugin.setCallEnabled({ enabled: true }));
      return;
    }
    setAlerts(await FlashAlertPlugin.setCallEnabled({ enabled: !alerts.callEnabled }));
  }

  async function toggleNotificationAlert() {
    hapticTap();
    if (!alerts.notificationAccessGranted) {
      // Optimistically mark it enabled so it turns on by itself once access is granted in
      // Settings and we refresh on 'resume' - Android has no in-app permission dialog for this.
      setAlerts(await FlashAlertPlugin.setNotificationEnabled({ enabled: true }));
      await FlashAlertPlugin.openNotificationAccessSettings();
      return;
    }
    setAlerts(await FlashAlertPlugin.setNotificationEnabled({ enabled: !alerts.notificationEnabled }));
  }

  const callOn = alerts.callEnabled && alerts.callPermissionGranted;
  const notificationOn = alerts.notificationEnabled && alerts.notificationAccessGranted;

  return (
    <div className={`screen fl${on ? ' fl--on' : ''}`}>
      <ScreenHeader title="Flashlight" onBack={back} />

      <div className="fl__body">
        {status === 'checking' && <p className="fl__hint">Checking flashlight…</p>}

        {status === 'unavailable' && (
          <div className="fl__toggle-section">
            <Icon name="info" size={32} className="fl__hint-icon" />
            <p className="fl__hint">This device doesn't have a flashlight.</p>
          </div>
        )}

        {status === 'ready' && (
          <div className="fl__toggle-section">
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
          </div>
        )}

        {isNative && status === 'ready' && (
          <div className="fl__alerts">
            <h2 className="fl__alerts-title">Flash Alerts</h2>
            <p className="fl__alerts-subtitle">Blink the flash for things you might miss</p>

            <div className="fl__alert-row">
              <span className="fl__alert-info">
                <span className="fl__alert-name">Alarm</span>
                <span className="fl__alert-desc">Blinks while an Omni Hub alarm rings</span>
              </span>
              <button
                type="button"
                className={`fl__switch${alerts.alarmEnabled ? ' fl__switch--on' : ''}`}
                onClick={toggleAlarmAlert}
                aria-label="Toggle flash on alarm"
              >
                <span className="fl__switch-knob" />
              </button>
            </div>

            <div className="fl__alert-row">
              <span className="fl__alert-info">
                <span className="fl__alert-name">Incoming Calls</span>
                <span className="fl__alert-desc">
                  {callOn ? 'Blinks while your phone rings' : 'Needs phone-state permission'}
                </span>
              </span>
              <button
                type="button"
                className={`fl__switch${callOn ? ' fl__switch--on' : ''}`}
                onClick={toggleCallAlert}
                aria-label="Toggle flash on incoming call"
              >
                <span className="fl__switch-knob" />
              </button>
            </div>

            <div className="fl__alert-row">
              <span className="fl__alert-info">
                <span className="fl__alert-name">Notifications</span>
                <span className="fl__alert-desc">
                  {notificationOn ? 'Blinks for new notifications' : 'Needs notification access in Settings'}
                </span>
              </span>
              <button
                type="button"
                className={`fl__switch${notificationOn ? ' fl__switch--on' : ''}`}
                onClick={toggleNotificationAlert}
                aria-label="Toggle flash on notifications"
              >
                <span className="fl__switch-knob" />
              </button>
            </div>

            {!alerts.notificationAccessGranted && (
              <p className="fl__alerts-note">
                Notifications need "Notification access" granted in Android Settings — tapping the toggle opens it for
                you.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
