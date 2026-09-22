import { useEffect, useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { AlarmPlugin } from '../../alarm/plugin';
import { hapticSelect, hapticWarning } from '../../haptics';
import { useBackHandler } from '../../app/useBackHandler';

interface CrashLogViewProps {
  onClose: () => void;
}

export function CrashLogView({ onClose }: CrashLogViewProps) {
  const [log, setLog] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useBackHandler(onClose, true);

  async function refresh() {
    setLoading(true);
    const { log: text } = await AlarmPlugin.getCrashLog();
    setLog(text);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCopy() {
    hapticSelect();
    try {
      await navigator.clipboard.writeText(log);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard may be unavailable; nothing else to do
    }
  }

  async function handleClear() {
    hapticWarning();
    await AlarmPlugin.clearCrashLog();
    refresh();
  }

  return (
    <div className="screen">
      <ScreenHeader title="Crash Log" subtitle="Diagnostic info for the Alarm feature" onBack={onClose} />
      <div className="alarm__content">
        {loading ? null : log ? (
          <>
            <pre className="alarm__crash-log">{log}</pre>
            <div className="alarm__crash-actions">
              <button type="button" className="alarm__crash-btn" onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button type="button" className="alarm__crash-btn alarm__crash-btn--danger" onClick={handleClear}>
                Clear
              </button>
            </div>
          </>
        ) : (
          <p className="alarm__empty">No crashes recorded.</p>
        )}
      </div>
    </div>
  );
}
