import type { ReactNode } from 'react';
import { Icon } from './Icon';
import './ScreenHeader.css';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: ReactNode;
}

export function ScreenHeader({ title, subtitle, onBack, action }: ScreenHeaderProps) {
  return (
    <header className="screen-header">
      <div className="screen-header__row">
        {onBack && (
          <button type="button" className="screen-header__back" onClick={onBack} aria-label="Back">
            <Icon name="back" size={22} />
          </button>
        )}
        <div className="screen-header__titles">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action && <div className="screen-header__action">{action}</div>}
      </div>
    </header>
  );
}
