import type { ReactNode } from 'react';
import { useRouter } from '../app/Router';
import './ToolOverlay.css';

export function ToolOverlay({ children }: { children: ReactNode }) {
  const { back } = useRouter();

  return (
    <div className="tool-overlay">
      <div className="tool-overlay__backdrop" onClick={() => back()} />
      <div className="tool-overlay__panel">
        <div className="tool-overlay__handle" />
        {children}
      </div>
    </div>
  );
}
