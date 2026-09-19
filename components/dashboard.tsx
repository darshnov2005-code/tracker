"use client"

import { FundsPanel } from "@/components/funds-panel"
import { GoalsPanel } from "@/components/goals-panel"
import { StocksPanel } from "@/components/stocks-panel"
import { TransactionsPanel } from "@/components/transactions-panel"
import { AddTransactionDialog } from "@/components/add-transaction-dialog"
import { AllocationBar, SummaryCards } from "@/components/summary-cards"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePrices } from "@/hooks/use-prices"
import type { Goal, MutualFund, Stock, Transaction } from "@/lib/db/schema"
import { fifoRealized } from "@/lib/transactions"
import { cn } from "@/lib/utils"
import { RefreshCw } from "lucide-react"

export function Dashboard({
  stocks,
  funds,
  goals,
  transactions,
}: {
  stocks: Stock[]
  funds: MutualFund[]
  goals: Goal[]
  transactions: Transaction[]
}) {
  const { prices, isValidating, refresh } = usePrices(stocks, funds)

  // Stocks valuation
  let stockInvested = 0
  let stockCurrent = 0
  for (const s of stocks) {
    const qty = Number(s.quantity)
    const invested = qty * Number(s.avgPrice)
    const ltp = prices?.stocks[s.id]?.price
    stockInvested += invested
    stockCurrent += ltp != null ? qty * ltp : invested
  }

  // Funds valuation
  let fundInvested = 0
  let fundCurrent = 0
  for (const f of funds) {
    const invested = Number(f.invested)
    const nav = prices?.funds[f.id]?.nav
    fundInvested += invested
    fundCurrent += nav != null ? Number(f.units) * nav : invested
  }

  const totalInvested = stockInvested + fundInvested
  const totalCurrent = stockCurrent + fundCurrent
  const realizedPnl = Object.values(
    transactions.reduce((groups, t) => {
      const key = `${t.assetType}:${t.assetId}`
      ;(groups[key] ||= []).push(t)
      return groups
    }, {} as Record<string, Transaction[]>)
  ).reduce((sum, rows) => sum + fifoRealized(rows).realized, 0)
  const unrealizedPnl = totalCurrent - totalInvested

  const goalValues = {
    stocks: stockCurrent,
    funds: fundCurrent,
    both: totalCurrent,
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            Investment Tracker
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live NSE/BSE prices and AMFI NAVs, auto-refreshing every minute.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refresh()}
          disabled={isValidating}
          className="gap-2 bg-transparent"
        >
          <RefreshCw className={cn("size-4", isValidating && "animate-spin")} />
          {isValidating ? "Updating" : "Refresh"}
        </Button>
      </header>

      <SummaryCards invested={totalInvested} current={totalCurrent} realized={realizedPnl} unrealized={unrealizedPnl} />
      <AllocationBar stocks={stockCurrent} funds={fundCurrent} />

      <Tabs defaultValue="holdings" className="w-full">
        <TabsList>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>
        <TabsContent value="holdings" className="mt-4 flex flex-col gap-6">
          <StocksPanel stocks={stocks} quotes={prices?.stocks} />
          <FundsPanel funds={funds} quotes={prices?.funds} />
        </TabsContent>
        <TabsContent value="transactions" className="mt-4 flex flex-col gap-4">
          <div className="flex justify-end"><AddTransactionDialog stocks={stocks} funds={funds} /></div>
          <TransactionsPanel transactions={transactions} stocks={stocks} funds={funds} />
        </TabsContent>
        <TabsContent value="goals" className="mt-4">
          <GoalsPanel goals={goals} values={goalValues} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
