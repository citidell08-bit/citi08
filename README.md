# Cyber Kith — Gamified Study Companion

Cyber Kith turns focus sessions and flashcard reviews into XP, coins, streaks, daily quests, and arcade mini-games (including Spike Dash).

## Open in Chrome (no install)

After downloading this folder:

1. Double-click **`index.html`**  
   (or **`CyberKith.html`** — same game)
2. It should open in your browser and show Cyber Kith

These files are a full offline build (JS/CSS inlined). You do **not** need `npm` or a server.

If Chrome still fails, right-click `index.html` → **Open with** → **Google Chrome**.

## Develop locally

```bash
npm install
npm run dev
```

Dev server opens `app.html`.

Rebuild the double-clickable files:

```bash
npm run build
```

That refreshes `index.html`, `CyberKith.html`, and `play/index.html`.

## Features

- Companion growth, XP, levels, streaks
- Coins from quests, achievements, and every level-up
- Focus timer + flashcards
- Arcade: Spike Dash, Memory Nest, Quick Sum, Glow Catch (live scores + timers)

## Stack

Vite + React 19 + TypeScript
