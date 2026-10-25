import type { Settings } from './settings';
import type { UserCarState } from './userState';

export interface BackupData {
  version: 1;
  exportedAt: string; // ISO timestamp
  settings: Settings;
  userState: UserCarState[];
}
