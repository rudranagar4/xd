import { MoodLevel, EnergyLevel, Suggestion, State, CheckIn } from './types';

/* ── Mood / Energy config ─────────────────────────────────── */
export const MOOD_COLORS: Record<MoodLevel, string> = {
  1: '#B7AAD0',
  2: '#C9C0B5',
  3: '#D9D3A7',
  4: '#B5C7A8',
  5: '#8FA98B',
};

export const MOOD_CONFIG: Record<MoodLevel, { label: string; emoji: string }> = {
  1: { label: 'Low',   emoji: '😔' },
  2: { label: 'Meh',   emoji: '😕' },
  3: { label: 'Okay',  emoji: '😐' },
  4: { label: 'Good',  emoji: '🙂' },
  5: { label: 'Great', emoji: '😄' },
};

export const ENERGY_CONFIG: Record<EnergyLevel, { label: string; symbol: string; color: string }> = {
  1: { label: 'Drained', symbol: '🪫', color: '#B7AAD0' },
  2: { label: 'Low',     symbol: '🔋', color: '#C9C0B5' },
  3: { label: 'Steady',  symbol: '⚡', color: '#D9D3A7' },
  4: { label: 'Charged', symbol: '✨', color: '#B5C7A8' },
  5: { label: 'Buzzing', symbol: '🔥', color: '#8FA98B' },
};

export const DEFAULT_TAGS = ['Sleep', 'Work or study', 'Family', 'Friends', 'Health', 'Money'] as const;

/* ── Mood-aware journal prompts ───────────────────────────── */
export function getMoodPrompts(mood?: MoodLevel): string[] {
  if (!mood || mood <= 2) {
    return [
      'What is taking up space in your mind right now?',
      'What would you say to a friend feeling like you do?',
      'What is one thing you need right now, even if it feels small?',
      'What would make today just 1% easier?',
    ];
  }
  if (mood === 3) {
    return [
      'Describe today in three words, then say why.',
      'What do you need more of this week?',
      'What is quietly going well that you have not noticed?',
      'What would you like to do differently tomorrow?',
    ];
  }
  return [
    'What felt lighter today?',
    'What are you proud of that nobody saw?',
    'What helped you feel this way — and how can you do more of it?',
    'What do you want to remember about today?',
  ];
}

/* ── Suggestion catalog ───────────────────────────────────── */
export const SUGGESTIONS_CATALOG: Suggestion[] = [
  // Low mood
  { key: 'hydration',       title: 'Drink a big glass of water',               why: 'Dehydration quietly worsens mood and focus.',                       category: 'mood',   moodRange: [1,2] },
  { key: 'five-outside',    title: '5 minutes outside or near a window',        why: 'Natural light resets cortisol and lifts mood quickly.',             category: 'mood',   moodRange: [1,2] },
  { key: 'message-someone', title: 'Send one honest message to someone you trust', why: 'Connection is the fastest antidote to heaviness.',               category: 'mood',   moodRange: [1,2] },
  // Low energy
  { key: 'rest-20',         title: '20-minute rest (no screen)',                why: 'A brief non-sleep rest recovers alertness without grogginess.',      category: 'energy', energyRange: [1,2] },
  { key: 'protein-snack',   title: 'Have a protein-rich snack',                 why: 'Blood sugar stability directly sustains mental energy.',             category: 'energy', energyRange: [1,2] },
  { key: 'tiny-task',       title: 'Pick one tiny task and finish it',          why: 'A small win builds momentum even when energy is low.',               category: 'energy', energyRange: [1,2] },
  // Okay
  { key: 'stretch-2',      title: '2-minute neck and shoulder stretch',        why: 'Releasing tension breaks the monotony and refreshes focus.',         category: 'mood',   moodRange: [3,3] },
  { key: 'tomorrow-1',     title: 'Write one priority for tomorrow',           why: 'Externalising plans frees mental bandwidth tonight.',                category: 'mood',   moodRange: [3,3] },
  // Good / Great
  { key: 'build-on-it',    title: 'Note what made today good',                 why: 'Naming the good helps you repeat it intentionally.',                 category: 'mood',   moodRange: [4,5] },
  { key: 'share-it',       title: 'Share a kind thought with someone today',   why: 'Giving lifts the giver as much as the receiver.',                    category: 'mood',   moodRange: [4,5] },
  // Tag-aware
  { key: 'wind-down',      title: 'Start a 20-min wind-down routine',         why: 'A consistent pre-sleep ritual deepens sleep quality.',               category: 'tag',    targetTag: 'Sleep' },
  { key: 'pomodoro',       title: '25-minute focused work, then a break',     why: 'The Pomodoro method prevents burnout and improves output.',          category: 'tag',    targetTag: 'Work or study' },
  { key: 'reach-friends',  title: 'Plan something small with a friend',       why: 'Anticipation of social events boosts mood in the short term.',       category: 'tag',    targetTag: 'Friends' },
  { key: 'reach-family',   title: 'Call or text a family member today',       why: 'Regular contact with family strengthens your sense of belonging.',   category: 'tag',    targetTag: 'Family' },
  { key: 'body-check',     title: 'Do a gentle 3-minute body scan',           why: 'Physical awareness reduces stress hormones and grounds you.',        category: 'tag',    targetTag: 'Health' },
  { key: 'money-note',     title: 'Write down one money worry — no solving',  why: 'Externalising worry stops it looping in your head.',                 category: 'tag',    targetTag: 'Money' },
  // General fallback
  { key: 'box-breathing',  title: '4-4-4-4 Box Breathing',                    why: 'Regulates the nervous system in 2 minutes.',                        category: 'general' },
  { key: 'gratitude-3',    title: 'Notice 3 tiny things that went okay',       why: 'Retrains attention toward resilience and safety.',                  category: 'general' },
];

