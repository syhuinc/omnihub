import { useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon, type IconName } from '../../components/Icon';
import { useBackHandler } from '../../app/useBackHandler';
import type { TimeCategory } from '../../alarm/types';
import { loadCategoryDefaults, setCategoryDefault, type CategoryDefaultSounds } from '../../alarm/ringtones';
import { RingtonePicker } from './RingtonePicker';
import './RingtonePicker.css';

const CATEGORIES: { id: TimeCategory; label: string; icon: IconName }[] = [
  { id: 'morning', label: 'Morning', icon: 'sunrise' },
  { id: 'afternoon', label: 'Afternoon', icon: 'sun' },
  { id: 'evening', label: 'Evening', icon: 'sunset' },
  { id: 'night', label: 'Night', icon: 'moon' },
];

interface CategoryDefaultsScreenProps {
  onClose: () => void;
}

export function CategoryDefaultsScreen({ onClose }: CategoryDefaultsScreenProps) {
  const [defaults, setDefaults] = useState<CategoryDefaultSounds>(loadCategoryDefaults());
  const [editingCategory, setEditingCategory] = useState<TimeCategory | null>(null);

  useBackHandler(() => {
    if (editingCategory) {
      setEditingCategory(null);
    } else {
      onClose();
    }
  }, true);

  function handleClearDefault(category: TimeCategory) {
    setDefaults(setCategoryDefault(category, null));
  }

  if (editingCategory) {
    return (
      <RingtonePicker
        mode="setDefault"
        category={editingCategory}
        onClose={() => setEditingCategory(null)}
        onSelect={() => {
          setDefaults(loadCategoryDefaults());
          setEditingCategory(null);
        }}
      />
    );
  }

  return (
    <div className="screen">
      <ScreenHeader
        title="Default Sounds"
        subtitle="Auto-applied when you quick-pick a time of day"
        onBack={onClose}
      />
      <div className="ringtone-picker__content">
        <ul className="ringtone-picker__list">
          {CATEGORIES.map((cat) => (
            <li key={cat.id}>
              <div className="ringtone-picker__default-row">
                <button
                  type="button"
                  className="ringtone-picker__default-main"
                  onClick={() => setEditingCategory(cat.id)}
                >
                  <Icon name={cat.icon} size={20} />
                  <span className="ringtone-picker__default-text">
                    <span>{cat.label}</span>
                    <span className="ringtone-picker__default-sound">
                      {defaults[cat.id]?.name || 'App default'}
                    </span>
                  </span>
                  <Icon name="chevron-right" size={18} />
                </button>
                {defaults[cat.id] && (
                  <button
                    type="button"
                    className="ringtone-picker__default-clear"
                    onClick={() => handleClearDefault(cat.id)}
                    aria-label={`Clear ${cat.label} default`}
                  >
                    <Icon name="x" size={14} strokeWidth={3} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
