import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { notify } from './notify.js';
import { markupLabel, money } from './markup.js';
import * as bestbuy from './sources/bestbuy.js';
import * as target from './sources/target.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WATCHLIST = join(__dirname, '..', 'data', 'watchlist.json');

// Registry of available source plugins. Add new ones here.
const SOURCES = { bestbuy, target };

const POLL_SECONDS = Math.max(30, Number(process.env.STOCK_POLL_SECONDS ?? 120));

// Remembers each item's last availability so we only alert on out -> in stock.
const lastState = new Map();

function loadWatchlist() {
  return JSON.parse(readFileSync(WATCHLIST, 'utf8'));
}

function isPlaceholder(item) {
  return Object.values(item).some((v) => typeof v === 'string' && v.startsWith('REPLACE_WITH'));
}

async function pollOnce() {
  const watchlist = loadWatchlist();

  for (const [key, source] of Object.entries(SOURCES)) {
    const items = (watchlist[key] ?? []).filter((it) => !isPlaceholder(it));
    if (items.length === 0) continue;
    if (!source.isConfigured()) {
      console.log(`[${source.name}] skipped — not configured (missing API key?).`);
      continue;
    }

    for (const item of items) {
      const id = `${key}:${item.sku || item.tcin}`;
      try {
        const result = await source.check(item);
        const was = lastState.get(id);
        lastState.set(id, result.available);

        // Fire a notification only on the transition into stock.
        if (result.available && was === false) {
          const markup = markupLabel(item.msrp, result.price);
          const priceLine = `${money(result.price)} (MSRP ${money(item.msrp)} · ${markup})`;
          notify(`🟢 IN STOCK: ${result.label}`, `${source.name} — ${result.detail} · ${priceLine}`, result.url);
        } else if (was === undefined) {
          console.log(`[${source.name}] tracking "${result.label}" (currently ${result.available ? 'in stock' : 'out'}).`);
        }
      } catch (err) {
        console.error(`[${source.name}] check failed for ${id}: ${err.message}`);
      }
      // Be polite between requests.
      await new Promise((r) => setTimeout(r, 750));
    }
  }
}

async function loop() {
  await pollOnce().catch((e) => console.error('[stock] poll error:', e.message));
  setTimeout(loop, POLL_SECONDS * 1000);
}

console.log(`📦 Stock-checker started. Polling every ${POLL_SECONDS}s. Edit src/data/watchlist.json to add products.`);
loop();
