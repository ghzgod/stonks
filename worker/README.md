# stonks-quote-proxy

A tiny Cloudflare Worker that fetches stock quotes from Yahoo Finance and adds
CORS headers so the STONKS front-end can call it directly from the browser.

**Privacy:** requests go `browser → your Worker → Yahoo`. Yahoo only sees the
Worker (with a fabricated `example.com` User-Agent), never the visitor. No API
key. It only ever proxies Yahoo's chart endpoint for validated ticker symbols —
it is not an open proxy.

## Deploy

```bash
cd worker
npx wrangler login        # one-time, opens browser to authorize your account
npx wrangler deploy
```

Wrangler prints a URL like:

```
https://stonks-quote-proxy.<your-subdomain>.workers.dev
```

## Point the site at it

Open the deployed STONKS page, open the browser console, and run **once**:

```js
localStorage.setItem('stonks_quote_proxy', 'https://stonks-quote-proxy.<your-subdomain>.workers.dev');
location.reload();
```

(Or hard-code that URL into the `QUOTE_PROXY` constant near the top of the
`<script>` in `index.html`.)

## Test it

```bash
curl 'https://stonks-quote-proxy.<your-subdomain>.workers.dev/?symbols=AAPL,MSFT'
```

You should get JSON with `price`, `regularMarketPrice`, and `previousClose`
for each symbol.
