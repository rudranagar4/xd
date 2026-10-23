import { CheckIn, Suggestion } from '../types';
import { SUGGESTIONS_CATALOG } from '../constants';

export function calculateStreak(checkIns: CheckIn[]): number {
  if (!checkIns || checkIns.length === 0) return 0;

  // Extract unique sorted date strings descending
  const uniqueDates = Array.from(new Set(checkIns.map((c) => c.date))).sort().reverse();
  if (uniqueDates.length === 0) return 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // If latest checkin is neither today nor yesterday, streak is broken
  const latest = uniqueDates[0];
  if (latest !== todayStr && latest !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  let cursor = new Date(latest);

  for (const dateStr of uniqueDates) {
    const curStr = cursor.toISOString().split('T')[0];
    if (dateStr === curStr) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function computeAverages(checkIns: CheckIn[]): { avgMood: number; avgEnergy: number; total: number } {
  if (!checkIns || checkIns.length === 0) {
    return { avgMood: 0, avgEnergy: 0, total: 0 };
  }
  const total = checkIns.length;
  const moodSum = checkIns.reduce((sum, c) => sum + c.mood, 0);
  const energySum = checkIns.reduce((sum, c) => sum + c.energy, 0);

  return {
    avgMood: Number((moodSum / total).toFixed(1)),
    avgEnergy: Number((energySum / total).toFixed(1)),
    total,
  };
}

export interface TagInsight {
  tag: string;
  count: number;
  avgMoodWith: number;
  avgMoodWithout: number;
  moodDiff: number;
}

export function computeTagInsights(checkIns: CheckIn[]): TagInsight[] {
  if (!checkIns || checkIns.length < 2) return [];

  const allTags = new Set<string>();
  checkIns.forEach((c) => c.tags.forEach((t) => allTags.add(t)));

  const insights: TagInsight[] = [];

  allTags.forEach((tag) => {
    const withTag = checkIns.filter((c) => c.tags.includes(tag));
    const withoutTag = checkIns.filter((c) => !c.tags.includes(tag));

    if (withTag.length === 0 || withoutTag.length === 0) return;

    const avgWith = withTag.reduce((acc, c) => acc + c.mood, 0) / withTag.length;
    const avgWithout = withoutTag.reduce((acc, c) => acc + c.mood, 0) / withoutTag.length;
    const diff = Number((avgWith - avgWithout).toFixed(1));

    insights.push({
      tag,
      count: withTag.length,
      avgMoodWith: Number(avgWith.toFixed(1)),
      avgMoodWithout: Number(avgWithout.toFixed(1)),
      moodDiff: diff,
    });
  });

  return insights.sort((a, b) => Math.abs(b.moodDiff) - Math.abs(a.moodDiff));
}

export function getRecommendedSuggestions(checkIns: CheckIn[]): Suggestion[] {
  const recent = checkIns.slice(-5);
  const tagsCount: Record<string, number> = {};

  let sumMood = 0;
  let sumEnergy = 0;

  recent.forEach((c) => {
    sumMood += c.mood;
    sumEnergy += c.energy;
    c.tags.forEach((t) => {
      tagsCount[t] = (tagsCount[t] || 0) + 1;
    });
  });

  const avgMood = recent.length ? sumMood / recent.length : 3;
  const avgEnergy = recent.length ? sumEnergy / recent.length : 3;

  const topTags = Object.entries(tagsCount)
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => t);

  const matched: Suggestion[] = [];

  // Match based on tag
  for (const tag of topTags) {
    const s = SUGGESTIONS_CATALOG.find((item) => item.targetTag === tag);
    if (s && !matched.some((m) => m.key === s.key)) {
      matched.push(s);
    }
  }

  // Match based on low energy
  if (avgEnergy <= 2.5) {
    const s = SUGGESTIONS_CATALOG.find((item) => item.category === 'energy');
    if (s && !matched.some((m) => m.key === s.key)) matched.push(s);
  }

  // Match based on low mood
  if (avgMood <= 3.0) {
    const s = SUGGESTIONS_CATALOG.find((item) => item.category === 'mood');
    if (s && !matched.some((m) => m.key === s.key)) matched.push(s);
  }

  // Fill up to 4 suggestions with general ones
  for (const s of SUGGESTIONS_CATALOG) {
    if (matched.length >= 4) break;
    if (!matched.some((m) => m.key === s.key)) {
      matched.push(s);
    }
  }

  return matched;
}

export function formatDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' });
}
