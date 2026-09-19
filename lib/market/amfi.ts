// AMFI publishes the official daily NAV for every Indian mutual fund scheme as a
// single semicolon-delimited text file. We fetch and parse it, then cache the
// result in-memory for a few minutes so repeated lookups don't re-download it.

// The www host 302-redirects for programmatic clients; the portal host serves
// the raw text directly.
const AMFI_URL = "https://portal.amfiindia.com/spages/NAVAll.txt"
const CACHE_TTL_MS = 5 * 60 * 1000

export type AmfiScheme = {
  schemeCode: string
  schemeName: string
  nav: number
  date: string
}

type Cache = {
  at: number
  byCode: Map<string, AmfiScheme>
  list: AmfiScheme[]
}

let cache: Cache | null = null

async function load(): Promise<Cache> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache

  const res = await fetch(AMFI_URL, {
    headers: { "User-Agent": "Mozilla/5.0" },
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`AMFI request failed: ${res.status}`)

  const text = await res.text()
  const byCode = new Map<string, AmfiScheme>()
  const list: AmfiScheme[] = []

  for (const line of text.split("\n")) {
    // AMFI splits the scheme into a variable number of columns (plan/option can be
    // their own fields), but the layout is always:
    //   [0] = scheme code, [last-1] = NAV, [last] = date, and the fields between
    //   index 3 and the NAV make up the scheme name. Header/category rows have < 6
    //   fields and are skipped.
    const parts = line.split(";")
    if (parts.length < 6) continue
    const schemeCode = parts[0].trim()
    if (!/^\d+$/.test(schemeCode)) continue
    const date = parts[parts.length - 1].trim()
    const navRaw = parts[parts.length - 2].trim()
    const nav = Number.parseFloat(navRaw)
    if (!Number.isFinite(nav)) continue
    const schemeName = parts
      .slice(3, parts.length - 2)
      .map((p) => p.trim())
      .filter(Boolean)
      .join(" - ")
    if (!schemeName) continue
    const scheme: AmfiScheme = { schemeCode, schemeName, nav, date }
    byCode.set(schemeCode, scheme)
    list.push(scheme)
  }

  cache = { at: Date.now(), byCode, list }
  return cache
}

export async function getNav(schemeCode: string): Promise<AmfiScheme | null> {
  const { byCode } = await load()
  return byCode.get(schemeCode.trim()) ?? null
}

export async function searchSchemes(query: string, limit = 15): Promise<AmfiScheme[]> {
  const q = query.trim().toLowerCase()
  if (q.length < 3) return []
  const { list } = await load()
  const results: AmfiScheme[] = []
  for (const scheme of list) {
    if (scheme.schemeName.toLowerCase().includes(q)) {
      results.push(scheme)
      if (results.length >= limit) break
    }
  }
  return results
}
