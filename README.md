# World Cup 2026 Dashboard

A live dashboard for the 2026 World Cup: scores, group standings, the Golden Boot race, a knockout bracket, and AI-written match recaps. Everything comes live from ESPN's public API, with no backend.

**Live demo:** https://worldcup.neilkpatel.com

## What it does

- Live scores, 12-group standings, and the Golden Boot race, all parsed in the browser from ESPN's public API (no backend, no keys)
- Qualification-aware: a best-third-place race and a knockout bracket that fills in as teams advance
- AI-written match recaps via Claude, with ESPN's own report as a no-key fallback
- Auto-refreshes every 60 seconds. Mobile-first, with zero horizontal overflow down to 390px

## Built with

React, Vite, Tailwind, ESPN API, Claude API

---

Built by [Neil Patel](https://neilkpatel.com). More projects at [neilkpatel.com](https://neilkpatel.com).