export function getRecommendedSuggestions(checkIns: CheckIn[]): Suggestion[] {
  const recent = checkIns.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
  const latest = recent[0];

  if (!latest) {
    return SUGGESTIONS_CATALOG.filter(s => s.category === 'general').slice(0, 3);
  }

  const { mood, energy, tags } = latest;
  const matched: Suggestion[] = [];
  const addIfAbsent = (s: Suggestion) => { if (!matched.find(m => m.key === s.key)) matched.push(s); };

  // Tag-aware first
  tags.forEach(tag => {
    const s = SUGGESTIONS_CATALOG.find(item => item.targetTag === tag);
    if (s) addIfAbsent(s);
  });

  // Mood-range
  SUGGESTIONS_CATALOG.filter(s => s.moodRange && mood >= s.moodRange[0] && mood <= s.moodRange[1])
    .slice(0, 2).forEach(addIfAbsent);

  // Energy-range
  SUGGESTIONS_CATALOG.filter(s => s.energyRange && energy >= s.energyRange[0] && energy <= s.energyRange[1])
    .slice(0, 1).forEach(addIfAbsent);

  // Fill up to 5 with generals
  SUGGESTIONS_CATALOG.filter(s => s.category === 'general').forEach(s => {
    if (matched.length < 5) addIfAbsent(s);
  });

  return matched.slice(0, 5);
}

/* ── Analytics helpers ────────────────────────────────────── */
export function calculateStreak(checkIns: CheckIn[]): number {
  if (!checkIns.length) return 0;
  const dates = Array.from(new Set(checkIns.map(c => c.date))).sort().reverse();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = (() => { const d = new Date(); d.setDate(d.getDate()-1); return d.toISOString().split('T')[0]; })();
  if (dates[0] !== today && dates[0] !== yesterday) return 0;
  let streak = 0;
  let cursor = new Date(dates[0]);
  for (const d of dates) {
    if (d === cursor.toISOString().split('T')[0]) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else break;
  }
  return streak;
}

export function computeAvg(checkIns: CheckIn[], field: 'mood' | 'energy'): number {
  if (!checkIns.length) return 0;
  return Number((checkIns.reduce((s, c) => s + c[field], 0) / checkIns.length).toFixed(1));
}

export function checkEscalation(checkIns: CheckIn[]): boolean {
  const sorted = checkIns.slice().sort((a, b) => b.date.localeCompare(a.date));
  if (sorted.length < 3) return false;
  return sorted[0].mood <= 2 && sorted[1].mood <= 2 && sorted[2].mood <= 2;
}

