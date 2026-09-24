import { useEffect, useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { useRouter } from '../../app/Router';
import { DeviceStatsPlugin, type DeviceStats } from '../../device-stats/plugin';
import './PhoneCenter.css';

function formatGb(bytes: number): string {
  if (!bytes) return '—';
  return `${Math.round(bytes / 1024 ** 3)} GB`;
}

function statusFor(stats: DeviceStats | null): { tone: 'good' | 'warn'; text: string } {
  if (!stats) return { tone: 'good', text: 'Checking device…' };
  if (stats.batteryPercent >= 0 && stats.batteryPercent <= 15 && !stats.isCharging) {
    return { tone: 'warn', text: 'Battery is low' };
  }
  if (stats.storageTotalBytes > 0 && stats.storageFreeBytes / stats.storageTotalBytes < 0.1) {
    return { tone: 'warn', text: 'Storage is almost full' };
  }
  return { tone: 'good', text: 'Everything looks good' };
}

export function PhoneCenter() {
  const { back, navigate } = useRouter();
  const [stats, setStats] = useState<DeviceStats | null>(null);

  useEffect(() => {
    DeviceStatsPlugin.getStats()
      .then(setStats)
      .catch(() => {
        // native plugin unavailable — screen just stays in its loading/placeholder state
      });
  }, []);

  const status = statusFor(stats);
  const storageUsedPct = stats && stats.storageTotalBytes > 0
    ? Math.round(((stats.storageTotalBytes - stats.storageFreeBytes) / stats.storageTotalBytes) * 100)
    : 0;
  const ramUsedBytes = stats ? stats.ramTotalBytes - stats.ramAvailBytes : 0;
  const ramUsedPct = stats && stats.ramTotalBytes > 0 ? Math.round((ramUsedBytes / stats.ramTotalBytes) * 100) : 0;

  return (
    <div className="screen">
      <ScreenHeader title="Phone Center" onBack={back} />

      <div className="pc2__body">
        <div className="pc2__hero">
          <span className="pc2__hero-icon">
            <Icon name="smartphone" size={26} />
          </span>
          <div className="pc2__hero-text">
            <span>{stats?.manufacturer && stats.manufacturer !== 'Browser' ? stats.manufacturer : 'My Phone'}</span>
            <strong>{stats?.deviceModel ?? 'Your device'}</strong>
            <span className={`pc2__status pc2__status--${status.tone}`}>
              <span className="pc2__status-dot" />
              {status.text}
            </span>
          </div>
        </div>

        <div className="pc2__grid">
          <div className="pc2__card">
            <div className="pc2__card-head">
              <span className="pc2__card-icon pc2__card-icon--blue">
                <Icon name="battery" size={16} />
              </span>
              <span>Battery</span>
            </div>
            <strong className="pc2__card-value">{stats ? `${stats.batteryPercent}%` : '—'}</strong>
            <span className="pc2__card-sub">{stats?.isCharging ? 'Charging' : 'Not charging'}</span>
            <div className="pc2__bar">
              <div className="pc2__bar-fill" style={{ width: `${stats?.batteryPercent ?? 0}%` }} />
            </div>
            {!!stats?.batteryTempC && (
              <span className="pc2__card-foot">
                <Icon name="activity" size={12} />
                {stats.batteryTempC.toFixed(0)}°C
              </span>
            )}
          </div>

          <div className="pc2__card">
            <div className="pc2__card-head">
              <span className="pc2__card-icon pc2__card-icon--purple">
                <Icon name="database" size={16} />
              </span>
              <span>Storage</span>
            </div>
            <strong className="pc2__card-value">{stats ? formatGb(stats.storageFreeBytes) : '—'}</strong>
            <span className="pc2__card-sub">Free / {stats ? formatGb(stats.storageTotalBytes) : '—'}</span>
            <div className="pc2__bar">
              <div className="pc2__bar-fill pc2__bar-fill--purple" style={{ width: `${storageUsedPct}%` }} />
            </div>
          </div>

          <div className="pc2__card">
            <div className="pc2__card-head">
              <span className="pc2__card-icon pc2__card-icon--orange">
                <Icon name="cpu" size={16} />
              </span>
              <span>Memory (RAM)</span>
            </div>
            <strong className="pc2__card-value">{stats ? formatGb(stats.ramTotalBytes) : '—'}</strong>
            <span className="pc2__card-sub">Total RAM</span>
            <div className="pc2__bar">
              <div className="pc2__bar-fill pc2__bar-fill--orange" style={{ width: `${ramUsedPct}%` }} />
            </div>
            {!!stats?.ramAvailBytes && (
              <span className="pc2__card-foot">{formatGb(ramUsedBytes)} used · {formatGb(stats.ramAvailBytes)} free</span>
            )}
          </div>

          <div className="pc2__card">
            <div className="pc2__card-head">
              <span className="pc2__card-icon pc2__card-icon--green">
                <Icon name="wifi" size={16} />
              </span>
              <span>Connection</span>
            </div>
            <strong className="pc2__card-value">{stats?.wifiConnected ? 'Wi-Fi' : 'Off'}</strong>
            <span className="pc2__card-sub">{stats?.wifiConnected ? 'Connected' : 'Not connected'}</span>
            {!!stats?.ipAddress && <span className="pc2__card-foot">{stats.ipAddress}</span>}
            {!!(stats?.wifiRxMbps || stats?.wifiTxMbps) && (
              <span className="pc2__card-foot">
                ↓{stats.wifiRxMbps} · ↑{stats.wifiTxMbps} Mbps
              </span>
            )}
          </div>
        </div>

        <button type="button" className="pc2__row" onClick={() => navigate('/device-info')}>
          <span className="pc2__row-icon">
            <Icon name="info" size={18} />
          </span>
          <span className="pc2__row-text">
            <strong>Device Information</strong>
            <span>OS version, build, screen, chip and more</span>
          </span>
          <Icon name="chevron-right" size={18} className="pc2__row-chevron" />
        </button>
      </div>
    </div>
  );
}
