# Pokémon MSRP Tracker 🎴

A prep app for buying Pokémon TCG boxes at MSRP — knowing **when** and **where**
drops happen, and being ready before they fire.

## v1 — Release Calendar Command Center (current)

A single, self-contained web app (`index.html`). No backend, no build step.
Open it in any browser on desktop or phone.

**Features**
- All 2026 Pokémon TCG release dates with a **live countdown**
- **Prep checklist** per release (Walmart+ active → logged in → payment saved →
  address confirmed → alerts armed → window noted). Progress saves to your device.
- **Priority tags** — Flagship / MSRP-friendly / Standard, with the
  **Sep 16 30th Celebration set** flagged as top priority ("plan hard")
- **Next likely online window** hint per retailer (Walmart, Target, Pokémon
  Center, Best Buy, Costco)
- **Month + priority filters**, and a **Show released** toggle — past 2026 drops
  are greyed out and labeled "Released," hidden by default, kept for full-year view

## Run it

Just open `index.html` in a browser. That's it.

For phone access, host it anywhere static:
- **Vercel / Netlify / Cloudflare Pages** — drop the file in, deploy. No config.
- Or `python3 -m http.server` locally and open the LAN URL on your phone.

## Alert layer (set up separately, free)

- **Pokemon Restocks & News** — https://discord.gg/pkmnalerts (66k+ members, 100+ retailers)
- **TrackaLacker** — backup, preorder/reprint news

## Retailer drop-window patterns

| Retailer | Window | Notes |
|---|---|---|
| Walmart | Wed/Thu mornings, **10 AM ET** | Exclusives **Walmart+ gated** — biggest edge |
| Target | Fri **~3 AM ET** | Mobile add-to-cart → desktop checkout trick |
| Pokémon Center | ~10 AM PT, Tue/Thu | Irregular, hardest to predict |
| Best Buy | Friday | — |
| Costco | Random weekday | Unpredictable |

## Roadmap (data shapes stubbed in v1, not yet active)

- **v2** — retailer drop-window predictor + live stock monitoring
- **v3** — Jacksonville in-store run planner (store list, hours, personal
  restock log, route optimization)

Dates are hardcoded (US/English) and maintained by hand.
