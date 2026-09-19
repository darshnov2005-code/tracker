export type FifoTransaction = {
  txType: string
  quantity: string | number
  price: string | number
  fees?: string | number | null
  tradeDate: string | Date
}

export function fifoRealized(transactions: FifoTransaction[]) {
  const lots: { quantity: number; price: number }[] = []
  let realized = 0

  const ordered = [...transactions].sort((a, b) => {
    const da = new Date(a.tradeDate).getTime()
    const db = new Date(b.tradeDate).getTime()
    return da - db
  })

  for (const tx of ordered) {
    const qty = Number(tx.quantity)
    const price = Number(tx.price)
    const fees = Number(tx.fees ?? 0)
    if (!(qty > 0) || !(price >= 0)) continue

    if (tx.txType === "BUY") {
      lots.push({ quantity: qty, price })
      continue
    }

    let remaining = qty
    let cost = 0
    while (remaining > 1e-10 && lots.length) {
      const lot = lots[0]
      const used = Math.min(remaining, lot.quantity)
      cost += used * lot.price
      lot.quantity -= used
      remaining -= used
      if (lot.quantity <= 1e-10) lots.shift()
    }
    if (remaining > 1e-8) throw new Error("Sell quantity exceeds available holdings")
    realized += qty * price - cost - fees
  }

  const quantity = lots.reduce((s, l) => s + l.quantity, 0)
  const cost = lots.reduce((s, l) => s + l.quantity * l.price, 0)
  return { quantity, cost, realized }
}
