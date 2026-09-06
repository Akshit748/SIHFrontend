import type { AppState } from '../types';

export type StateUpdate = {
  robot?: Partial<AppState['robot']>;
  mission?: Partial<AppState['mission']>;
  map?: Partial<AppState['map']>;
  perception?: Partial<AppState['perception']>;
  health?: Partial<AppState['health']>;
  timeline?: AppState['timeline'];
  dataSource?: AppState['dataSource'];
};

export interface DataBridge {
  subscribe(onUpdate: (update: StateUpdate) => void): () => void;

  sendGoal?(x: number, y: number): void;

  cancelNavigation?(): void;
}