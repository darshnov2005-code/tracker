import { searchSchemes } from "@/lib/market/amfi"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") ?? ""
  try {
    const results = await searchSchemes(q)
    return NextResponse.json(results)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Search failed" },
      { status: 502 },
    )
  }
}
