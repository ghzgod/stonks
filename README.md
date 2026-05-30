# 📈 STONKS

A simple, beautiful stock **gains & tax what-if calculator**. Enter your tickers, shares,
average cost, and a target price — it instantly projects your value, gain, and an estimate
of **short-term vs long-term U.S. federal capital-gains tax**, with live charts.

- Dark mode by default, with a light-mode toggle (remembered)
- Add as many stocks as you want
- Income-bracket dropdown that auto-maps your long-term rate (0% / 15% / 20%)
- Charts (cost vs projected value, and allocation) that update as you type
- 100% client-side — your numbers are saved in your browser (`localStorage`) so they're
  still there when you come back, and they never leave your device

> **Not financial or tax advice.** Estimates are simplified U.S. federal only and may be
> inaccurate. See the in-app disclaimer.

## Run locally

It's a single static file — just open `index.html` in a browser. Or serve it:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy to GitHub Pages

1. Push these files to a GitHub repo (e.g. `stonks`).
2. In the repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   pick **`main`** / **`/ (root)`**, Save.
3. Your site goes live at `https://<you>.github.io/stonks/` within a minute.

No build step, no dependencies to install — Chart.js loads from a CDN.
