import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const DROPS_FILE = join(DATA_DIR, 'drops.json');

function loadDropsFile() {
  return JSON.parse(readFileSync(DROPS_FILE, 'utf8'));
}

export function getDrops() {
  return loadDropsFile().drops ?? [];
}

/**
 * Append a detected drop to drops.json if it isn't already there.
 * Dedup is by `id`. Returns true if added, false if it was a duplicate.
 */
export function appendDrop(drop) {
  const file = loadDropsFile();
  file.drops ??= [];
  if (file.drops.some((d) => d.id === drop.id)) return false;
  file.drops.push(drop);
  // Keep the calendar tidy: sort by date.
  file.drops.sort((a, b) => new Date(a.date) - new Date(b.date));
  writeFileSync(DROPS_FILE, JSON.stringify(file, null, 2) + '\n', 'utf8');
  return true;
}
