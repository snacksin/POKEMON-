import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { markupLabel, money } from './markup.js';
import * as bestbuy from './sources/bestbuy.js';
import * as target from './sources/target.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WATCHLIST = join(__dirname, '..', 'data', 'watchlist.json');
const SOURCES = { bestbuy, target };

function isPlaceholder(item) {
  return Object.values(item).some((v) => typeof v === 'string' && v.startsWith('REPLACE_WITH'));
}

// Minimal dependency-free table: pads each column to its widest cell.
function printTable(rows, headers) {
  const cols = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => String(r[i]).length)));
  const line = (cells) => cells.map((c, i) => String(c).padEnd(cols[i])).join('  ');
  console.log(line(headers));
  console.log(cols.map((w) => '─'.repeat(w)).join('  '));
  for (const r of rows) console.log(line(r));
}

async function main() {
  const watchlist = JSON.parse(readFileSync(WATCHLIST, 'utf8'));
  const rows = [];

  for (const [key, source] of Object.entries(SOURCES)) {
    const items = (watchlist[key] ?? []).filter((it) => !isPlaceholder(it));
    for (const item of items) {
      if (!source.isConfigured()) {
        rows.push([source.name, item.label ?? '?', money(item.msrp), '—', '—', 'not configured']);
        continue;
      }
      try {
        const r = await source.check(item);
        rows.push([
          source.name,
          r.label,
          money(item.msrp),
          money(r.price),
          markupLabel(item.msrp, r.price),
          r.available ? `✅ ${r.detail}` : '❌ out',
        ]);
      } catch (err) {
        rows.push([source.name, item.label ?? '?', money(item.msrp), '—', '—', `error: ${err.message}`]);
      }
      await new Promise((res) => setTimeout(res, 750));
    }
  }

  if (rows.length === 0) {
    console.log('No products to report. Add some to src/data/watchlist.json first.');
    return;
  }
  console.log(`\n📊 Stock & MSRP report — ${new Date().toLocaleString()}\n`);
  printTable(rows, ['Source', 'Product', 'MSRP', 'Live', 'Markup', 'Stock']);
  console.log('');
}

main().catch((e) => {
  console.error('Report failed:', e.message);
  process.exit(1);
});
