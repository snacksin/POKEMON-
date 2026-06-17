# POKEMON- — Discord Drop Monitor 🎴

A **read-only** Discord bot (Node.js / discord.js) that sits in Pokémon TCG
restock/drop servers, **reads** the alert messages posted there, and records the
drops it finds into a local calendar file. It tracks both **online box drops**
(Pokémon Center, Target, Best Buy, Walmart, Costco…) and **in-store** pickups
around **Jacksonville, FL**.

> ⚠️ **This bot never sends messages.** No channel posts, no replies, no DMs.
> It only reads and saves what it finds to `src/data/drops.json`.

## How it works

1. You invite the bot to servers (or channels) that post drop alerts.
2. It listens to incoming messages and runs each through a detector
   (`src/lib/detector.js`) that looks for Pokémon product words + a buying
   signal (restock / in stock / drop / a store link, etc.).
3. Matches are appended to your calendar in `src/data/drops.json`
   (duplicates are skipped automatically).
4. You open `src/data/drops.json` to see the schedule. Fix dates/details by hand
   when you learn the exact drop time.

```
src/
├── index.js          # read-only bot: logs in, listens, saves drops
├── lib/
│   ├── detector.js   # decides if a message is a Pokémon drop
│   └── data.js       # reads/writes the calendar (dedup + sort)
└── data/
    ├── drops.json    # your drop calendar (auto-updated + hand-editable)
    └── stores.json   # reference list of online + Jacksonville stores
```

## Setup

### 1. Create the bot application
1. Go to <https://discord.com/developers/applications> → **New Application**.
2. Open the **Bot** tab → **Reset Token** → copy the token.
3. On the same Bot tab, scroll to **Privileged Gateway Intents** and turn ON
   **MESSAGE CONTENT INTENT** (required to read message text).

