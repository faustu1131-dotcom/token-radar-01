# token-radar-01

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/faustu1131-dotcom/token-radar-01/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/faustu1131-dotcom/token-radar-01/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

Token Radar ranks pre-token protocols by implied value, so a reader can see which protocol's token would be worth the most if it launched — and what to do to farm it first. It scores all 758 protocols in the snapshot and ranks 198: the whole 40-protocol watchlist plus 158 early finds below the $50M floor.

## The model (radar-2)

Implied value follows only from the snapshot's own figures, the same function for every row: TVL × 0.25, adjusted by seven-day growth (rises rewarded at 0.7 weight, falls charged at full weight), by age with no token (value builds to a peak near two years, then fades), and by chain breadth (+5% per extra chain, up to +20%). No protocol is ever special-cased. Protocols whose token already trades are set aside in a live-token view with their market caps shown, never mixed into the ranking.

## The dashboard

A static page, no framework and no network: the board ranked by implied value, a detail view with the model's multiplier breakdown and a six-step farm plan for every protocol, and search, category, chain and token-status filters. The farm plans state what each step costs and how long it takes.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input <snapshot.json>
```

The program reads the sealed snapshot, writes the ranked board to `out/board.json`, the dashboard data to `out/data.js`, and copies `dashboard/` and `screenshots/` to `out/`, then writes `out/dossier.json`. Node 22 or later, standard library only.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
