import { getQuote } from "@/lib/market/stocks"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get("symbol")
  const exchange = searchParams.get("exchange") ?? "NSE"
  if (!symbol) {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 })
  }
  try {
    const quote = await getQuote(symbol, exchange)
    return NextResponse.json(quote)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch quote" },
      { status: 502 },
    )
  }
}
