# Cyber Kith — Gamified Study Companion

Cyber Kith is a browser study companion that turns focus sessions and flashcard reviews into XP, coins, streaks, daily quests, and a leveling owl friend.

## Features

- **Companion growth** — Earn XP to level up Ember (renameable) through Hatchling → Nestling → Scholar → Sage
- **Coins** — Earn coins from quests, achievements, and every level-up; spend them to play arcade games
- **Focus den** — Timed study sessions (15 / 25 / 45 min) with XP rewards
- **Flashcards** — Review a starter biology deck or create your own
- **Arcade mini-games** — Spike Dash (Geometry Dash-style runner), Memory Nest, Quick Sum, and Glow Catch — each with live scores and timers
- **Daily quests** — Rotating goals that refresh each day and pay out coins on completion
- **Achievements & streaks** — Milestones and consecutive study days
- **Local save** — Progress persists in `localStorage`

## Run locally

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## Stack

- Vite + React 19 + TypeScript
- CSS (no UI framework) with Syne + Outfit
