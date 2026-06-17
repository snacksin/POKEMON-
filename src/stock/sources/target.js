// Target source — uses the UNOFFICIAL "RedSky" endpoint that powers target.com.
// ⚠️ Experimental: it's undocumented and the public "key" rotates, so this may
// stop working and need updating. Great for IN-STORE Jacksonville checks though.
//
// Setup:
//   - Find a product's TCIN (in the target.com product URL, e.g. .../A-1004055984).
//   - Find your local store id: on target.com set your store, the id shows in
//     network requests, or use the "nearby stores" feature. Put it as storeId.
//   - The web key changes over time; override with TARGET_API_KEY in .env if the
//     default stops working (grab a fresh one from target.com network requests).

const REDSKY = 'https://redsky.target.com/redsky_aggregations/v1/web/pdp_fulfillment_v1';
// Commonly-used public web key. If Target rotates it, set TARGET_API_KEY in .env.
const DEFAULT_KEY = '9f36aeafbe60771e321a7cc95a78140772ab3e96';

export const name = 'Target';

export function isConfigured() {
  // No private key required; the public web key has a default.
  return true;
}

/**
 * @param {{tcin: string, label?: string, storeId?: string, zip?: string}} item
 */
export async function check(item) {
  const key = process.env.TARGET_API_KEY || DEFAULT_KEY;
  const params = new URLSearchParams({
    key,
    tcin: item.tcin,
    is_bot: 'false',
    store_id: item.storeId || '',
    zip: item.zip || '',
    state: 'FL',
    pricing_store_id: item.storeId || '',
    has_pricing_store_id: item.storeId ? 'true' : 'false',
    visitor_id: 'pokemon-drops-monitor',
    channel: 'WEB',
    page: `/p/A-${item.tcin}`,
  });

  const res = await fetch(`${REDSKY}?${params}`, {
    headers: { 'User-Agent': 'Mozilla/5.0', accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Target RedSky ${res.status} (key may have rotated)`);
  const data = await res.json();

  const f = data?.data?.product?.fulfillment;
  if (!f) throw new Error(`No fulfillment data for TCIN ${item.tcin}`);

  const shipping = f.shipping_options?.availability_status === 'IN_STOCK';
  const store = f.store_options?.[0]?.location_available_to_promise_quantity > 0
    || f.store_options?.[0]?.order_pickup?.availability_status === 'IN_STOCK';
  const available = Boolean(shipping || store);
  const where = [shipping && 'ship', store && 'in-store'].filter(Boolean).join(' + ') || 'out of stock';

  return {
    available,
    label: item.label || `TCIN ${item.tcin}`,
    detail: where,
    url: `https://www.target.com/p/A-${item.tcin}`,
  };
}
