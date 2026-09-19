"use client"

import { deleteMutualFund, recordSip } from "@/app/actions/portfolio"
import { AddFundDialog } from "@/components/add-fund-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { NavQuote } from "@/hooks/use-prices"
import type { MutualFund } from "@/lib/db/schema"
import { formatINR, formatNumber, formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

function RecordSipDialog({ fund, nav }: { fund: MutualFund; nav: number | undefined }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [tradeDate, setTradeDate] = useState(new Date().toISOString().slice(0, 10))

  function onSubmit(formData: FormData) {
    const amount = Number(formData.get("amount"))
    let units = Number(formData.get("units"))
    if (!(amount > 0)) return
    // If units weren't entered but we have a live NAV, derive them.
    if (!(units > 0) && nav) units = amount / nav
    if (!(units > 0)) return
    startTransition(async () => {
      await recordSip({ id: fund.id, amount, units, tradeDate })
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground" />
        }
      >
        <Plus className="size-4" />
        <span className="sr-only">Record SIP for {fund.schemeName}</span>
      </DialogTrigger>
      <DialogContent>
        <form action={onSubmit}>
          <DialogHeader>
            <DialogTitle>Record SIP installment</DialogTitle>
            <DialogDescription className="line-clamp-2">{fund.schemeName}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label htmlFor="sipDate">Investment date</Label><Input id="sipDate" type="date" value={tradeDate} onChange={(e) => setTradeDate(e.target.value)} required /></div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount invested</Label>
              <Input id="amount" name="amount" type="number" step="any" min="0" placeholder="5000" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="units">
                Units allotted {nav ? <span className="text-muted-foreground">(auto from NAV if blank)</span> : null}
              </Label>
              <Input id="units" name="units" type="number" step="any" min="0" placeholder="e.g. 8.234" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Add installment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function FundsPanel({
  funds,
  quotes,
}: {
  funds: MutualFund[]
  quotes: Record<number, NavQuote | null> | undefined
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">Mutual Funds ({funds.length})</CardTitle>
        <AddFundDialog />
      </CardHeader>
      <CardContent>
        {funds.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No funds yet. Add a scheme and log your SIPs to track NAV growth.
          </p>
        ) : (
          <ul className="flex flex-col divide-y">
            {funds.map((f) => {
              const units = Number(f.units)
              const invested = Number(f.invested)
              const q = quotes?.[f.id]
              const nav = q?.nav
              const current = nav != null ? units * nav : invested
              const pnl = current - invested
              const pnlPct = invested ? (pnl / invested) * 100 : 0
              const up = pnl >= 0
              return (
                <li key={f.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-medium leading-tight">{f.schemeName}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatNumber(units)} units
                        {nav != null ? ` · NAV ${formatNumber(nav, 4)}` : ""}
                        {Number(f.sipAmount) > 0 ? ` · SIP ${formatINR(Number(f.sipAmount), { maximumFractionDigits: 0 })}/mo` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <RecordSipDialog fund={f} nav={nav} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-rose-500"
                        onClick={() =>
                          startTransition(async () => {
                            await deleteMutualFund(f.id)
                            router.refresh()
                          })
                        }
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Delete {f.schemeName}</span>
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-end justify-between gap-4">
                    <div className="flex gap-6 text-xs">
                      <span className="flex flex-col">
                        <span className="text-muted-foreground">Invested</span>
                        <span className="tabular-nums">{formatINR(invested)}</span>
                      </span>
                      <span className="flex flex-col">
                        <span className="text-muted-foreground">Current</span>
                        <span className="tabular-nums">{formatINR(current)}</span>
                      </span>
                    </div>
                    <div className={cn("flex flex-col items-end text-sm", up ? "text-emerald-500" : "text-rose-500")}>
                      <span className="tabular-nums">{formatINR(pnl)}</span>
                      <span className="text-xs tabular-nums">{formatPercent(pnlPct)}</span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
