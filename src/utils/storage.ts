import { State } from '../types';
import { buildSampleState } from '../constants';

const KEY = 'wellness_pulse_v2';

export function loadState(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return buildSampleState();
    const p = JSON.parse(raw);
    return {
      checkIns: Array.isArray(p.checkIns) ? p.checkIns : [],
      entries:  Array.isArray(p.entries)  ? p.entries  : [],
      actions:  Array.isArray(p.actions)  ? p.actions  : [],
      theme:    p.theme || 'auto',
    };
  } catch {
    return buildSampleState();
  }
}

export function saveState(s: State): void {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* quota */ }
}

export function clearState(): State {
  const empty: State = { checkIns:[], entries:[], actions:[], theme:'auto' };
  saveState(empty);
  return empty;
}

export function exportJson(s: State): void {
  const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `wellness-pulse-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Aliases for compatibility
export const clearStoredState = clearState;
export const exportStateToJson = exportJson;
