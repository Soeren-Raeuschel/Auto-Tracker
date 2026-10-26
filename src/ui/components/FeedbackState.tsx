import { Icon, type IconName } from './Icon';
import './FeedbackState.css';

/** Zustaende (T8.3): Fehler (mit --danger), Ladeanzeige, Leerzustand. */
export type FeedbackStateKind = 'error' | 'loading' | 'empty';

const ICONS: Record<FeedbackStateKind, IconName> = {
  error: 'alert',
  loading: 'loader',
  empty: 'inbox',
};

interface FeedbackStateProps {
  kind: FeedbackStateKind;
  message: string;
}

/** Rendert nur: Icon + Text, Fehler bekommt role="alert". */
export function FeedbackState({ kind, message }: FeedbackStateProps) {
  return (
    <div className="feedback-state" data-kind={kind} role={kind === 'error' ? 'alert' : undefined}>
      <Icon name={ICONS[kind]} size={22} />
      <p>{message}</p>
    </div>
  );
}
