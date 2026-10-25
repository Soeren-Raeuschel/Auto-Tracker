/**
 * T5.1: Typen fuer das `<model-viewer>` Custom Element von @google/model-viewer.
 * Auf die Attribute beschraenkt, die T5.3 braucht (drehen/zoomen/Hotspots).
 * Das Element selbst wird zur Laufzeit per dynamischem import() registriert,
 * hier geht es nur um die JSX-Typen fuer den Compiler.
 */
import type { HTMLAttributes } from 'react';

/** Attribut-Auswahl von <model-viewer> (https://modelviewer.dev), kebab-case. */
export interface ModelViewerAttributes extends HTMLAttributes<HTMLElement> {
  src?: string;
  alt?: string;
  'camera-controls'?: boolean | string;
  'auto-rotate'?: boolean | string;
  'rotation-per-second'?: string;
  'camera-orbit'?: string;
  'field-of-view'?: string;
  'shadow-intensity'?: number | string;
  'environment-image'?: string;
  'hotspot-visibility'?: string;
  ar?: boolean | string;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerAttributes;
    }
  }
}
