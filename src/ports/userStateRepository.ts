import type { UserCarState } from '../domain/userState';

export interface UserStateRepository {
  list(): Promise<UserCarState[]>;
  save(state: UserCarState): Promise<void>;
  remove(carId: string): Promise<void>;
}