export function generateInsightSentences(checkIns: CheckIn[], entries: { mood?: number; date: string }[]): string[] {
  if (checkIns.length < 3) return [];
  const sentences: string[] = [];

  // Trend
  const recent = checkIns.slice().sort((a, b) => a.date.localeCompare(b.date)).slice(-5);
  if (recent.length >= 3) {
    const first2avg = (recent[0].mood + recent[1].mood) / 2;
    const last2avg = (recent[recent.length-2].mood + recent[recent.length-1].mood) / 2;
    if (last2avg - first2avg >= 0.5) sentences.push('📈 Your mood has been climbing over the last few days.');
    else if (first2avg - last2avg >= 0.5) sentences.push('📉 Your mood has dipped a bit recently. Be extra gentle with yourself.');
    else sentences.push('〰️ Your mood has been fairly steady lately.');
  }

  // Best weekday
  const weekdayMoods: Record<number, number[]> = {};
  checkIns.forEach(c => {
    const d = new Date(c.date); const day = d.getDay();
    if (!weekdayMoods[day]) weekdayMoods[day] = [];
    weekdayMoods[day].push(c.mood);
  });
  const weekdayAvgs = Object.entries(weekdayMoods)
    .map(([d, moods]) => ({ day: Number(d), avg: moods.reduce((a,b)=>a+b,0)/moods.length }))
    .sort((a, b) => b.avg - a.avg);
  if (weekdayAvgs.length > 0) {
    const names = ['Sundays','Mondays','Tuesdays','Wednesdays','Thursdays','Fridays','Saturdays'];
    sentences.push(`📅 ${names[weekdayAvgs[0].day]} tend to be your best day.`);
  }

  // Energy-mood link
  const moodArr = checkIns.map(c => c.mood);
  const energyArr = checkIns.map(c => c.energy);
  const moodMean = moodArr.reduce((a,b)=>a+b,0)/moodArr.length;
  const energyMean = energyArr.reduce((a,b)=>a+b,0)/energyArr.length;
  let num = 0, d1 = 0, d2 = 0;
  for (let i=0; i<moodArr.length; i++) {
    num += (moodArr[i]-moodMean) * (energyArr[i]-energyMean);
    d1  += (moodArr[i]-moodMean)**2;
    d2  += (energyArr[i]-energyMean)**2;
  }
  const corr = d1 && d2 ? num / Math.sqrt(d1*d2) : 0;
  if (corr > 0.5)  sentences.push('🔗 Your energy and mood tend to move together.');
  if (corr < -0.3) sentences.push('🔗 Interestingly, your energy and mood sometimes move in opposite directions.');

  // Tag effect
  const overallAvgMood = moodMean;
  const tagsSeen = Array.from(new Set(checkIns.flatMap(c => c.tags)));
  tagsSeen.forEach(tag => {
    const withTag = checkIns.filter(c => c.tags.includes(tag));
    if (withTag.length < 2) return;
    const tagAvg = withTag.reduce((s,c)=>s+c.mood,0)/withTag.length;
    const diff = Number((tagAvg - overallAvgMood).toFixed(1));
    if (Math.abs(diff) >= 0.5) {
      const dir = diff > 0 ? 'higher' : 'lower';
      sentences.push(`🏷️ Days tagged "${tag}" average a mood of ${tagAvg.toFixed(1)}, ${dir} than your overall ${overallAvgMood.toFixed(1)}.`);
    }
  });

  // Journal link
  const lowMoodDates = new Set(checkIns.filter(c => c.mood <= 2).map(c => c.date));
  const highMoodDates = new Set(checkIns.filter(c => c.mood >= 4).map(c => c.date));
  const journalOnLow  = entries.filter(e => lowMoodDates.has(e.date)).length;
  const journalOnHigh = entries.filter(e => highMoodDates.has(e.date)).length;
  if (lowMoodDates.size > 0 && highMoodDates.size > 0) {
    const lowRate  = journalOnLow  / lowMoodDates.size;
    const highRate = journalOnHigh / highMoodDates.size;
    if (lowRate > highRate + 0.2) sentences.push('📝 You tend to write more on days your mood is low.');
    else if (highRate > lowRate + 0.2) sentences.push('📝 You tend to write more on your good days.');
  }

  return sentences;
}

/* ── Sample data for demo ─────────────────────────────────── */
export function buildSampleState(): State {
  const today = new Date();
  const checkIns: CheckIn[] = [];
  const entries: import('./types').Entry[] = [];
  const actions: import('./types').Action[] = [];

  const moodSeq:   MoodLevel[]  = [3, 4, 3, 2, 2, 4, 5];
  const energySeq: EnergyLevel[] = [2, 3, 4, 2, 3, 4, 4];
  const tagsSeq = [
    ['Sleep', 'Health'],
    ['Work or study', 'Friends'],
    ['Family', 'Sleep'],
    ['Work or study', 'Money'],
    ['Health', 'Sleep'],
    ['Sleep', 'Family'],
    ['Health', 'Friends', 'Sleep'],
  ];

  const prompts = [
    'What do you need more of this week?',
    'What are you proud of that nobody saw?',
    'Describe today in three words, then say why.',
    'What is taking up space in your mind right now?',
    'What would you say to a friend feeling like you do?',
    'What felt lighter today?',
    'What helped you feel this way — and how can you do more of it?',
  ];

  const texts = [
    'Needed a quieter evening to reset after long screen hours.',
    'Helped a teammate debug their tricky issue and stayed patient throughout.',
    'Busy, steady, calm. Enjoyed chai with family in the late evening.',
    'Woke up groggy and feeling low on sleep. Taking it one deliberate step at a time.',
    'Told myself that rest is not earned, it is required. Took a 20 min power nap.',
    'Morning run in the park felt crisp and invigorating. Felt genuine mental clarity.',
    'Deep restorative 8-hour sleep. Had brunch with close friends and laughed a lot.',
  ];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const idx = 6 - i;
    const ts = d.getTime();

    checkIns.push({
      id: `demo-ci-${i}`,
      date: dateStr,
      mood: moodSeq[idx],
      energy: energySeq[idx],
      tags: tagsSeq[idx],
      ts,
    });

    entries.push({
      id: `demo-entry-${i}`,
      date: dateStr,
      prompt: prompts[idx],
      text: texts[idx],
      mood: moodSeq[idx],
      energy: energySeq[idx],
      tags: tagsSeq[idx],
      ts: ts + 1000 * 60 * 30, // 30 mins after check-in
    });

    if (i % 2 === 0) {
      actions.push({
        id: `demo-act-${i}`,
        date: dateStr,
        suggestionKey: i === 0 ? 'wind-down' : i === 2 ? 'hydration' : 'five-outside',
        done: true,
      });
    }
  }

  return { checkIns, entries, actions, theme: 'auto' };
}

export const getSampleInitialData = buildSampleState;
