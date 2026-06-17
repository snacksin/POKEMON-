// Best Buy source — uses the OFFICIAL Developer API.
// Get a free key at https://developer.bestbuy.com/ and put it in .env as
// BESTBUY_API_KEY. Docs: https://bestbuyapis.github.io/api-documentation/
//
// Find a product's SKU on its bestbuy.com page (it's in the URL and the
// "Specifications" / model area), then add it to watchlist.json.

const API = 'https://api.bestbuy.com/v1';

export const name = 'Best Buy';

export function isConfigured() {
  return Boolean(process.env.BESTBUY_API_KEY);
}

/**
 * @param {{sku: string, label?: string}} item
 * @returns {Promise<{available: boolean, label: string, detail: string, url: string}>}
 */
export async function check(item) {
  const key = process.env.BESTBUY_API_KEY;
  const show = 'sku,name,salePrice,onlineAvailability,inStoreAvailability,url';
  const url = `${API}/products(sku=${encodeURIComponent(item.sku)})?apiKey=${key}&format=json&show=${show}`;

  const res = await fetch(url, { headers: { 'User-Agent': 'pokemon-drops-monitor' } });
  if (!res.ok) throw new Error(`Best Buy API ${res.status} ${res.statusText}`);
  const data = await res.json();
  const product = data.products?.[0];
  if (!product) throw new Error(`SKU ${item.sku} not found`);

  const online = Boolean(product.onlineAvailability);
  const inStore = Boolean(product.inStoreAvailability);
  const available = online || inStore;
  const where = [online && 'online', inStore && 'in-store'].filter(Boolean).join(' + ') || 'out of stock';
  const price = product.salePrice != null ? ` $${product.salePrice}` : '';

  return {
    available,
    label: item.label || product.name,
    detail: `${where}${price}`,
    price: Number.isFinite(product.salePrice) ? product.salePrice : null,
    url: product.url || `https://www.bestbuy.com/site/${item.sku}.p`,
  };
}
