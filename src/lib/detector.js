import { createHash } from 'node:crypto';

// Words that signal a Pokémon TCG product.
const PRODUCT_TERMS = [
  'pokemon', 'pokémon', 'tcg', 'etb', 'elite trainer box',
  'booster', 'bundle', 'collection', 'tin', 'pokeball', 'poké ball',
];

// Words that signal a buying opportunity.
const ACTION_TERMS = [
  'restock', 'in stock', 'instock', 'back in stock', 'drop', 'dropped',
  'available', 'live', 'preorder', 'pre-order', 'pre order',
  'sale', 'now selling', 'add to cart', 'atc',
];

// Words that signal in-store rather than online.
const INSTORE_TERMS = ['in store', 'in-store', 'aisle', 'pickup', 'pick up', 'store only', 'found at'];

// Known retailers -> display name. First match wins.
const RETAILERS = [
  [/pok[eé]mon ?center|pokemoncenter\.com/i, 'Pokémon Center'],
  [/target\.com|\btarget\b/i, 'Target'],
  [/bestbuy\.com|best buy/i, 'Best Buy'],
  [/walmart\.com|walmart/i, 'Walmart'],
  [/costco\.com|costco/i, 'Costco'],
  [/gamestop\.com|gamestop/i, 'GameStop'],
  [/amazon\.com|amazon/i, 'Amazon'],
];

const URL_RE = /https?:\/\/[^\s<>()]+/i;

function includesAny(text, terms) {
  return terms.some((t) => text.includes(t));
}

function detectRetailer(text) {
  for (const [re, name] of RETAILERS) {
    if (re.test(text)) return { name, matched: true };
  }
  return { name: 'Unknown', matched: false };
}

/**
 * Inspect a raw message and decide whether it looks like a Pokémon TCG drop.
 * Returns a drop object ready for the calendar, or null if it's not a drop.
 *
 * `context` = { source, author, detectedAt (Date) }
 */
export function detectDrop(content, context = {}) {
  if (!content || typeof content !== 'string') return null;
  const text = content.toLowerCase();

  const hasProduct = includesAny(text, PRODUCT_TERMS);
  if (!hasProduct) return null;

  const url = (content.match(URL_RE) || [])[0] || null;
  const hasAction = includesAny(text, ACTION_TERMS);

  // Need a buying signal: either an action word or a link to act on.
  if (!hasAction && !url) return null;

  const retailer = detectRetailer(content);
  const isInStore = includesAny(text, INSTORE_TERMS) || (!url && retailer.matched);
  const type = isInStore ? 'instore' : 'online';

  const detectedAt = context.detectedAt instanceof Date ? context.detectedAt : new Date();

  // Stable id so re-reading the same alert doesn't create duplicates.
  const fingerprint = url || content.trim().slice(0, 200).toLowerCase();
  const id = 'auto-' + createHash('sha1').update(fingerprint).digest('hex').slice(0, 12);

  const snippet = content.trim().replace(/\s+/g, ' ').slice(0, 180);

  return {
    id,
    name: snippet,
    // We don't know the exact drop time from a chat message, so we record
    // when we *detected* it. Edit the date by hand if you learn the real time.
    date: detectedAt.toISOString(),
    type,
    retailer: retailer.name,
    url,
    notes: `Auto-detected from ${context.source ?? 'a Discord server'}${context.author ? ` (posted by ${context.author})` : ''}. Verify before buying.`,
    source: 'discord-monitor',
  };
}
