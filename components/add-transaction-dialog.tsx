"use client"

import { addTransaction } from "@/app/actions/portfolio"
import type { MutualFund, Stock } from "@/lib/db/schema"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

export function AddTransactionDialog({ stocks, funds }: { stocks: Stock[]; funds: MutualFund[] }) {
  const router = useRouter(); const [open,setOpen]=useState(false); const [pending,startTransition]=useTransition()
  const [assetType,setAssetType]=useState<"STOCK"|"MF">("STOCK")
  const [assetId,setAssetId]=useState(""); const [txType,setTxType]=useState<"BUY"|"SELL">("BUY")
  const [tradeDate,setTradeDate]=useState(new Date().toISOString().slice(0,10))
  const assets = assetType === "STOCK" ? stocks : funds
  function submit(fd: FormData) {
    const id=Number(assetId), quantity=Number(fd.get("quantity")), price=Number(fd.get("price")), fees=Number(fd.get("fees")||0), notes=String(fd.get("notes")||"")
    if (!id || !(quantity>0) || !(price>=0) || !tradeDate) return
    startTransition(async()=>{ try { await addTransaction({assetType,assetId:id,txType,quantity,price,fees,tradeDate,notes}); setOpen(false); router.refresh() } catch(e) { alert(e instanceof Error?e.message:"Could not save transaction") } })
  }
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={<Button size="sm" variant="outline" className="gap-1.5"/>}><Plus className="size-4"/> Transaction</DialogTrigger>
    <DialogContent><form action={submit}><DialogHeader><DialogTitle>Add transaction</DialogTitle><DialogDescription>Record a buy or sale. Sale P&amp;L is calculated using FIFO cost basis.</DialogDescription></DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label>Asset type</Label><Select value={assetType} onValueChange={(v)=>{setAssetType(v as "STOCK"|"MF");setAssetId("")}}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="STOCK">Stock</SelectItem><SelectItem value="MF">Mutual fund</SelectItem></SelectContent></Select></div><div className="grid gap-2"><Label>Transaction</Label><Select value={txType} onValueChange={(v)=>setTxType(v as "BUY"|"SELL")}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="BUY">Buy</SelectItem><SelectItem value="SELL">Sell</SelectItem></SelectContent></Select></div></div>
        <div className="grid gap-2"><Label>Holding</Label><Select value={assetId} onValueChange={setAssetId}><SelectTrigger><SelectValue placeholder="Select holding"/></SelectTrigger><SelectContent>{assets.map(a=><SelectItem key={a.id} value={String(a.id)}>{assetType === "STOCK" ? `${(a as Stock).symbol} · ${(a as Stock).exchange}` : (a as MutualFund).schemeName}</SelectItem>)}</SelectContent></Select></div>
        <div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label>Date</Label><Input type="date" value={tradeDate} onChange={e=>setTradeDate(e.target.value)} required/></div><div className="grid gap-2"><Label>Quantity / Units</Label><Input name="quantity" type="number" step="any" min="0" required/></div></div>
        <div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label>{assetType === "MF" ? "NAV" : "Price"}</Label><Input name="price" type="number" step="any" min="0" required/></div><div className="grid gap-2"><Label>Fees</Label><Input name="fees" type="number" step="any" min="0" defaultValue="0"/></div></div>
        <div className="grid gap-2"><Label>Notes</Label><Input name="notes" placeholder="Optional"/></div>
      </div><DialogFooter><Button type="submit" disabled={pending || !assetId}>{pending?"Saving...":"Save transaction"}</Button></DialogFooter>
    </form></DialogContent></Dialog>
}
