"use client"

import { Card, CardContent } from "@/components/ui/card"
import { formatINR, formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ArrowDownRight, ArrowUpRight, IndianRupee, PiggyBank, TrendingUp } from "lucide-react"

export function SummaryCards({
  invested,
  current,
  realized = 0,
  unrealized = 0,
}: {
  invested: number
  current: number
  realized?: number
  unrealized?: number
}) {
  const pnl = current - invested
  const pnlPct = invested ? (pnl / invested) * 100 : 0
  const up = pnl >= 0

  const cards = [
    {
      label: "Total invested",
      value: formatINR(invested),
      icon: PiggyBank,
      accent: "text-muted-foreground",
    },
    {
      label: "Current value",
      value: formatINR(current),
      icon: IndianRupee,
      accent: "text-muted-foreground",
    },
    {
      label: "Overall P&L",
      value: formatINR(pnl),
      sub: formatPercent(pnlPct),
      icon: up ? ArrowUpRight : ArrowDownRight,
      accent: up ? "text-emerald-500" : "text-rose-500",
    },
    { label: "Realised P&L", value: formatINR(realized), icon: ArrowUpRight, accent: realized >= 0 ? "text-emerald-500" : "text-rose-500" },
    { label: "Unrealised P&L", value: formatINR(unrealized), icon: TrendingUp, accent: unrealized >= 0 ? "text-emerald-500" : "text-rose-500" },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {c.label}
              </span>
              <span className={cn("text-2xl font-semibold tabular-nums", c.accent)}>{c.value}</span>
              {c.sub && <span className={cn("text-sm tabular-nums", c.accent)}>{c.sub}</span>}
            </div>
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full bg-muted",
                c.accent,
              )}
            >
              <c.icon className="size-5" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function AllocationBar({ stocks, funds }: { stocks: number; funds: number }) {
  const total = stocks + funds
  if (total <= 0) return null
  const stockPct = (stocks / total) * 100
  const fundPct = 100 - stockPct
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 font-medium">
            <TrendingUp className="size-4 text-muted-foreground" />
            Allocation
          </span>
          <span className="text-xs text-muted-foreground">{formatINR(total)}</span>
        </div>
        <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
          <div className="bg-chart-1" style={{ width: `${stockPct}%` }} />
          <div className="bg-chart-2" style={{ width: `${fundPct}%` }} />
        </div>
        <div className="flex gap-6 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-chart-1" />
            Stocks {stockPct.toFixed(0)}%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-chart-2" />
            Mutual funds {fundPct.toFixed(0)}%
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
