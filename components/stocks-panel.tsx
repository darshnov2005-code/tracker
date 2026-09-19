"use client"

import { deleteStock } from "@/app/actions/portfolio"
import { AddStockDialog } from "@/components/add-stock-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { StockQuote } from "@/hooks/use-prices"
import type { Stock } from "@/lib/db/schema"
import { formatINR, formatNumber, formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

export function StocksPanel({
  stocks,
  quotes,
}: {
  stocks: Stock[]
  quotes: Record<number, StockQuote | null> | undefined
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">Stocks ({stocks.length})</CardTitle>
        <AddStockDialog />
      </CardHeader>
      <CardContent>
        {stocks.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No stocks yet. Add your first NSE/BSE holding to start tracking.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Avg</TableHead>
                  <TableHead className="text-right">LTP</TableHead>
                  <TableHead className="text-right">Invested</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">P&amp;L</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {stocks.map((s) => {
                  const qty = Number(s.quantity)
                  const avg = Number(s.avgPrice)
                  const invested = qty * avg
                  const q = quotes?.[s.id]
                  const ltp = q?.price
                  const current = ltp != null ? qty * ltp : invested
                  const pnl = current - invested
                  const pnlPct = invested ? (pnl / invested) * 100 : 0
                  const up = pnl >= 0
                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="flex items-center gap-1.5 font-medium">
                            {s.symbol}
                            <Badge variant="outline" className="px-1 py-0 text-[10px]">
                              {s.exchange}
                            </Badge>
                          </span>
                          <span className="line-clamp-1 text-xs text-muted-foreground">
                            {s.name || q?.name || ""}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(qty)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatINR(avg)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {ltp != null ? (
                          <div className="flex flex-col items-end">
                            <span>{formatINR(ltp)}</span>
                            <span className={cn("text-xs", up ? "text-emerald-500" : "text-rose-500")}>
                              {formatPercent(q?.changePercent ?? 0)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatINR(invested)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatINR(current)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        <div className={cn("flex flex-col items-end", up ? "text-emerald-500" : "text-rose-500")}>
                          <span>{formatINR(pnl)}</span>
                          <span className="text-xs">{formatPercent(pnlPct)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-rose-500"
                          onClick={() =>
                            startTransition(async () => {
                              await deleteStock(s.id)
                              router.refresh()
                            })
                          }
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">Delete {s.symbol}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
