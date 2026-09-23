import { useState, type CSSProperties } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { hapticSelect } from '../../haptics';
import type { SleepModeConfig, RelationshipStatus } from '../../sleep-mode/plugin';
import { RELATIONSHIP_OPTIONS } from './types';
import './SleepMode.css';

interface PersonalizationScreenProps {
  config: SleepModeConfig;
  onBack: () => void;
  onPersist: (next: SleepModeConfig) => void;
}

type FieldKey = 'name' | 'relationship' | 'routine' | 'interests' | 'notes';

const RELATIONSHIP_LABEL: Record<string, string> = Object.fromEntries(
  RELATIONSHIP_OPTIONS.map((r) => [r.id, r.label]),
);

export function PersonalizationScreen({ config, onBack, onPersist }: PersonalizationScreenProps) {
  const [editingField, setEditingField] = useState<FieldKey | null>(null);
  const [draft, setDraft] = useState('');

  function selectMode(mode: 'normal' | 'personal') {
    hapticSelect();
    onPersist({ ...config, mode });
  }

  function openEditor(field: FieldKey, currentValue: string) {
    hapticSelect();
    setDraft(currentValue);
    setEditingField(field);
  }

  function saveDraft() {
    if (editingField === 'name') onPersist({ ...config, callName: draft.trim() || null });
    if (editingField === 'routine') onPersist({ ...config, workSchoolRoutine: draft.trim() || null });
    if (editingField === 'interests') onPersist({ ...config, interests: draft.trim() || null });
    if (editingField === 'notes') onPersist({ ...config, customNotes: draft.trim() || null });
    setEditingField(null);
  }

  function selectRelationship(id: RelationshipStatus) {
    hapticSelect();
    onPersist({ ...config, relationshipStatus: config.relationshipStatus === id ? null : id });
    setEditingField(null);
  }

  const rows: { key: FieldKey; icon: string; label: string; value: string; color: string }[] = [
    { key: 'name', icon: 'user', label: 'Your name / nickname', value: config.callName || 'Not set', color: 'var(--blue)' },
    {
      key: 'relationship',
      icon: 'heart',
      label: 'Relationship status',
      value: config.relationshipStatus ? RELATIONSHIP_LABEL[config.relationshipStatus] : 'Not set',
      color: 'var(--pink)',
    },
    { key: 'routine', icon: 'calendar', label: 'Work / School routine', value: config.workSchoolRoutine || 'Not set', color: 'var(--teal)' },
    { key: 'interests', icon: 'star', label: 'Interests', value: config.interests || 'Not set', color: 'var(--purple)' },
    { key: 'notes', icon: 'edit', label: 'Custom notes', value: config.customNotes || 'Not set', color: 'var(--orange)' },
  ];

  return (
    <div className="screen">
      <ScreenHeader title="Personalization" subtitle="Make your sleep companion more you" onBack={onBack} />

      <div className="sm__body">
        <div className="sm__mode-cards">
          <button
            type="button"
            className={`sm__mode-card${config.mode === 'normal' ? ' sm__mode-card--active' : ''}`}
            onClick={() => selectMode('normal')}
          >
            <span className="sm__mode-card-icon">
              <Icon name="clock" size={18} />
            </span>
            <strong>Normal</strong>
            <span>General reminders</span>
          </button>
          <button
            type="button"
            className={`sm__mode-card${config.mode === 'personal' ? ' sm__mode-card--active' : ''}`}
            onClick={() => selectMode('personal')}
          >
            <span className="sm__mode-card-icon">
              <Icon name="user" size={18} />
            </span>
            <strong>Personal</strong>
            <span>Uses your information for a more personal experience</span>
          </button>
        </div>

        {config.mode === 'personal' && (
          <>
            <div className="sm__section-header">
              <h2>Tell us about you (optional)</h2>
              <span className={`sm__badge sm__badge--pro`}>PRO</span>
            </div>

            <div className="sm__field-list">
              {rows.map((row) => (
                <button
                  key={row.key}
                  type="button"
                  className="sm__field-row2"
                  onClick={() => openEditor(row.key, row.value === 'Not set' ? '' : row.value)}
                >
                  <span className="sm__field-row2-icon" style={{ '--field-color': row.color } as CSSProperties}>
                    <Icon name={row.icon as never} size={16} />
                  </span>
                  <span className="sm__field-row2-text">
                    <strong>{row.label}</strong>
                    <span>{row.value}</span>
                  </span>
                  <Icon name="chevron-right" size={16} className="sm__time-chevron" />
                </button>
              ))}

              <div className="sm__field-row2 sm__field-row2--static">
                <span className="sm__field-row2-icon" style={{ '--field-color': 'var(--blue)' } as CSSProperties}>
                  <Icon name="volume" size={16} />
                </span>
                <span className="sm__field-row2-text">
                  <strong>Reminder tone</strong>
                  <span>Use my personality</span>
                </span>
              </div>
            </div>

            <p className="sm__pro-note">
              Interests get woven into some reminders. Custom notes are saved for a future Sleep
              Mode AI pass and don't change reminders yet — everything here is optional and
              genuinely usable today, no Pro purchase required.
            </p>
          </>
        )}
      </div>

      {editingField && editingField !== 'relationship' && (
        <div className="sm__sheet" onClick={() => setEditingField(null)}>
          <div className="sm__sheet-content" onClick={(e) => e.stopPropagation()}>
            <h2>{rows.find((r) => r.key === editingField)?.label}</h2>
            <input
              type="text"
              className="sm__sheet-input"
              placeholder="Optional"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={80}
              autoFocus
            />
            <button type="button" className="sm__sheet-close" onClick={saveDraft}>
              Save
            </button>
          </div>
        </div>
      )}

      {editingField === 'relationship' && (
        <div className="sm__sheet" onClick={() => setEditingField(null)}>
          <div className="sm__sheet-content" onClick={(e) => e.stopPropagation()}>
            <h2>Relationship status</h2>
            <div className="sm__chip-row sm__chip-row--wrap">
              {RELATIONSHIP_OPTIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`sm__chip${config.relationshipStatus === r.id ? ' sm__chip--active' : ''}`}
                  onClick={() => selectRelationship(r.id)}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button type="button" className="sm__sheet-close" onClick={() => setEditingField(null)}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
