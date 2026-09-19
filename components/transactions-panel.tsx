"use client"
import { deleteTransaction } from "@/app/actions/portfolio"
import type { MutualFund, Stock, Transaction } from "@/lib/db/schema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatINR, formatNumber } from "@/lib/format"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

export function TransactionsPanel({transactions,stocks,funds}:{transactions:Transaction[];stocks:Stock[];funds:MutualFund[]}){
 const router=useRouter(); const [,startTransition]=useTransition()
 const name=(t:Transaction)=>t.assetType==="STOCK"?(stocks.find(s=>s.id===Number(t.assetId))?.symbol||`Stock #${t.assetId}`):(funds.find(f=>f.id===Number(t.assetId))?.schemeName||`Fund #${t.assetId}`)
 return <Card><CardHeader><CardTitle className="text-base">Transactions ({transactions.length})</CardTitle></CardHeader><CardContent>{transactions.length===0?<p className="py-8 text-center text-sm text-muted-foreground">No transactions yet.</p>:<div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Asset</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Price/NAV</TableHead><TableHead className="text-right">Fees</TableHead><TableHead className="text-right">Realised P&amp;L</TableHead><TableHead/></TableRow></TableHeader><TableBody>{transactions.map(t=><TableRow key={t.id}><TableCell>{new Date(t.tradeDate).toLocaleDateString("en-IN")}</TableCell><TableCell className="max-w-64 truncate">{name(t)}</TableCell><TableCell>{t.txType}</TableCell><TableCell className="text-right tabular-nums">{formatNumber(Number(t.quantity))}</TableCell><TableCell className="text-right tabular-nums">{formatINR(Number(t.price))}</TableCell><TableCell className="text-right tabular-nums">{formatINR(Number(t.fees))}</TableCell><TableCell className={`text-right tabular-nums ${Number(t.realizedPnl||0)>=0?"text-emerald-500":"text-rose-500"}`}>{t.realizedPnl==null?"—":formatINR(Number(t.realizedPnl))}</TableCell><TableCell><Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-rose-500" onClick={()=>startTransition(async()=>{await deleteTransaction(t.id);router.refresh()})}><Trash2 className="size-4"/><span className="sr-only">Delete transaction</span></Button></TableCell></TableRow>)}</TableBody></Table></div>}</CardContent></Card>
}