### 2. Invite it with READ-ONLY permissions
On the **OAuth2 → URL Generator** page:
- Scopes: check **bot**.
- Bot Permissions: check only **View Channels** and **Read Message History**.
  (Do **not** grant Send Messages — this bot doesn't need it.)

Open the generated URL and add the bot to a server you control. To read another
community's alerts, that server's admin must invite it.

### 3. Configure & run
```bash
cp .env.example .env      # then paste your DISCORD_TOKEN into .env
npm install
npm start                 # or: npm run dev  (auto-restart on file changes)
```

You'll see detected drops printed in the terminal and saved to
`src/data/drops.json`.

### Optional: watch only certain channels
Set `MONITOR_CHANNEL_IDS` in `.env` to a comma-separated list of channel IDs
(turn on Discord **Developer Mode**, right-click a channel → Copy Channel ID).
Leave it blank to watch every channel the bot can read.

## Getting real drop alerts into your bot (the legit way)

You **cannot** add this bot to a Pokémon community you don't run — adding a bot
needs the **Manage Server** permission on that server, and most communities ban
member-added bots. Trying to scrape a server you don't control also breaks
Discord's Terms of Service.

The supported way to pull another community's alerts in is Discord's built-in
**Follow Announcement Channel** feature, which mirrors their posts into *your*
server, where your bot is allowed to read:

1. Create your own Discord server (free) and add the bot to it.
2. Join a restock/drop community that has a public **Announcement channel**
   (📢 icon).
3. Open that announcement channel → click the channel name (or the
   bell-with-arrow **Follow** button) → choose a channel in **your** server to
   mirror the posts into.
4. The bot reads the mirrored alerts in your server and saves any drops it finds
   to `src/data/drops.json`.

Notes:
- Not every server exposes a followable announcement channel — some disable it.
- You can also just have humans paste drop links into your own server; the bot
  will detect and log those too.
- A future "retailer stock-checker" mode (polling Pokémon Center / Target /
  Best Buy directly, no other Discord servers needed) is planned.

## Running 24/7 on a Mac mini (or any always-on machine)

A Discord gateway bot must run continuously, so use an always-on machine (a Mac
mini is ideal), not a serverless host like Vercel.

```bash
# one-time install (macOS)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node

# get the code
git clone https://github.com/snacksin/POKEMON-.git
cd POKEMON-
git checkout claude/discord-server-integration-wbjh66
npm install
cp .env.example .env        # paste your DISCORD_TOKEN, then save

# run it continuously with pm2 (restarts on crash + on reboot)
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup                 # run the one command it prints
```

Keep the Mac awake so the bot never drops offline:

```bash
sudo pmset -a sleep 0 disablesleep 1
```

Useful pm2 commands: `pm2 logs pokemon-bot`, `pm2 restart pokemon-bot`,
`pm2 stop pokemon-bot`.

## Option B: retailer stock-checker (`npm run stock`)

A separate, pluggable engine that polls retailers directly and pops a **macOS
notification** the moment an item flips from out-of-stock to in-stock. It runs
independently of the Discord bot.

```
src/stock/
├── index.js            # polling engine (transition detection, no repeat spam)
├── notify.js           # macOS notification (osascript) + console fallback
└── sources/
    ├── bestbuy.js       # OFFICIAL Best Buy API (reliable) — needs BESTBUY_API_KEY
    └── target.js        # UNOFFICIAL Target RedSky (experimental) — in-store Jax checks
```

### Setup
1. **Best Buy key (recommended):** sign up free at
   <https://developer.bestbuy.com/>, then put the key in `.env` as
   `BESTBUY_API_KEY`.
2. **Add products to watch** in `src/data/watchlist.json`:
   - Best Buy: find the **SKU** on the product's bestbuy.com page.
   - Target: find the **TCIN** in the target.com URL (`.../A-1004055984`), and
     your local Jacksonville **store id** for in-store checks.
3. Run it:
   ```bash
   npm run stock          # foreground
   # or under pm2 (already in ecosystem.config.cjs as "pokemon-stock"):
   pm2 start ecosystem.config.cjs
   ```

### How alerting works
- Polls every `STOCK_POLL_SECONDS` (default 120s; minimum 30 to stay polite).
- Notifies **once** on each out→in-stock transition — no repeat spam while it
  stays in stock.
- Every hit is also logged, so `pm2 logs pokemon-stock` keeps a history.

### MSRP & markup tracking
Each watchlist item takes an `msrp` (the official sticker price). When the
checker pulls a live price it computes the **markup %** automatically:

- In **alerts**: `$88.74 (MSRP $39.95 · +122% over MSRP)` so you instantly know
  if a "drop" is really a reseller markup.
- In a **table report** — run it anytime:
  ```bash
  npm run stock:report
  ```
  ```
  Source    Product                   MSRP    Live    Markup           Stock
  ────────  ────────────────────────  ──────  ──────  ───────────────  ──────────
  Best Buy  Scarlet & Violet 151 ETB  $39.95  $88.74  +122% over MSRP  ✅ online
  Best Buy  Prismatic Evolutions ETB  $49.99  $49.99  at MSRP          ✅ online
  Target    Booster Bundle            $39.95  —       —                ❌ out
  ```
  (Target shows `—` for price/markup for now — its stock endpoint doesn't carry
  price; a price call can be added later.)

### Adding more sources later
Each retailer is a plugin exporting `name`, `isConfigured()`, and
`check(item)`. Drop a new file in `src/stock/sources/`, register it in the
`SOURCES` map in `src/stock/index.js`, and add its items to the watchlist.
Candidates: Walmart, GameStop, a paid Target data API, or a Playwright-based
checker for Pokémon Center (no public API).

### Caveats
- **Target (RedSky)** is undocumented and its public key rotates — if it starts
  failing, grab a fresh key from target.com network requests and set
  `TARGET_API_KEY`.
- **Pokémon Center** has no public API and strong bot protection; it's not
  included and isn't reliably automatable.
- Respect each retailer's terms and don't hammer their endpoints.

## Editing the calendar by hand
`src/data/drops.json` is just JSON. Each entry:
```json
{
  "id": "unique-id",
  "name": "Prismatic Evolutions ETB restock",
  "date": "2026-06-20T11:00:00-04:00",
  "type": "online",            // or "instore"
  "retailer": "Pokémon Center",
  "url": "https://www.pokemoncenter.com",
  "notes": "Have payment info ready."
}
```
The file also seeds a few example drops and a Jacksonville store list you can
edit or delete.

## Tuning what counts as a "drop"
Edit the keyword lists at the top of `src/lib/detector.js`
(`PRODUCT_TERMS`, `ACTION_TERMS`, `INSTORE_TERMS`, `RETAILERS`) to make
detection looser or stricter.

## Notes & limits
- A chat message rarely states the exact future drop time, so auto-detected
  entries use the **time they were seen**. Adjust the `date` by hand for true
  scheduling.
- Respect each server's rules and Discord's Terms of Service when monitoring.
- Keep your `.env` / token secret — it's gitignored.
