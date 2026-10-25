import type { ReactNode } from 'react';
import './PrimaryButton.css';

/** Primärer Pillen-Button. Echtes button-Element, mindestens 44 px Trefferfläche. */
export function PrimaryButton({
  children,
  onClick,
  type = 'button',
  disabled,
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type={type}
      className="primary-button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
