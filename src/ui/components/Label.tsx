import type { ReactNode } from 'react';
import './Label.css';

/** Kleines, großgeschriebenes Beschriftungs-Label (siehe DESIGN.md Typografie). */
export function Label({ children }: { children: ReactNode }) {
  return <span className="label">{children}</span>;
}
