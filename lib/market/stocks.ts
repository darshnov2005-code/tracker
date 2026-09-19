// Live-ish quotes for Indian equities.
//
// NSE's public JSON API blocks server-side requests (HTTP 403 from anything that
// isn't a real browser session on a residential IP), so for NSE-listed symbols we
// read the last price from Yahoo Finance's `.NS` feed, which mirrors NSE quotes
// (~15 min delayed intraday). BSE exposes a working JSON endpoint keyed by numeric
// scrip code, which we use directly, with Yahoo's `.BO` feed as a fallback.
//
// All fetches are best-effort and can be rate-limited, so callers should handle a
// null/error result gracefully.

export type Quote = {
  symbol: string
  exchange: string
  price: number
  change: number
  changePercent: number
  name?: string
}

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
}

// Yahoo Finance chart endpoint. `suffix` is `.NS` for NSE, `.BO` for BSE.
async function fetchYahoo(symbol: string, suffix: string, exchange: string): Promise<Quote> {
  const ticker = `${symbol.trim().toUpperCase()}${suffix}`
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`,
    { headers: BROWSER_HEADERS, cache: "no-store" },
  )
  if (!res.ok) throw new Error(`Yahoo request failed: ${res.status}`)
  const data = await res.json()
  const result = data?.chart?.result?.[0]
  const meta = result?.meta
  const price = meta?.regularMarketPrice
  if (typeof price !== "number") throw new Error("Yahoo: price unavailable")
  const prevClose = typeof meta?.chartPreviousClose === "number" ? meta.chartPreviousClose : price
  const change = price - prevClose
  const changePercent = prevClose ? (change / prevClose) * 100 : 0
  return {
    symbol: symbol.trim().toUpperCase(),
    exchange,
    price,
    change,
    changePercent,
    name: meta?.longName || meta?.shortName,
  }
}

async function fetchBse(scripCode: string): Promise<Quote> {
  const code = scripCode.trim()
  try {
    const res = await fetch(
      `https://api.bseindia.com/BseIndiaAPI/api/getScripHeaderData/w?Debtflag=&scripcode=${encodeURIComponent(
        code,
      )}&seriesid=`,
      {
        headers: {
          ...BROWSER_HEADERS,
          Referer: "https://www.bseindia.com/",
          Origin: "https://www.bseindia.com",
        },
        cache: "no-store",
      },
    )
    if (!res.ok) throw new Error(`BSE request failed: ${res.status}`)
    const data = await res.json()
    const header = data?.Header ?? data
    const price = Number.parseFloat(header?.LTP ?? header?.CurrPrice)
    if (!Number.isFinite(price)) throw new Error("BSE: price unavailable")
    const prevClose = Number.parseFloat(header?.PrevClose ?? "0")
    const change = Number.isFinite(prevClose) ? price - prevClose : 0
    const changePercent = prevClose ? (change / prevClose) * 100 : 0
    return {
      symbol: code,
      exchange: "BSE",
      price,
      change,
      changePercent,
      name: header?.ScripName?.trim(),
    }
  } catch {
    // Fall back to Yahoo's `.BO` feed if the BSE API is unreachable.
    return fetchYahoo(code, ".BO", "BSE")
  }
}

export async function getQuote(symbol: string, exchange: string): Promise<Quote> {
  return exchange === "BSE" ? fetchBse(symbol) : fetchYahoo(symbol, ".NS", "NSE")
}
