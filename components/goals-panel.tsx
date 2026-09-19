"use client"

import { addGoal, deleteGoal } from "@/app/actions/portfolio"
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
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Goal } from "@/lib/db/schema"
import { formatINR } from "@/lib/format"
import { Plus, Target, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

const KIND_LABEL: Record<string, string> = {
  stocks: "Stocks",
  funds: "Mutual Funds",
  both: "Overall",
}

function AddGoalDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [kind, setKind] = useState("both")

  function onSubmit(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim()
    const targetAmount = Number(formData.get("targetAmount"))
    const targetDate = String(formData.get("targetDate") ?? "").trim() || null
    if (!name || !(targetAmount > 0)) return
    startTransition(async () => {
      await addGoal({ name, targetAmount, targetDate, kind })
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="secondary" className="gap-1.5" />}>
        <Plus className="size-4" />
        Add Goal
      </DialogTrigger>
      <DialogContent>
        <form action={onSubmit}>
          <DialogHeader>
            <DialogTitle>Create a goal</DialogTitle>
            <DialogDescription>
              Set a target amount and optional target date. Progress tracks the live value of the chosen bucket.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Goal name</Label>
              <Input id="name" name="name" placeholder="Retirement, House down payment..." required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="targetAmount">Target amount</Label>
                <Input id="targetAmount" name="targetAmount" type="number" step="any" min="0" placeholder="1000000" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="targetDate">Target date</Label>
                <Input id="targetDate" name="targetDate" type="date" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Track against</Label>
              <Select value={kind} onValueChange={setKind}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Overall portfolio</SelectItem>
                  <SelectItem value="stocks">Stocks only</SelectItem>
                  <SelectItem value="funds">Mutual funds only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating..." : "Create goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function monthsUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const target = new Date(dateStr)
  if (Number.isNaN(target.getTime())) return null
  const now = new Date()
  const months =
    (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth())
  return Math.max(0, months)
}

export function GoalsPanel({
  goals,
  values,
}: {
  goals: Goal[]
  values: { stocks: number; funds: number; both: number }
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="size-4" />
          Goals ({goals.length})
        </CardTitle>
        <AddGoalDialog />
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No goals yet. Create a target amount and date to track your progress.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {goals.map((g) => {
              const target = Number(g.targetAmount)
              const current = values[g.kind as keyof typeof values] ?? values.both
              const pct = target ? Math.min(100, (current / target) * 100) : 0
              const remaining = Math.max(0, target - current)
              const months = monthsUntil(g.targetDate)
              const monthly = months && months > 0 ? remaining / months : null
              const reached = current >= target
              return (
                <div key={g.id} className="flex flex-col gap-3 rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium leading-tight">{g.name}</p>
                      <p className="text-xs text-muted-foreground">{KIND_LABEL[g.kind] ?? "Overall"}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 text-muted-foreground hover:text-rose-500"
                      onClick={() =>
                        startTransition(async () => {
                          await deleteGoal(g.id)
                          router.refresh()
                        })
                      }
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Delete {g.name}</span>
                    </Button>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Progress value={pct} className="h-2" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="tabular-nums text-muted-foreground">
                        {formatINR(current, { maximumFractionDigits: 0 })} of{" "}
                        {formatINR(target, { maximumFractionDigits: 0 })}
                      </span>
                      <span className="font-medium tabular-nums">{pct.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {reached ? (
                      <span className="font-medium text-emerald-500">Goal reached</span>
                    ) : (
                      <span>{formatINR(remaining, { maximumFractionDigits: 0 })} to go</span>
                    )}
                    {g.targetDate && (
                      <span>
                        {months} {months === 1 ? "month" : "months"} left
                      </span>
                    )}
                    {!reached && monthly && (
                      <span>
                        Need {formatINR(monthly, { maximumFractionDigits: 0 })}/mo
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
