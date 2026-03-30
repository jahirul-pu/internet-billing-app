"use client"

import { useState } from "react"
import { format } from "date-fns"
import { 
  Calendar as CalendarIcon, 
  MoreHorizontal, 
  Plus, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Receipt,
  FileText
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { useEffect, useCallback } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

/* ── Mock Data ── */

interface ExpenseItem {
  id: string
  date: string
  category: "Upstream Bandwidth" | "Payroll" | "Office Rent" | "Fuel/Transport" | "Hardware/Equipment" | "Other"
  description: string
  amount: number
}

const mockExpenses: ExpenseItem[] = []

export default function AccountingPage() {
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [date, setDate] = useState<Date>()
  const [loading, setLoading] = useState(true)
  const [revenue, setRevenue] = useState(0)

  const fetchFinancials = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/analytics/revenue')
      const data = await res.json()
      if (data.success) {
        setRevenue(data.summary.collected)
      }
    } catch (err) {
      console.error("Failed to fetch accounting data:", err)
      toast.error("Could not sync revenue data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFinancials()
  }, [fetchFinancials])

  // Calculations for KPI Cards
  const totalRevenue = revenue
  const totalExpenses = mockExpenses.reduce((sum, item) => sum + item.amount, 0)
  const netProfit = totalRevenue - totalExpenses

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Accounting & Expenses</h1>
          <p className="text-muted-foreground text-sm">
            Track upstream bandwidth costs, payroll, operational expenses, and calculate net profit.
          </p>
        </div>

        {/* ── Record Expense Dialog ── */}
        <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            Record Expense
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Log New Expense</DialogTitle>
              <DialogDescription>
                Record operational outflows to update your Profit & Loss statement.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setExpenseOpen(false)
              }}
            >
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Date of Expense</Label>
                  <Popover>
                    <PopoverTrigger render={<Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    />}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="category">Expense Category</Label>
                  <Select defaultValue="bandwidth">
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category">
                        Upstream Bandwidth (IIG/ITC)
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bandwidth">Upstream Bandwidth (IIG/ITC)</SelectItem>
                      <SelectItem value="payroll">Payroll & Salaries</SelectItem>
                      <SelectItem value="rent">Office Rent</SelectItem>
                      <SelectItem value="fuel">Fuel / Transport</SelectItem>
                      <SelectItem value="hardware">Hardware / Equipment</SelectItem>
                      <SelectItem value="other">Other / Miscellaneous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" placeholder="e.g. Earth Telecommunication IIG Bill" />
                </div>

                <div className="grid gap-2 border-t pt-4">
                  <Label htmlFor="amount">Amount (BDT)</Label>
                  <Input id="amount" type="number" placeholder="e.g. 50000" min={1} required />
                </div>
              </div>

              <DialogFooter className="mt-2">
                <Button type="button" variant="outline" onClick={() => setExpenseOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Log Expense</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Financial Overview Cards ── */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue (This Month)</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} ৳</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Generated from user subscriptions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses (This Month)</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {totalExpenses.toLocaleString()} ৳
            </div>
            <p className="text-xs text-muted-foreground mt-1">Operational outflows and bills</p>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-primary/20",
          netProfit >= 0 ? "bg-emerald-500/5 border-emerald-500/20" : "bg-destructive/5 border-destructive/20"
        )}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={cn("text-sm font-bold", netProfit >= 0 ? "text-emerald-700" : "text-destructive")}>
              Net Profit Flow
            </CardTitle>
            <Wallet className={cn("h-4 w-4", netProfit >= 0 ? "text-emerald-600" : "text-destructive")} />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-10 w-40" />
            ) : (
              <div className={cn(
                "text-3xl font-black",
                netProfit >= 0 ? "text-emerald-600" : "text-destructive"
              )}>
                {netProfit >= 0 ? "+" : ""}{netProfit.toLocaleString()} ৳
              </div>
            )}
            <p className={cn("text-xs font-medium mt-1", netProfit >= 0 ? "text-emerald-700/80" : "text-destructive/80")}>
              Revenue minus calculated expenses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Expense Ledger Data Table ── */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Ledger</CardTitle>
          <CardDescription>
            Detailed registry of your monthly spending categorized by type.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="w-[40%]">Description</TableHead>
                <TableHead className="text-right">Amount (BDT)</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {format(new Date(expense.date), "dd MMM, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-muted shadow-none whitespace-nowrap">
                      {expense.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{expense.description}</TableCell>
                  <TableCell className="text-right font-mono font-medium text-destructive">
                    -{expense.amount.toLocaleString()} ৳
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <FileText className="mr-2 h-4 w-4" />
                          View Receipt Attached
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive">
                          Delete Record
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
