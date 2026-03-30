"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { 
  CalendarIcon, 
  Receipt, 
  Check, 
  ChevronsUpDown, 
  RefreshCcw,
  ReceiptText,
  Search,
  Wallet,
  Store,
  UserSquare2
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

/* ── Combobox (user search DB integration) ── */

function UserCombobox({
  users,
  value,
  onChange,
}: {
  users: any[]
  value: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filtered = useMemo(
    () => {
      const safeUsers = Array.isArray(users) ? users : []
      return safeUsers.filter((u) =>
        u?.full_name?.toLowerCase().includes(search.toLowerCase()) || 
        u?.pppoe_username?.toLowerCase().includes(search.toLowerCase())
      )
    },
    [search, users]
  )
  
  const selectedUser = Array.isArray(users) ? users.find(u => u.id === value) : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={
        <Button
          variant="outline"
          className="w-full justify-between font-normal"
        />}
      >
          {selectedUser ? selectedUser.full_name : "Search user…"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[--anchor-width] p-0" align="start">
        <div className="p-2">
          <Input
            placeholder="Type name or PPPoE..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />
        </div>
        <div className="max-h-48 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No users match registry criteria.
            </p>
          )}
          {filtered.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => {
                onChange(user.id)
                setOpen(false)
                setSearch("")
              }}
              className={cn(
                "relative flex w-full cursor-default items-center gap-2 rounded-md px-3 py-2 text-sm outline-none select-none hover:bg-accent",
                value === user.id && "bg-accent"
              )}
            >
              <Check
                className={cn(
                  "h-4 w-4 text-primary",
                  value === user.id ? "opacity-100" : "opacity-0"
                )}
              />
              <div className="flex flex-col items-start gap-0.5 text-left">
                <span className="font-medium text-sm leading-none">{user.full_name}</span>
                <span className="text-xs text-muted-foreground tracking-wide">{user.pppoe_username}</span>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/* ── Page ── */

export default function BillingPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Ledger States
  const [ledgerDate, setLedgerDate] = useState<Date>(new Date())
  const [collector, setCollector] = useState<string>("all")
  const [ledgerData, setLedgerData] = useState<any[]>([])
  const [isLedgerLoading, setIsLedgerLoading] = useState(true)
  const [staff, setStaff] = useState<any[]>([])

  // Form payload
  const [selectedUser, setSelectedUser] = useState("")
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("")
  
  useEffect(() => {
    // Load staff directly from the new payload
    fetch('/api/staff').then(r => r.json()).then(d => {
       if (d.data) setStaff(d.data)
    }).catch(console.error)

    // Load users for the combobox
    fetch('/api/customers').then(r => r.json()).then(d => {
       if (d.data) setUsers(Array.isArray(d.data) ? d.data : [])
    }).catch(console.error)
  }, [])

  const loadLedger = useCallback(async () => {
    setIsLedgerLoading(true)
    try {
      const dateString = format(ledgerDate, "yyyy-MM-dd")
      const url = `/api/billing/ledger?date=${dateString}&collector=${collector}&_t=${new Date().getTime()}`
      const res = await fetch(url, { cache: "no-store", headers: { "Pragma": "no-cache", "Cache-Control": "no-cache" } })
      const data = await res.json()
      if (data.success) setLedgerData(data.data || [])
    } catch (err) {
      toast.error("Network error while pulling ledger data")
    } finally {
      setIsLedgerLoading(false)
    }
  }, [ledgerDate, collector])

  useEffect(() => {
    loadLedger()
  }, [loadLedger])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!selectedUser) { toast.error("Please select a customer."); return; }
      if (!amount) { toast.error("Please enter the amount."); return; }
      if (!method) { toast.error("Please select a payment method."); return; }

      const payload = {
        customer_id: selectedUser,
        amount: parseFloat(amount),
        payment_method: method,
        collected_by: "Office"
      }

      // Hit /api/payments directly to affect Ledger & Due Balance!
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const responseData = await response.json()

      if (!response.ok) {
        toast.error(responseData.error || "Failed to log payment")
        return
      }

      toast.success("Payment Received & Debt Updated!", { 
        description: "The collection ledger has been successfully updated." 
      })
      
      setDialogOpen(false)
      loadLedger() // Refresh the view immediately!
      
      // Flush form
      setSelectedUser("")
      setAmount("")
      setMethod("")

    } catch (e) {
      console.error(e)
      toast.error("Runtime error generating ledger sync.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Pre-calculated stats based on visible ledger view
  const totalCollected = ledgerData.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  const officeCollected = ledgerData.filter(i => ["Office", "System", "Online"].includes(i.collected_by)).reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const fieldCollected = ledgerData.filter(i => !["Office", "System", "Online"].includes(i.collected_by)).reduce((s, i) => s + (Number(i.amount) || 0), 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Collection Ledger</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Aggregated daily cash flows & active balances across the entire ISP.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Receipt className="mr-2 h-4 w-4" />
            Record Payment
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Log Manual Payment</DialogTitle>
              <DialogDescription>
                Record cash/bank transfers. This immediately offsets the user's due balance and hits the Master Ledger.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 mt-2">
              <div className="grid gap-2">
                <Label>Select Subscriber</Label>
                <UserCombobox
                  users={users}
                  value={selectedUser}
                  onChange={setSelectedUser}
                />
              </div>

              <div className="grid gap-2 border-t pt-4">
                <Label htmlFor="amount">Collection Amount (BDT)</Label>
                <Input 
                   id="amount" 
                   type="number" 
                   min={1}
                   placeholder="e.g. 500" 
                   value={amount}
                   onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label>Routing / Payment Method</Label>
                <Select value={method} onValueChange={(val: any) => setMethod(val)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash Offset (Hand-to-Hand)</SelectItem>
                    <SelectItem value="bkash">bKash Integration</SelectItem>
                    <SelectItem value="nagad">Nagad Transfer</SelectItem>
                    <SelectItem value="bank">Bank Deposit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                   {isSubmitting ? <RefreshCcw className="animate-spin h-4 w-4 mr-2" /> : null}
                   {isSubmitting ? "Syncing to Ledger..." : "Register Payment"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-2 bg-muted/20 p-4 rounded-xl border mb-2">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger render={
                <Button
                  variant={"outline"}
                  className={cn("w-[180px] justify-start text-left font-normal bg-background/50", !ledgerDate && "text-muted-foreground")}
                />}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {ledgerDate ? format(ledgerDate, "PPP") : <span>Pick a date</span>}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={ledgerDate}
                  onSelect={(d) => d && setLedgerDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Select value={collector} onValueChange={(v) => setCollector(v || "all")}>
              <SelectTrigger className="w-[160px] bg-background/50">
                <SelectValue placeholder="All Collectors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Every Collector</SelectItem>
                <SelectItem value="Office">Office / Internal</SelectItem>
                {staff.map((s) => (
                    <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-emerald-500/20 bg-emerald-500/5 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">Total Validated Collections</CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
              {isLedgerLoading ? <div className="h-8 w-24 bg-emerald-500/20 animate-pulse rounded" /> : (
              <div className="text-3xl font-black text-emerald-600">
                {totalCollected.toLocaleString()} ৳
              </div>
              )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Office / Admin Intake</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Store className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            {isLedgerLoading ? <div className="h-8 w-24 bg-muted/50 animate-pulse rounded" /> : (
              <div className="text-3xl font-bold">
                {officeCollected.toLocaleString()} ৳
              </div>
              )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Field Agent Runs</CardTitle>
            <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
              <UserSquare2 className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            {isLedgerLoading ? <div className="h-8 w-24 bg-muted/50 animate-pulse rounded" /> : (
              <div className="text-3xl font-bold">
                {fieldCollected.toLocaleString()} ৳
              </div>
              )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center">
              <ReceiptText className="h-5 w-5 text-primary mr-2" />
              Ledger Transactions Drop
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLedgerLoading ? (
            <div className="h-48 flex items-center justify-center border rounded-md border-dashed border-muted-foreground/30">
                <RefreshCcw className="h-5 w-5 animate-spin text-muted-foreground/50 mr-2" />
                <p className="text-sm text-muted-foreground font-medium italic">Pulling real-time ledger syncs...</p>
            </div>
          ) : ledgerData.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center border rounded-md border-dashed border-muted-foreground/30 bg-muted/5">
                <p className="text-sm text-muted-foreground font-medium mb-1">No collections logged</p>
                <p className="text-[11px] text-muted-foreground">Adjust your filters to see historical transactions</p>
            </div>
          ) : (
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-[180px]">Time / Date</TableHead>
                    <TableHead>Customer Detail</TableHead>
                    <TableHead>Collected Amount (৳)</TableHead>
                    <TableHead>Logged Via</TableHead>
                    <TableHead className="text-right">Live Partial / Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerData.map((trx) => {
                    const customer = trx.customers || {}
                    const rawDue = Number(customer.due_balance || 0)
                    
                    const isPartial = rawDue > 0
                    const isOverpaid = rawDue < 0

                    return (
                      <TableRow key={trx.id} className="cursor-pointer group">
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                              <span className="text-sm">
                                {new Date(trx.created_at).toDateString() === new Date().toDateString() 
                                  ? "Today" 
                                  : format(new Date(trx.created_at), "MMM d, yyyy")}
                              </span>
                              <span className="text-[11px] text-muted-foreground font-mono tracking-tight mt-0.5">
                                at {format(new Date(trx.created_at), "h:mm a")}
                              </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                              <a href={`/users/${customer.id}`} className="font-semibold text-sm hover:text-primary transition-colors hover:underline decoration-primary/30">
                                {customer.full_name || "Unknown User"}
                              </a>
                              <span className="text-xs text-muted-foreground font-mono tracking-tight mt-0.5">
                                {customer.pppoe_username || "N/A"}
                              </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 py-0.5 font-bold shadow-none text-sm">
                                {Number(trx.amount).toLocaleString()} ৳
                              </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                              {(trx.collected_by === "Office" || trx.collected_by === "System") ? (
                                <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 font-bold shadow-none hover:bg-blue-500/15">
                                  {trx.collected_by}
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 font-bold shadow-none hover:bg-amber-500/15">
                                  {trx.collected_by}
                                </Badge>
                              )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isPartial && <span className="text-[10px] font-bold text-destructive uppercase tracking-widest bg-destructive/10 px-1.5 py-0.5 rounded">Partial Due</span>}
                              {isOverpaid && <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-500/10 px-1.5 py-0.5 rounded">Credit Setup</span>}
                              <span className={cn(
                                "text-sm font-bold font-mono",
                                rawDue > 0 ? "text-destructive" : "text-emerald-600"
                              )}>
                                {rawDue > 0 ? `+${rawDue.toLocaleString()} ৳` : `${Math.abs(rawDue).toLocaleString()} ৳`}
                              </span>
                            </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
