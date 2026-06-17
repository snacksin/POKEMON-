# CLAUDE.md — project guide & install instructions

This file is for Claude Code (and humans) working in this repo. It explains what
the project is, how to install it, and the current state. **If you are helping
the user install this on their Mac mini, follow the "Install & run" section
step by step and confirm each step works before moving on.**

## What this project is

Two independent tools for catching Pokémon TCG sealed-product (boxes, not
singles) restocks around Jacksonville, FL and online:

1. **Discord drop monitor** (`src/index.js`) — a **read-only** discord.js bot
   that reads alert messages in Pokémon drop servers and records detected drops
   into `src/data/drops.json`. It never sends messages.
2. **Retailer stock-checker** (`src/stock/`) — polls retailers directly and
   sends an **SMS via Twilio** when a watched product flips out-of-stock →
   in-stock. Computes markup vs MSRP.

The two run separately. The user's priority is the **stock-checker + SMS**.

## Requirements

- **Node.js >= 18** (uses global `fetch`). Check with `node -v`; install via
  `brew install node` if missing.
- Dependencies: `discord.js`, `dotenv` (installed by `npm install`).
- Process manager (optional, for 24/7): `pm2` (`npm install -g pm2`).

## Install & run (Mac mini)

```bash
# 1. Get the code (currently on a feature branch, not main)
git clone https://github.com/snacksin/pokemon-.git
cd pokemon-
git checkout claude/discord-server-integration-wbjh66
npm install

# 2. Create the env file and fill it in (see "Environment" below)
cp .env.example .env
# edit .env

# 3. Verify SMS works (the user's chosen alert channel)
npm run stock:test-sms        # should text ALERT_TO_PHONE within seconds

# 4. See current stock + MSRP/markup for watched products
npm run stock:report

# 5. Run the stock-checker continuously
npm run stock                 # foreground
# or run both tools under pm2:
pm2 start ecosystem.config.cjs
pm2 save
```

## Environment (`.env`)

Copy from `.env.example`. Relevant to the stock-checker (the priority):

| Var | What | Needed for |
| --- | --- | --- |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID (`AC...`) | SMS alerts |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | SMS alerts |
| `TWILIO_FROM` | Twilio phone number, E.164 `+1904...` | SMS alerts |
| `ALERT_TO_PHONE` | User's cell, E.164 `+1904...` | SMS alerts |
| `BESTBUY_API_KEY` | Free key from developer.bestbuy.com | Best Buy source |
| `TARGET_API_KEY` | Override only if RedSky default key rotates | Target source |
| `STOCK_POLL_SECONDS` | Poll interval (default 120, min 30) | optional |
| `DISCORD_TOKEN`, `MONITOR_CHANNEL_IDS` | Discord bot | Discord tool only |

**Twilio trial accounts:** must verify the destination cell in the Twilio
Console first, and texts get a trial prefix. Upgrading removes both.

## Commands (npm scripts)

| Command | Does |
| --- | --- |
| `npm run stock` | Run the stock-checker (poll loop). |
| `npm run stock:report` | One-shot table: Source / Product / MSRP / Live / Markup / Stock. |
| `npm run stock:test-sms` | Send a test text to confirm Twilio works. |
| `npm start` | Run the Discord drop monitor. |

## Key files

- `src/stock/index.js` — poll loop; alerts only on out→in-stock transition.
- `src/stock/notify.js` — Twilio SMS (+ console log, optional macOS popup).
- `src/stock/sources/{bestbuy,target}.js` — per-retailer checkers (pluggable).
- `src/stock/markup.js` — MSRP→markup % helpers.
- `src/data/watchlist.json` — products to watch (SKU/TCIN + msrp + storeId).
- `src/data/msrp-reference.json` — standard US MSRP by product type.
- `src/data/drops.json` — Discord-bot calendar of upcoming drops (real 2026 data).

## Current state (as of this guide)

- **Alerts = SMS via Twilio** (user does not use Discord for alerts).
- **Watchlist:** Target *Mega Evolution: Pitch Black ETB* (TCIN `1011483406`,
  MSRP $49.99) is ACTIVE. Best Buy entry is a placeholder — needs the **numeric**
  SKU from the product page (the `JJG2TL8J45`-style URL slug is NOT the API SKU).
- **Known gap:** the Target source returns stock but not price, so Target markup
  shows "—". Best Buy returns price + markup. Adding Target price-fetching should
  be verified against the live RedSky API on the Mac mini before relying on it.

## Adding a watched product

Edit `src/data/watchlist.json`:
- **Best Buy:** add `{ "sku": "<numeric SKU>", "label": "...", "msrp": 49.99 }`.
  Find the numeric SKU on the bestbuy.com product page (specs section).
- **Target:** add `{ "tcin": "<TCIN>", "label": "...", "msrp": 49.99,
  "storeId": "<local store id>", "zip": "32256" }`. TCIN is in the target.com
  URL (`.../A-1011483406`). Leave `storeId` blank for shipping-only checks.

Use `src/data/msrp-reference.json` to fill `msrp` (ETB = $49.99, Booster Bundle
= $26.94, Booster Box = $161.64, etc.).

## Conventions

- Active development happens on branch `claude/discord-server-integration-wbjh66`.
  Do not push to `main` without the user's explicit permission.
- The Discord bot is **read-only** by design — never make it send messages.
- Be polite to retailer endpoints (the poller already throttles ~750ms between
  requests and defaults to a 120s interval).
