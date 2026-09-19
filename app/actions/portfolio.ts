"use server"

import { db } from "@/lib/db"
import { goals, mutualFunds, stocks, transactions } from "@/lib/db/schema"
import { fifoRealized } from "@/lib/transactions"
import { eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

const today = () => new Date().toISOString().slice(0, 10)

export async function getPortfolio() {
  const [stockRows, mfRows, goalRows, transactionRows] = await Promise.all([
    db.select().from(stocks).orderBy(stocks.createdAt),
    db.select().from(mutualFunds).orderBy(mutualFunds.createdAt),
    db.select().from(goals).orderBy(goals.createdAt),
    db.select().from(transactions).orderBy(transactions.tradeDate, transactions.createdAt),
  ])
  return { stocks: stockRows, mutualFunds: mfRows, goals: goalRows, transactions: transactionRows }
}

export async function addStock(input: {
  symbol: string; exchange: string; name?: string; quantity: number; avgPrice: number; tradeDate?: string
}) {
  const [row] = await db.insert(stocks).values({
    symbol: input.symbol.trim().toUpperCase(), exchange: input.exchange, name: input.name?.trim() || null,
    quantity: String(input.quantity), avgPrice: String(input.avgPrice),
  }).returning({ id: stocks.id })
  await db.insert(transactions).values({
    assetType: "STOCK", assetId: String(row.id), txType: "BUY", quantity: String(input.quantity),
    price: String(input.avgPrice), tradeDate: input.tradeDate || today(),
  })
  revalidatePath("/")
}

export async function updateStock(input: { id: number; quantity: number; avgPrice: number }) {
  await db.update(stocks).set({ quantity: String(input.quantity), avgPrice: String(input.avgPrice) }).where(eq(stocks.id, input.id))
  revalidatePath("/")
}

export async function deleteStock(id: number) {
  await db.delete(transactions).where(sql`${transactions.assetType} = 'STOCK' and ${transactions.assetId} = ${String(id)}`)
  await db.delete(stocks).where(eq(stocks.id, id)); revalidatePath("/")
}

export async function addMutualFund(input: { schemeCode: string; schemeName: string; units: number; invested: number; sipAmount: number; tradeDate?: string }) {
  const [row] = await db.insert(mutualFunds).values({
    schemeCode: input.schemeCode.trim(), schemeName: input.schemeName.trim(), units: String(input.units),
    invested: String(input.invested), sipAmount: String(input.sipAmount),
  }).returning({ id: mutualFunds.id })
  await db.insert(transactions).values({
    assetType: "MF", assetId: String(row.id), txType: "BUY", quantity: String(input.units),
    price: String(input.invested / input.units), tradeDate: input.tradeDate || today(),
  })
  revalidatePath("/")
}

export async function recordSip(input: { id: number; units: number; amount: number; tradeDate?: string }) {
  await db.update(mutualFunds).set({ units: sql`${mutualFunds.units} + ${String(input.units)}`, invested: sql`${mutualFunds.invested} + ${String(input.amount)}` }).where(eq(mutualFunds.id, input.id))
  await db.insert(transactions).values({ assetType: "MF", assetId: String(input.id), txType: "BUY", quantity: String(input.units), price: String(input.amount / input.units), tradeDate: input.tradeDate || today() })
  revalidatePath("/")
}

export async function updateMutualFund(input: { id: number; units: number; invested: number; sipAmount: number }) {
  await db.update(mutualFunds).set({ units: String(input.units), invested: String(input.invested), sipAmount: String(input.sipAmount) }).where(eq(mutualFunds.id, input.id)); revalidatePath("/")
}

export async function deleteMutualFund(id: number) {
  await db.delete(transactions).where(sql`${transactions.assetType} = 'MF' and ${transactions.assetId} = ${String(id)}`)
  await db.delete(mutualFunds).where(eq(mutualFunds.id, id)); revalidatePath("/")
}

export async function addTransaction(input: {
  assetType: "STOCK" | "MF"; assetId: number; txType: "BUY" | "SELL"; quantity: number; price: number; fees?: number; tradeDate: string; notes?: string
}) {
  if (!(input.quantity > 0) || !(input.price >= 0)) throw new Error("Invalid transaction")
  const existing = await db.select().from(transactions).where(sql`${transactions.assetType} = ${input.assetType} and ${transactions.assetId} = ${String(input.assetId)}`).orderBy(transactions.tradeDate, transactions.createdAt)
  const result = fifoRealized(existing.concat([{ ...input, fees: input.fees ?? 0 }]))
  const previous = fifoRealized(existing)
  const realizedPnl = input.txType === "SELL" ? result.realized - previous.realized : null
  if (input.txType === "SELL" && result.quantity < -1e-8) throw new Error("Sell quantity exceeds available holdings")

  await db.insert(transactions).values({ ...input, assetId: String(input.assetId), fees: String(input.fees ?? 0), realizedPnl: realizedPnl == null ? null : String(realizedPnl) })

  if (input.assetType === "STOCK") {
    const [s] = await db.select().from(stocks).where(eq(stocks.id, input.assetId))
    if (!s) throw new Error("Stock not found")
    const q = Number(s.quantity), avg = Number(s.avgPrice), qty = input.quantity
    if (input.txType === "BUY") {
      const newQty = q + qty; const newAvg = newQty ? (q * avg + qty * input.price) / newQty : 0
      await db.update(stocks).set({ quantity: String(newQty), avgPrice: String(newAvg) }).where(eq(stocks.id, input.assetId))
    } else {
      await db.update(stocks).set({ quantity: String(result.quantity), avgPrice: result.quantity ? String(result.cost / result.quantity) : "0" }).where(eq(stocks.id, input.assetId))
    }
  } else {
    const [f] = await db.select().from(mutualFunds).where(eq(mutualFunds.id, input.assetId))
    if (!f) throw new Error("Mutual fund not found")
    if (input.txType === "BUY") {
      await db.update(mutualFunds).set({ units: String(Number(f.units) + input.quantity), invested: String(Number(f.invested) + input.quantity * input.price) }).where(eq(mutualFunds.id, input.assetId))
    } else {
      await db.update(mutualFunds).set({ units: String(result.quantity), invested: String(result.cost) }).where(eq(mutualFunds.id, input.assetId))
    }
  }
  revalidatePath("/")
}

export async function deleteTransaction(id: number) {
  const [tx] = await db.select().from(transactions).where(eq(transactions.id, id))
  if (!tx) return
  const remaining = await db.select().from(transactions).where(sql`${transactions.assetType} = ${tx.assetType} and ${transactions.assetId} = ${tx.assetId} and ${transactions.id} <> ${id}`).orderBy(transactions.tradeDate, transactions.createdAt)
  const result = fifoRealized(remaining)
  if (tx.assetType === "STOCK") await db.update(stocks).set({ quantity: String(result.quantity), avgPrice: result.quantity ? String(result.cost / result.quantity) : "0" }).where(eq(stocks.id, Number(tx.assetId)))
  else await db.update(mutualFunds).set({ units: String(result.quantity), invested: String(result.cost) }).where(eq(mutualFunds.id, Number(tx.assetId)))
  await db.delete(transactions).where(eq(transactions.id, id)); revalidatePath("/")
}

export async function addGoal(input: { name: string; targetAmount: number; targetDate: string | null; kind: string }) {
  await db.insert(goals).values({ name: input.name.trim(), targetAmount: String(input.targetAmount), targetDate: input.targetDate, kind: input.kind }); revalidatePath("/")
}
export async function updateGoal(input: { id: number; name: string; targetAmount: number; targetDate: string | null; kind: string }) {
  await db.update(goals).set({ name: input.name.trim(), targetAmount: String(input.targetAmount), targetDate: input.targetDate, kind: input.kind }).where(eq(goals.id, input.id)); revalidatePath("/")
}
export async function deleteGoal(id: number) { await db.delete(goals).where(eq(goals.id, id)); revalidatePath("/") }
