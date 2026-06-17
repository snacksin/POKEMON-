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
