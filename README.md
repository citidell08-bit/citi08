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

## Play by opening a file (no server)

1. Download / clone this repo
2. Double-click **`play/index.html`**  
   (or open root `index.html` — it redirects to the playable build)
3. Cyber Kith loads in your browser

The `play/` folder is a single-file offline build (`base: './'`), so it works over `file://` without a blank page.

## Develop locally

```bash
npm install
npm run dev
```

Rebuild the offline playable file:

```bash
npm run build
```

That refreshes `play/index.html`.

## Stack

- Vite + React 19 + TypeScript
- CSS (no UI framework) with Syne + Outfit
