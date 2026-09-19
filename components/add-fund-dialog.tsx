"use client"

import { addMutualFund } from "@/app/actions/portfolio"
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
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"

type Scheme = { schemeCode: string; schemeName: string; nav: number; date: string }

export function AddFundDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [tradeDate, setTradeDate] = useState(new Date().toISOString().slice(0, 10))
  const [pending, startTransition] = useTransition()

  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Scheme[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<Scheme | null>(null)

  useEffect(() => {
    if (selected && query === selected.schemeName) return
    if (query.trim().length < 3) {
      setResults([])
      return
    }
    const controller = new AbortController()
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/mf/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        })
        if (res.ok) setResults(await res.json())
      } catch {
        /* ignore */
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => {
      controller.abort()
      clearTimeout(t)
    }
  }, [query, selected])

  function reset() {
    setQuery("")
    setResults([])
    setSelected(null)
  }

  function onSubmit(formData: FormData) {
    if (!selected) return
    const units = Number(formData.get("units"))
    const invested = Number(formData.get("invested"))
    const sipAmount = Number(formData.get("sipAmount"))
    if (!(units > 0) || !(invested > 0)) return
    startTransition(async () => {
      await addMutualFund({
        schemeCode: selected.schemeCode,
        schemeName: selected.schemeName,
        units,
        invested,
        sipAmount: sipAmount || 0,
        tradeDate,
      })
      setOpen(false)
      reset()
      router.refresh()
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <DialogTrigger render={<Button size="sm" variant="secondary" className="gap-1.5" />}>
        <Plus className="size-4" />
        Add Mutual Fund
      </DialogTrigger>
      <DialogContent>
        <form action={onSubmit}>
          <DialogHeader>
            <DialogTitle>Add mutual fund SIP</DialogTitle>
            <DialogDescription>
              Search the official AMFI scheme list, then enter the units and amount you&apos;ve invested so far.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="scheme">Scheme</Label>
              <div className="relative">
                <Input
                  id="scheme"
                  autoComplete="off"
                  placeholder="Search e.g. Parag Parikh Flexi Cap"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setSelected(null)
                  }}
                />
                {query.trim().length >= 3 && !selected && (
                  <div className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
                    {searching && <p className="px-2 py-1.5 text-sm text-muted-foreground">Searching...</p>}
                    {!searching && results.length === 0 && (
                      <p className="px-2 py-1.5 text-sm text-muted-foreground">No schemes found.</p>
                    )}
                    {results.map((r) => (
                      <button
                        type="button"
                        key={r.schemeCode}
                        onClick={() => {
                          setSelected(r)
                          setQuery(r.schemeName)
                          setResults([])
                        }}
                        className="flex w-full flex-col items-start gap-0.5 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                      >
                        <span className="line-clamp-2 leading-tight">{r.schemeName}</span>
                        <span className="text-xs text-muted-foreground">
                          NAV {r.nav} &middot; {r.date}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selected && (
                <p className="text-xs text-muted-foreground">
                  Latest NAV {selected.nav} as of {selected.date}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="units">Units held</Label>
                <Input id="units" name="units" type="number" step="any" min="0" placeholder="123.456" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invested">Total invested</Label>
                <Input id="invested" name="invested" type="number" step="any" min="0" placeholder="50000" required />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sipAmount">Monthly SIP amount (optional)</Label>
              <Input id="sipAmount" name="sipAmount" type="number" step="any" min="0" placeholder="5000" />
            </div>
          </div>
          <div className="grid gap-2 py-2">
            <Label htmlFor="tradeDate">First purchase date</Label>
            <Input id="tradeDate" type="date" value={tradeDate} onChange={(e) => setTradeDate(e.target.value)} required />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending || !selected}>
              {pending ? "Adding..." : "Add fund"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
