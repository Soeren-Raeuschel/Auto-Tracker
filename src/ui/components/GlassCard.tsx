import type { ReactNode } from 'react';
import './GlassCard.css';

/** Glasfläche als Grundcontainer. Reines Rendering, keine Logik. */
export function GlassCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className ? `glass ${className}` : 'glass'}>{children}</div>;
}
