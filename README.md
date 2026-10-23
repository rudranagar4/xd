# Wellness Pulse 🌿

> **A calm, private wellbeing sanctuary.** Two-tap mood and energy check-in, private offline journal, clear visual patterns, tailored self-care rituals, and immediate crisis support.

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple?logo=vite)](https://vitejs.dev)
[![WCAG AA](https://img.shields.io/badge/Accessibility-WCAG_AA_Compliant-green)](https://www.w3.org/WAI/standards-guidelines/wcag/)

---

## 🌟 Live Demo & Preview
- **Live URL:** [https://wellness-pulse.vercel.app](https://wellness-pulse.vercel.app) *(Deploy directly to Vercel via CLI or GitHub repository connection)*
- **Local Dev Server:** `http://localhost:3000/`

---

## ✨ Features & Correlation Architecture

The 4 core features operate as **one seamless interconnected system**:

### 1. Quick Daily Check-In (`Check-in` Tab)
- **Time-based greeting:** Adapts dynamically to morning, afternoon, or evening.
- **Continuous Morphing Pulse Orb:** Signature SVG blob with harmonic Fourier spline morphing. Mood modulates its size, calmness/jitter, and color ramp (Low `#B7AAD0` to Great `#8FA98B`), while energy modulates its fluid speed.
- **5 Selectable Moods:** Low 😔, Meh 😕, Okay 😐, Good 🙂, Great 😄 with spring lift animations (`scale(1.06)`).
- **1–5 Energy Slider:** Drained, Low, Steady, Charged, Buzzing with dynamic tint accents.
- **Multi-select Influence Tags:** Sleep, Work or study, Family, Friends, Health, Money.
- **One Check-in per Day:** Updating today's check-in updates all stats in place. On save, triggers an elastic pulse ring and soothing Tibetan singing bowl chime.
- **Next Small Step Card:** Shows the top personalized action for the recorded mood, with a **"Write about it"** direct handoff that pre-fills a matching prompt in the Journal.

### 2. Private Journal with Prompts & Live Search (`Journal` Tab)
- **Thought-Starter Prompts:** Automatically tailored to latest recorded mood (e.g., restorative prompts for Low/Meh, reflective for Okay, celebratory for Good/Great), with a **Shuffle** button.
- **100% Offline & Stamped:** Every entry is permanently stamped with that day's mood, energy, and influence tags.
- **Live Search & Filters:** Live instant filtering by text, prompt, mood label (`"low"`, `"great"`), or tag (`"sleep"`). Filter chips for All, Last 7 days, and specific mood levels.
- **In-Place Editing & Safe Deletion:** Edit reflections directly inline or delete with confirmation.
- **Privacy Assurance:** Stays strictly in `localStorage` on device. No tracking, no external server uploads.

### 3. Mood Trends & Visual Insights (`Insights` Tab)
- **Timeframe Selector:** 7 days, 14 days, 30 days.
- **Hand-Built SVG Line Chart:** Smooth bezier curves for Mood (lavender) and Energy (sage), drawing in from left to right (~1.2s) with missing-day gap preservation, journal day markers, and interactive tooltips.
- **Summary Metrics:** Average mood, average energy, current streak, and total journal reflections.
- **30-Day Calendar Heat Strip:** Color-tinted visual history of your daily pulses.
- **Plain-Language Computed Insights:**
  - *Trend:* Identifies climbing, dipping, or steady trajectories.
  - *Best Day:* Computes the best day of the week.
  - *Energy-Mood Link:* Calculates statistical Pearson correlation between energy and mood.
  - *Tag Effects:* Quantifies how specific tags (e.g., Sleep) affect mood averages.
  - *Journal Correlation:* Discovers whether you write more on heavy or high days.
- **Sample Demo Mode & Clean Wipe:** "Load sample week" instantly hydrates 7 days of realistic history for demo evaluation; "Clear all data" safely resets all state.

### 4. Tailored Care & Support Resources (`Care` Tab)
- **Context-Aware Suggestions Engine:** Recommends small, actionable steps based on mood level, energy, and tags (e.g., wind-down routines for Sleep tags; 20-min non-screen rest for low energy; outside light for low mood).
- **Interactive Action Tracking:** Check off suggestions to increase your weekly "Small actions done" counter.
- **4-2-8 Reset Breathing Guide:** Follows the clinical 4s Inhale (circle scales 1 → 1.9), 2s Hold, and 8s Exhale (shrinks 1.9 → 1) rhythm with soothing singing bowl audio transitions.
- **5-4-3-2-1 Grounding Ritual:** Guided interactive sensory grounding checklist.
- **Verified Crisis Hotlines (India-first & Global):**
  - **Tele-MANAS:** `14416` (24×7 Free Govt Helpline)
  - **iCall Helpline:** `+91 91529 87821` (TISS Counselling)
  - **Emergency Services:** `112`
  - Instant tap-to-call buttons.
- **Gentle Escalation Mode:** If mood is 1–2 for 3 or more consecutive check-ins, a supportive banner appears on Check-in and Care tabs with resources expanded.

---

## 🎨 Design System & Palette

Strict adherence to the specified tokens:

| Token | Name | Hex | Usage |
|---|---|---|---|
| `--cream` | Warm cream | `#F7F1E5` | App background |
| `--cream-2` | Soft cream | `#FFFBF3` | Cards, inputs, panels |
| `--sage` | Sage green | `#8FA98B` | Positive states, energy line, primary accents |
| `--sage-deep` | Deep sage | `#4F6B4E` | Primary buttons, active nav, focus rings |
| `--lavender` | Muted lavender | `#B7AAD0` | Secondary accents, mood line, highlights |
| `--lavender-deep` | Deep lavender | `#6E5F94` | Links, tags, secondary text accents |
| `--ink` | Warm charcoal | `#2E2A33` | Primary body typography (WCAG AA 4.5:1+) |
| `--ink-soft` | Soft ink | `#6B6573` | Secondary text, captions |
| `--line` | Hairline | `#E6DCCB` | Borders, subtle dividers |

### Mood Colour Ramp
`1 Low (#B7AAD0)` → `2 Meh (#C9C0B5)` → `3 Okay (#D9D3A7)` → `4 Good (#B5C7A8)` → `5 Great (#8FA98B)`

### Dark Mode
Background `#1F1D24`, Cards `#2A2731`, adjusted contrast tokens.

### Typography & Spacing
- **Font:** `Plus Jakarta Sans` (400, 500, 600, 800) with system fallbacks.
- **Radii:** Buttons/inputs 16px, cards 24px, pills 999px.
- **Shadow:** `0 10px 30px rgba(79,107,78,0.10)`.

---

## 🌊 Fluid Motion & Live Background

1. **Live Ambient Canvas (`LiveFluidBackground.tsx`):** Multi-point organic fluid gradient blobs that continuously breathe and drift in the background, subtly reacting to mouse/touch movement and time.
2. **Pulse Orb Morphing:** Dynamic Fourier spline with harmonic perturbation; jittery for low mood, silky smooth for great mood; fast for buzzing energy, slow for drained.
3. **Tab Transitions:** Smooth 12px vertical slide with opacity cross-fade.
4. **Button Spring Physics:** Selected mood buttons lift and scale to 1.06 with `cubic-bezier(0.2, 0.8, 0.2, 1)`.
5. **Chart Draw-In:** SVG paths draw in over 1.2s.
6. **Breathing Guide Circle:** Continuous fluid scaling between 1.0 and 1.9 over the 4-2-8 rhythm.
7. **Accessibility First:** All motion automatically disabled when `prefers-reduced-motion: reduce` is detected.

---

## 📱 Responsive Layout

- **Mobile (<900px):** Single column (`max-width: 560px`), sticky header with live mood pulse dot, floating bottom pill navigation respecting `env(safe-area-inset-bottom)`.
- **Desktop (≥900px):** 3-Column balanced layout:
  1. *Left:* Logo + 4 Nav Tabs + Streak Card + Theme/Sound/Data controls.
  2. *Center:* Active tab content.
  3. *Right:* **Today's pulse + summary panel** with today's live mini-orb, check-in status, streak metrics, quick top action toggle, and breathing exercise launcher.

---

## 🚀 Quickstart & Setup

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or pnpm

### Installation & Run
```bash
# Clone the repository
git clone <repo-url>
cd wellness-pulse

# Install dependencies
npm install

# Start development server
npm run dev
# -> Opens http://localhost:3000/

# Build for production
npm run build
```

---

## ⏱️ 60-Second Demo Script (For Judges)

1. **Open app & drag the Energy slider:** Watch the Pulse Orb speed and color adjust live.
2. **Select Low mood (😔) and Sleep tag:** Click **"Save check-in"**. The orb pulses with an elastic wave; a toast confirms save; the "Next small step" card appears with a tailored sleep recommendation.
3. **Click "Write about it":** The Journal opens with a prompt tailored to low mood. Type one line and save. The entry shows the lavender "Low" dot and "Sleep" tag.
4. **Go to "Insights" & click "Load sample week":** Watch the SVG chart draw in from left to right (~1.2s). Explore the computed insights, statistics, and 30-day heat strip.
5. **Search the journal for `"sleep"`:** Notice how the stamped entry is immediately located by tag.
6. **Open "Care":** Review the generated suggestions matching recent data, check off a suggestion, and click **Start** on the 4-2-8 breathing guide to watch the circle expand and contract.
7. **Toggle Theme:** Click the Moon/Sun icon to experience the calming dark mode.

---

## 🔒 Privacy & Security

Wellness Pulse does not collect, track, or transmit any user data. All check-ins and journal reflections remain strictly in the browser's `localStorage` and can be exported as an encrypted offline JSON backup or wiped clean at any time via the **Data Sanctuary** modal.
