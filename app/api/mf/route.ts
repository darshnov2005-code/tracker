import { getNav } from "@/lib/market/amfi"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  if (!code) {
    return NextResponse.json({ error: "code is required" }, { status: 400 })
  }
  try {
    const scheme = await getNav(code)
    if (!scheme) {
      return NextResponse.json({ error: "Scheme not found" }, { status: 404 })
    }
    return NextResponse.json(scheme)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch NAV" },
      { status: 502 },
    )
  }
}
