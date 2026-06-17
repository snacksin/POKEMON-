// MSRP / markup helpers — turn (msrp, live price) into a human markup readout.

/** Percentage markup over MSRP, rounded. null if either input is missing. */
export function markupPct(msrp, price) {
  if (!Number.isFinite(msrp) || msrp <= 0 || !Number.isFinite(price)) return null;
  return Math.round(((price - msrp) / msrp) * 100);
}

/** e.g. "+48% over MSRP", "−10% under MSRP", "at MSRP", or "—" if unknown. */
export function markupLabel(msrp, price) {
  const pct = markupPct(msrp, price);
  if (pct === null) return '—';
  if (pct === 0) return 'at MSRP';
  if (pct > 0) return `+${pct}% over MSRP`;
  return `${pct}% under MSRP`; // pct already carries the minus sign
}

/** "$39.95" or "—" for null/undefined. */
export function money(n) {
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : '—';
}
