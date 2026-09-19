"use client"

import type { MutualFund, Stock } from "@/lib/db/schema"
import useSWR from "swr"

export type StockQuote = {
  price: number
  change: number
  changePercent: number
  name?: string
}

export type NavQuote = {
  nav: number
  date: string
  schemeName: string
}

export type PriceData = {
  stocks: Record<number, StockQuote | null>
  funds: Record<number, NavQuote | null>
}

async function fetchPrices(stocks: Stock[], funds: MutualFund[]): Promise<PriceData> {
  const stockEntries = await Promise.all(
    stocks.map(async (s): Promise<[number, StockQuote | null]> => {
      try {
        const res = await fetch(
          `/api/stock?symbol=${encodeURIComponent(s.symbol)}&exchange=${s.exchange}`,
        )
        if (!res.ok) return [s.id, null]
        const q = await res.json()
        return [s.id, { price: q.price, change: q.change, changePercent: q.changePercent, name: q.name }]
      } catch {
        return [s.id, null]
      }
    }),
  )

  const fundEntries = await Promise.all(
    funds.map(async (f): Promise<[number, NavQuote | null]> => {
      try {
        const res = await fetch(`/api/mf?code=${encodeURIComponent(f.schemeCode)}`)
        if (!res.ok) return [f.id, null]
        const q = await res.json()
        return [f.id, { nav: q.nav, date: q.date, schemeName: q.schemeName }]
      } catch {
        return [f.id, null]
      }
    }),
  )

  return {
    stocks: Object.fromEntries(stockEntries),
    funds: Object.fromEntries(fundEntries),
  }
}

export function usePrices(stocks: Stock[], funds: MutualFund[]) {
  const stockKey = stocks.map((s) => `${s.id}:${s.symbol}:${s.exchange}`).join(",")
  const fundKey = funds.map((f) => `${f.id}:${f.schemeCode}`).join(",")

  const { data, isLoading, mutate, isValidating } = useSWR<PriceData>(
    ["prices", stockKey, fundKey],
    () => fetchPrices(stocks, funds),
    {
      refreshInterval: 60_000,
      revalidateOnFocus: true,
      keepPreviousData: true,
    },
  )

  return { prices: data, isLoading, isValidating, refresh: mutate }
}
