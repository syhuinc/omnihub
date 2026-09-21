import type { ReactNode } from 'react';
import { useRouter } from '../app/Router';
import './ToolOverlay.css';

interface ToolOverlayProps {
  variant: 'sheet' | 'modal';
  children: ReactNode;
}

export function ToolOverlay({ variant, children }: ToolOverlayProps) {
  const { back } = useRouter();

  return (
    <div className={`tool-overlay tool-overlay--${variant}`}>
      <div className="tool-overlay__backdrop" onClick={() => back()} />
      <div className={`tool-overlay__panel tool-overlay__panel--${variant}`}>
        {variant === 'sheet' && <div className="tool-overlay__handle" />}
        {children}
      </div>
    </div>
  );
}
