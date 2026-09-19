"use client"

import { addStock } from "@/app/actions/portfolio"
import { Button } from "@/components/ui/button"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

export function AddStockDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [exchange, setExchange] = useState("NSE")
  const [tradeDate, setTradeDate] = useState(new Date().toISOString().slice(0, 10))

  function onSubmit(formData: FormData) {
    const symbol = String(formData.get("symbol") ?? "").trim()
    const quantity = Number(formData.get("quantity"))
    const avgPrice = Number(formData.get("avgPrice"))
    const name = String(formData.get("name") ?? "")
    if (!symbol || !(quantity > 0) || !(avgPrice >= 0)) return
    startTransition(async () => {
      await addStock({ symbol, exchange, name, quantity, avgPrice, tradeDate })
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="size-4" />
        Add Stock
      </DialogTrigger>
      <DialogContent>
        <form action={onSubmit}>
          <DialogHeader>
            <DialogTitle>Add stock holding</DialogTitle>
            <DialogDescription>
              For NSE, use the trading symbol (e.g. RELIANCE, TCS). For BSE, use the numeric scrip code
              (e.g. 500325).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Exchange</Label>
                <Select value={exchange} onValueChange={setExchange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NSE">NSE</SelectItem>
                    <SelectItem value="BSE">BSE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="symbol">{exchange === "BSE" ? "Scrip code" : "Symbol"}</Label>
                <Input id="symbol" name="symbol" placeholder={exchange === "BSE" ? "500325" : "RELIANCE"} required />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Display name (optional)</Label>
              <Input id="name" name="name" placeholder="Reliance Industries" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tradeDate">Purchase date</Label>
              <Input id="tradeDate" type="date" value={tradeDate} onChange={(e) => setTradeDate(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" name="quantity" type="number" step="any" min="0" placeholder="10" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="avgPrice">Avg buy price</Label>
                <Input id="avgPrice" name="avgPrice" type="number" step="any" min="0" placeholder="2500" required />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Adding..." : "Add holding"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
