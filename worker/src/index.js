// Cloudflare Worker — CORS proxy for Yahoo Finance quotes.
//
// Requests flow:  visitor's browser  ->  THIS Worker  ->  Yahoo Finance.
// Yahoo only ever sees the Worker (with a fabricated User-Agent), never the
// visitor. No API key, no cookie/crumb dance — the v8 chart endpoint is used
// because it needs neither, and `includePrePost` covers pre/regular/after hours.
//
//   GET /?symbols=AAPL,MSFT
//   -> { quotes: [ { symbol, price, regularMarketPrice, previousClose,
//                    currency } | { symbol, error } ], asOf }

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (request.method !== "GET") return json({ error: "method not allowed" }, 405);

    const url = new URL(request.url);
    const raw = (url.searchParams.get("symbols") || "").trim().toUpperCase();
    if (!raw) return json({ error: "missing ?symbols=" }, 400);

    // Validate symbol shape and cap the count so this can't be repurposed as a
    // general-purpose open proxy — it only ever talks to Yahoo's chart API.
    const symbols = [
      ...new Set(
        raw.split(",").map((s) => s.trim()).filter((s) => /^[A-Z0-9.\-^=]{1,12}$/.test(s))
      ),
    ].slice(0, 25);
    if (!symbols.length) return json({ error: "no valid symbols" }, 400);

    const quotes = await Promise.all(symbols.map(fetchOne));
    return json({ quotes, asOf: Date.now() });
  },
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...CORS },
  });
}

async function fetchOne(symbol) {
  try {
    const api =
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
      `?interval=1m&range=1d&includePrePost=true`;
    const r = await fetch(api, {
      headers: {
        // Fabricated UA (RFC 2606 reserved domain) — identifies neither the
        // visitor nor the operator.
        "User-Agent": "stonks-quote-proxy/1.0 (+contact: research@example.com)",
        "Accept": "application/json",
      },
      cf: { cacheTtl: 5, cacheEverything: true }, // 5s edge cache soaks refresh bursts
    });
    if (!r.ok) return { symbol, error: `upstream ${r.status}` };

    const data = await r.json();
    const res = data && data.chart && data.chart.result && data.chart.result[0];
    const meta = res && res.meta;
    if (!meta) return { symbol, error: "no data" };

    // Latest traded price across whatever session is live = last non-null close
    // (with includePrePost this reflects pre/after-hours prints too).
    let price = typeof meta.regularMarketPrice === "number" ? meta.regularMarketPrice : null;
    const closes = res.indicators && res.indicators.quote && res.indicators.quote[0] && res.indicators.quote[0].close;
    if (Array.isArray(closes)) {
      for (let i = closes.length - 1; i >= 0; i--) {
        if (typeof closes[i] === "number") { price = closes[i]; break; }
      }
    }

    return {
      symbol,
      price,
      regularMarketPrice: typeof meta.regularMarketPrice === "number" ? meta.regularMarketPrice : null,
      previousClose:
        typeof meta.chartPreviousClose === "number" ? meta.chartPreviousClose
        : typeof meta.previousClose === "number" ? meta.previousClose
        : null,
      currency: meta.currency || null,
    };
  } catch (e) {
    return { symbol, error: String((e && e.message) || e) };
  }
}
