import { date, numeric, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core"

export const stocks = pgTable("stocks", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  exchange: text("exchange").notNull().default("NSE"),
  name: text("name"),
  quantity: numeric("quantity").notNull().default("0"),
  avgPrice: numeric("avg_price").notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const mutualFunds = pgTable("mutual_funds", {
  id: serial("id").primaryKey(),
  schemeCode: text("scheme_code").notNull(),
  schemeName: text("scheme_name").notNull(),
  units: numeric("units").notNull().default("0"),
  invested: numeric("invested").notNull().default("0"),
  sipAmount: numeric("sip_amount").notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  assetType: text("asset_type").notNull(), // STOCK | MF
  assetId: numeric("asset_id").notNull(),
  txType: text("tx_type").notNull(), // BUY | SELL
  quantity: numeric("quantity").notNull(),
  price: numeric("price").notNull(),
  fees: numeric("fees").notNull().default("0"),
  tradeDate: date("trade_date").notNull(),
  notes: text("notes"),
  realizedPnl: numeric("realized_pnl"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  targetAmount: numeric("target_amount").notNull().default("0"),
  targetDate: date("target_date"),
  kind: text("kind").notNull().default("both"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export type Stock = typeof stocks.$inferSelect
export type MutualFund = typeof mutualFunds.$inferSelect
export type Transaction = typeof transactions.$inferSelect
export type Goal = typeof goals.$inferSelect
