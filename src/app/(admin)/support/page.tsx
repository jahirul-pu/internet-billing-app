"use client"

import { useState, useMemo } from "react"
import { MoreHorizontal, Ticket, Check, ChevronsUpDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
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
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

/* ── Mock Data ── */

interface TicketData {
  id: string
  customer: string
  category: string
  priority: "High" | "Medium" | "Low"
  status: "Open" | "In Progress" | "Resolved"
}

const tickets: TicketData[] = [
  {
    id: "TCK-1001",
    customer: "Rahim Uddin",
    category: "Fiber Cut",
    priority: "High",
    status: "Open",
  },
  {
    id: "TCK-1002",
    customer: "Fatima Akter",
    category: "Slow Speed",
    priority: "Medium",
    status: "In Progress",
  },
  {
    id: "TCK-1003",
    customer: "Kamal Hossain",
    category: "Router Issue",
    priority: "Low",
    status: "Resolved",
  },
  {
    id: "TCK-1004",
    customer: "Nasrin Sultana",
    category: "Payment Issue",
    priority: "High",
    status: "Open",
  },
  {
    id: "TCK-1005",
    customer: "Tanvir Ahmed",
    category: "Slow Speed",
    priority: "Medium",
    status: "Resolved",
  },
]

const allCustomers = [
  "Rahim Uddin",
  "Fatima Akter",
  "Kamal Hossain",
  "Nasrin Sultana",
  "Tanvir Ahmed",
  "Arif Hasan",
  "Sabrina Chowdhury",
  "Imran Khan",
]

/* ── Combobox (customer search) ── */

function CustomerCombobox({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filtered = useMemo(
    () =>
      allCustomers.filter((u) =>
        u.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className="w-full justify-between font-normal"
          />
        }
      >
        {value || "Search customer…"}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[--anchor-width] p-0">
        <div className="p-2">
          <Input
            placeholder="Type a name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />
        </div>
        <div className="max-h-48 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No customers found.
            </p>
          )}
          {filtered.map((customer) => (
            <button
              key={customer}
              type="button"
              onClick={() => {
                onChange(customer)
                setOpen(false)
                setSearch("")
              }}
              className={cn(
                "relative flex w-full cursor-default items-center gap-2 rounded-md px-3 py-1.5 text-sm outline-hidden select-none hover:bg-accent",
                value === customer && "bg-accent"
              )}
            >
              <Check
                className={cn(
                  "h-4 w-4",
                  value === customer ? "opacity-100" : "opacity-0"
                )}
              />
              {customer}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/* ── Page ── */

export default function SupportTicketsPage() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState("")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Support Tickets</h1>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger render={<Button />}>
            <Ticket className="mr-2 h-4 w-4" />
            Create Ticket
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Create Support Ticket</SheetTitle>
              <SheetDescription>
                Log a new issue or complaint for a customer.
              </SheetDescription>
            </SheetHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                setSheetOpen(false)
                setSelectedCustomer("")
              }}
              className="flex flex-col gap-6 px-4 py-4"
            >
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Customer</Label>
                  <CustomerCombobox
                    value={selectedCustomer}
                    onChange={setSelectedCustomer}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label>Issue Category</Label>
                  <Select>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fiber_cut">Fiber Cut</SelectItem>
                      <SelectItem value="slow_speed">Slow Speed</SelectItem>
                      <SelectItem value="router_issue">Router Issue</SelectItem>
                      <SelectItem value="payment_issue">Payment Issue</SelectItem>
                      <SelectItem value="other">Other / Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select defaultValue="medium">
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (Green)</SelectItem>
                      <SelectItem value="medium">Medium (Yellow)</SelectItem>
                      <SelectItem value="high">High (Red)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Problem Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the issue in detail..."
                    className="min-h-[120px]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <Button type="submit" className="w-full">
                  Save Ticket
                </Button>
                <SheetTrigger render={<Button variant="outline" className="w-full" />}>
                  Cancel
                </SheetTrigger>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Issues</CardTitle>
          <CardDescription>
            View and manage all customer complaints and technical issues.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket ID</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Issue Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-sm">{t.id}</TableCell>
                  <TableCell className="font-medium">{t.customer}</TableCell>
                  <TableCell>{t.category}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shadow-none border-transparent",
                        t.priority === "High" && "bg-red-500/15 text-red-600",
                        t.priority === "Medium" && "bg-amber-500/15 text-amber-600",
                        t.priority === "Low" && "bg-emerald-500/15 text-emerald-600"
                      )}
                    >
                      {t.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        t.status === "Open" ? "destructive" :
                        t.status === "In Progress" ? "secondary" : "default"
                      }
                      className={cn(
                        t.status === "Resolved" && "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 shadow-none"
                      )}
                    >
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Ticket</DropdownMenuItem>
                        <DropdownMenuItem>Assign Technician</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Mark as Resolved</DropdownMenuItem>
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
