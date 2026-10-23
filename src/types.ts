export type MoodLevel   = 1 | 2 | 3 | 4 | 5;
export type EnergyLevel = 1 | 2 | 3 | 4 | 5;
export type Theme       = 'light' | 'dark' | 'auto';
export type TabId       = 'checkin' | 'journal' | 'insights' | 'care';

export interface CheckIn {
  id: string;
  date: string;   /* YYYY-MM-DD */
  mood: MoodLevel;
  energy: EnergyLevel;
  tags: string[];
  ts: number;
}

export interface Entry {
  id: string;
  ts: number;
  date: string;
  prompt: string;
  text: string;
  mood?: number;
  energy?: number;
  tags: string[];
}

export interface Action {
  id: string;
  date: string;
  suggestionKey: string;
  done: boolean;
}

export interface State {
  checkIns: CheckIn[];
  entries:  Entry[];
  actions:  Action[];
  theme:    Theme;
}

export interface Suggestion {
  key:         string;
  title:       string;
  why:         string;
  category:    'mood' | 'energy' | 'tag' | 'general';
  moodRange?:  [number, number];
  energyRange?:[number, number];
  targetTag?:  string;
}

export interface ToastMsg {
  id:      string;
  message: string;
  type?:   'success' | 'info' | 'alert';
}
