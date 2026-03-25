"use client"

import { useState, useMemo, useEffect } from "react"
import { format } from "date-fns"
import { CalendarIcon, Receipt, Check, ChevronsUpDown, RefreshCcw } from "lucide-react"
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
    () =>
      users.filter((u) =>
        u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
        u.pppoe_username?.toLowerCase().includes(search.toLowerCase())
      ),
    [search, users]
  )
  
  const selectedUser = users.find(u => u.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger 
        render={<Button
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
                "relative flex w-full cursor-default items-center gap-2 rounded-md px-3 py-2 text-sm outline-hidden select-none hover:bg-accent",
                value === user.id && "bg-accent"
              )}
            >
              <Check
                className={cn(
                  "h-4 w-4 text-primary",
                  value === user.id ? "opacity-100" : "opacity-0"
                )}
              />
              <div className="flex flex-col items-start gap-0.5text-left">
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

/* ── Date Picker ── */

function DatePicker({
  date,
  onSelect,
}: {
  date: Date | undefined
  onSelect: (d: Date | undefined) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger 
         render={<Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
         />}
      >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : "Pick a date"}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            onSelect(d)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

/* ── Page ── */

export default function BillingPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  
  const [transactions, setTransactions] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form payload
  const [selectedUser, setSelectedUser] = useState("")
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("")
  const [transactionType, setTransactionType] = useState("monthly_bill")
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date())

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [txRes, usersRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/customers')
      ])

      const txData = await txRes.json()
      const userData = await usersRes.json()

      if (txRes.ok) setTransactions(txData)
      if (usersRes.ok) setUsers(userData)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!selectedUser) { alert("Please select a customer."); return; }
      if (!amount) { alert("Please enter the amount."); return; }
      if (!method) { alert("Please select a payment method."); return; }

      const payload = {
        customer_id: selectedUser,
        amount: parseFloat(amount),
        payment_method: method,
        transaction_type: transactionType,
        status: "completed",       
        reference_id: `POS-${Math.random().toString(36).substring(7).toUpperCase()}`,
        // Note: For actual date recording using specific timestamps, we'd pass it in payload if supported 
        // by the backend, but backend inherently stamps created_at = now() via Postgres default natively
      }

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const responseData = await response.json()

      if (!response.ok) {
        alert(`Error: ${responseData.error}`)
        return
      }

      // Success Automation Response handled
      alert(`✅ Transaction Processed! +30 Days automatically added to Customer bounds. \n\nNew Expiration Timeline: ${format(new Date(responseData.new_expiry), "PPP")}`)
      
      setDialogOpen(false)
      loadData()
      
      // Cleanup
      setSelectedUser("")
      setAmount("")
      setMethod("")

    } catch (e) {
      console.error(e)
      alert("System runtime error generating ledger sync.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
              <Receipt className="mr-2 h-4 w-4" />
              Record Payment
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Manually log a payment. Submitting this safely extends the user timeline automatically (+30 Days).
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 mt-2">
              <div className="grid gap-2">
                <Label>Select User</Label>
                <UserCombobox
                  users={users}
                  value={selectedUser}
                  onChange={setSelectedUser}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="txType">Transaction Type</Label>
                <Select value={transactionType} onValueChange={(val: any) => setTransactionType(val)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly_bill">Monthly Renewal</SelectItem>
                    <SelectItem value="new_connection">New Connection Setup</SelectItem>
                    <SelectItem value="hardware_fee">Hardware / ONU Penalty</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="amount">Amount (BDT)</Label>
                <Input 
                   id="amount" 
                   type="number" 
                   placeholder="e.g. 1200" 
                   value={amount}
                   onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label>Payment Method</Label>
                <Select value={method} onValueChange={(val: any) => setMethod(val)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select routing method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash Offset</SelectItem>
                    <SelectItem value="bkash">bKash Integration</SelectItem>
                    <SelectItem value="nagad">Nagad Transfer</SelectItem>
                    <SelectItem value="bank">Bank / Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Log Date</Label>
                <DatePicker date={paymentDate} onSelect={setPaymentDate} />
              </div>
              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                   {isSubmitting ? <RefreshCcw className="animate-spin h-4 w-4 mr-2" /> : null}
                   {isSubmitting ? "Syncing..." : "Save Payment"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Global Ledger Tracking</CardTitle>
          <CardDescription>
            Every transaction accurately populated live referencing cross-checked customer UUIDs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="h-48 flex items-center justify-center text-muted-foreground">
                <RefreshCcw className="animate-spin h-6 w-6 mr-3 text-emerald-500/60" /> 
                Fetching Ledger Histories...
             </div>
          ) : transactions.length === 0 ? (
             <div className="h-48 flex flex-col items-center justify-center text-muted-foreground text-sm">
                <Receipt className="h-8 w-8 mb-3 opacity-20" />
                No transactions recorded in the system. Log your first payment!
             </div>
          ) : (
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference POS</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date / Timestamp</TableHead>
                  <TableHead>Amount Processed</TableHead>
                  <TableHead>Payment Type</TableHead>
                  <TableHead>Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell className="font-mono text-xs uppercase tracking-widest opacity-70">
                      {txn.reference_id || txn.id.substring(0,8)}
                    </TableCell>
                    <TableCell>
                       <div className="font-medium">{txn.customer ? txn.customer.full_name : "Deleted User"}</div>
                       {txn.customer && <div className="text-[10px] text-muted-foreground tracking-wider">{txn.customer.pppoe_username}</div>}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(txn.created_at), "PPP")}
                    </TableCell>
                    <TableCell className="font-bold">
                       {txn.amount} ৳
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "shadow-none uppercase tracking-wider text-[10px]",
                          txn.payment_method === "bkash" && "border-pink-300 bg-pink-500/10 text-pink-600",
                          txn.payment_method === "cash" && "border-emerald-300 bg-emerald-500/10 text-emerald-600",
                          txn.payment_method === "nagad" && "border-orange-300 bg-orange-500/10 text-orange-600",
                          txn.payment_method === "bank" && "border-blue-300 bg-blue-500/10 text-blue-600"
                        )}
                      >
                        {txn.payment_method}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "shadow-none capitalize",
                          txn.transaction_type === "new_connection" && "bg-amber-500/10 text-amber-600",
                          txn.transaction_type === "hardware_fee" && "bg-purple-500/10 text-purple-600"
                        )}
                      >
                        {txn.transaction_type.replace("_", " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
