import { useLocation } from 'react-router-dom';
import { toAppShellViewModel, type NavItemVM } from './appShellViewModel';

/** ViewModel-Hook fuer die Shell (T10.3): aktiver Nav-Eintrag aus der aktuellen Route. */
export function useAppShellViewModel(): NavItemVM[] {
  const { pathname } = useLocation();
  return toAppShellViewModel(pathname);
}
