"use client"

import { useState } from "react"
import { Banknote, AlertTriangle, HandCoins, Clock, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

/* ── Mock Data ── */

interface CollectionRecord {
  customer: string
  amount: number
  time: string
  method: string
}

interface StaffCollection {
  id: string
  name: string
  zone: string
  billsCollectedCount: number
  billsCollectedAmount: number
  remainingUnpaidCount: number
  remainingUnpaidAmount: number
  targetProgress: number
  heldCash: number
  collections: CollectionRecord[]
}

const mockStaffCollections: StaffCollection[] = []

export default function ShiftCollectionsPage() {
  const [handoverStaff, setHandoverStaff] = useState<StaffCollection | null>(null)
  const [detailStaff, setDetailStaff] = useState<StaffCollection | null>(null)
  const [handoverAmount, setHandoverAmount] = useState("")

  const totalCollected = mockStaffCollections.reduce((s, r) => s + r.billsCollectedAmount, 0)
  const totalUnpaid = mockStaffCollections.reduce((s, r) => s + r.remainingUnpaidAmount, 0)
  const totalHeld = mockStaffCollections.reduce((s, r) => s + r.heldCash, 0)

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Shift Collections</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track daily cash collections per staff and manage handovers.
          </p>
        </div>
        <Badge variant="outline" className="border-indigo-500 text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-sm py-1 px-3">
          <Clock className="h-3.5 w-3.5 mr-1.5" />
          Today — {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
        </Badge>
      </div>

      {/* ── Daily Summary ── */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cash Collected Today</CardTitle>
            <Banknote className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{totalCollected.toLocaleString()} ৳</div>
            <p className="text-xs text-muted-foreground">Sum of all staff collections</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Unpaid Bills</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{totalUnpaid.toLocaleString()} ৳</div>
            <p className="text-xs text-muted-foreground">Network-wide remaining</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Cash Handovers</CardTitle>
            <HandCoins className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalHeld.toLocaleString()} ৳</div>
            <p className="text-xs text-muted-foreground">Not yet remitted to admin/bank</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Staff Collection Ledger ── */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Collection Ledger</CardTitle>
          <CardDescription>Today&apos;s collection performance per employee.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Name</TableHead>
                <TableHead>Assigned Zone</TableHead>
                <TableHead>Bills Collected</TableHead>
                <TableHead>Remaining Unpaid</TableHead>
                <TableHead className="w-[180px]">Target Progress</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockStaffCollections.map((staff) => (
                <TableRow
                  key={staff.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setDetailStaff(staff)}
                >
                  <TableCell className="font-medium">{staff.name}</TableCell>
                  <TableCell>{staff.zone}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-emerald-600">{staff.billsCollectedAmount.toLocaleString()} ৳</span>
                      <span className="text-xs text-muted-foreground">{staff.billsCollectedCount} bills</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-amber-600">{staff.remainingUnpaidAmount.toLocaleString()} ৳</span>
                      <span className="text-xs text-muted-foreground">{staff.remainingUnpaidCount} bills</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={staff.targetProgress}
                        className="h-2 flex-1"
                        indicatorClassName={cn(
                          staff.targetProgress >= 80 ? "bg-emerald-500" :
                          staff.targetProgress >= 50 ? "bg-amber-500" :
                          "bg-red-500"
                        )}
                      />
                      <span className="text-xs font-medium w-8 text-right">{staff.targetProgress}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-medium"
                      onClick={(e) => {
                        e.stopPropagation()
                        setHandoverStaff(staff)
                        setHandoverAmount("")
                      }}
                    >
                      <HandCoins className="h-3.5 w-3.5 mr-1.5" />
                      Receive Cash
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Handover Dialog ── */}
      <Dialog open={handoverStaff !== null} onOpenChange={(open) => { if (!open) setHandoverStaff(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cash Handover</DialogTitle>
            <DialogDescription>
              Receive collected cash from {handoverStaff?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
              <span className="text-sm text-muted-foreground">Expected Amount:</span>
              <span className="text-lg font-bold text-emerald-600">{handoverStaff?.heldCash.toLocaleString()} ৳</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="actualAmount">Actual Amount Received (BDT)</Label>
              <Input
                id="actualAmount"
                type="number"
                placeholder="e.g. 15000"
                value={handoverAmount}
                onChange={(e) => setHandoverAmount(e.target.value)}
                autoFocus
              />
              {handoverAmount && Number(handoverAmount) !== handoverStaff?.heldCash && (
                <p className="text-xs text-red-500 font-medium">
                  ⚠ Discrepancy of {Math.abs(Number(handoverAmount) - (handoverStaff?.heldCash ?? 0)).toLocaleString()} ৳
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHandoverStaff(null)}>Cancel</Button>
            <Button onClick={() => setHandoverStaff(null)}>Confirm Transfer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Detail Sheet ── */}
      <Sheet open={detailStaff !== null} onOpenChange={(open) => { if (!open) setDetailStaff(null) }}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{detailStaff?.name} — Today&apos;s Collections</SheetTitle>
            <SheetDescription>
              Zone: {detailStaff?.zone} · {detailStaff?.billsCollectedCount} bills · {detailStaff?.billsCollectedAmount.toLocaleString()} ৳ total
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-3 px-4 py-6">
            {detailStaff?.collections.map((c, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/10">
                    <User className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{c.customer}</p>
                    <p className="text-xs text-muted-foreground">{c.time} · {c.method}</p>
                  </div>
                </div>
                <span className="font-semibold text-emerald-600">{c.amount.toLocaleString()} ৳</span>
              </div>
            ))}
            {detailStaff?.collections.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No collections recorded yet today.</p>
            )}
            <Separator className="my-2" />
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-medium text-muted-foreground">Held Cash</span>
              <span className="text-lg font-bold">{detailStaff?.heldCash.toLocaleString()} ৳</span>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
