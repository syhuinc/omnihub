import type { DetailedHTMLProps, HTMLAttributes } from 'react';

// @google/model-viewer registers a <model-viewer> custom element but ships no
// React JSX typing of its own -- this covers just the attributes we actually use.
// React 19's "react-jsx" transform resolves IntrinsicElements through
// React.JSX rather than the bare global JSX namespace, so the augmentation
// has to target the "react" module's namespace, not `declare global`.
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        alt?: string;
        'camera-controls'?: boolean;
        'auto-rotate'?: boolean;
        'disable-zoom'?: boolean;
        'rotation-per-second'?: string;
        'shadow-intensity'?: string;
        'environment-image'?: string;
        exposure?: string;
        'camera-orbit'?: string;
        'field-of-view'?: string;
      };
    }
  }
}
