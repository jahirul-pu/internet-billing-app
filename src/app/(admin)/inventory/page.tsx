"use client"

import { useState } from "react"
import {
  Archive,
  MoreHorizontal,
  Plus,
  ArrowRightLeft,
  ServerCrash,
  Box,
  MonitorCheck
} from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

/* ── Mock Data ── */

interface InventoryItem {
  id: string
  name: string
  category: "Router" | "ONU" | "Fiber Roll" | "Splitter" | "Switch"
  serial: string
  status: "In Stock" | "Deployed" | "Damaged"
  assignedTo: string | null
}

const mockInventory: InventoryItem[] = []

export default function InventoryPage() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [dispatchItem, setDispatchItem] = useState<InventoryItem | null>(null)

  // Calculations for KPI Cards
  const totalInStock = mockInventory.filter((i) => i.status === "In Stock").length
  const totalDeployed = mockInventory.filter((i) => i.status === "Deployed").length
  const lowStockAlerts = 0 // Hardcoded mock alert number for visual layout

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground text-sm">
            Track hardware stock, MAC addresses, and equipment dispatch logs.
          </p>
        </div>

        {/* ── Add New Item Action ── */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Item
          </SheetTrigger>
          <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Log Hardware Stock</SheetTitle>
              <SheetDescription>
                Record incoming devices or equipment to your local inventory.
              </SheetDescription>
            </SheetHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                setSheetOpen(false)
              }}
              className="flex flex-col gap-6 px-4 py-4 mt-2"
            >
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select defaultValue="onu">
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="router">Router</SelectItem>
                      <SelectItem value="onu">ONU / ONT</SelectItem>
                      <SelectItem value="fiber">Fiber Roll</SelectItem>
                      <SelectItem value="splitter">Splitter / Box</SelectItem>
                      <SelectItem value="switch">Switch / OLT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="item-name">Item Name / Model</Label>
                  <Input id="item-name" placeholder="e.g. V-SOL 1G XPON ONU" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="serial">Serial Number / MAC Address</Label>
                  <Input id="serial" placeholder="e.g. SN-XYZ1234..." />
                </div>

                <div className="grid gap-2 mt-2 border-t pt-4">
                  <Label htmlFor="quantity">Quantity (If applicable)</Label>
                  <Input id="quantity" type="number" defaultValue={1} min={1} />
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    For bulk fiber/cable, log it as 1 item with total meterage in the name, or log multiple individual devices.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <Button type="submit" className="w-full">
                  Save to Inventory
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devices in Stock</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{totalInStock}</div>
            <p className="text-xs text-muted-foreground mt-1">Available for new connections</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devices Deployed</CardTitle>
            <MonitorCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeployed}</div>
            <p className="text-xs text-muted-foreground mt-1">Active hardware in the field</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Low Stock Alerts</CardTitle>
            <ServerCrash className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lowStockAlerts}</div>
            <p className="text-xs text-destructive/80 mt-1">ONUs and Routers running low</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Inventory Ledger Data Table ── */}
      <Card>
        <CardHeader>
          <CardTitle>Global Stock Ledger</CardTitle>
          <CardDescription>
            Complete registry of hardware and their current assignments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Serial/MAC</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockInventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.category}</TableCell>
                  <TableCell className="font-mono text-sm">{item.serial}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shadow-none font-medium border-transparent",
                        item.status === "In Stock" && "bg-emerald-500/15 text-emerald-600",
                        item.status === "Deployed" && "bg-blue-500/15 text-blue-600",
                        item.status === "Damaged" && "bg-red-500/15 text-red-600"
                      )}
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.assignedTo ? item.assignedTo : <span className="text-muted-foreground italic">Unassigned</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setDispatchItem(item)}>
                          <ArrowRightLeft className="mr-2 h-4 w-4" />
                          Dispatch Item
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive">
                          Mark as Damaged
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

      {/* ── Dispatch Dialog ── */}
      <Dialog 
        open={dispatchItem !== null} 
        onOpenChange={(isOpen) => {
          if (!isOpen) setDispatchItem(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dispatch Device</DialogTitle>
            <DialogDescription>
              Assign this hardware to a specific customer or technician.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setDispatchItem(null)
            }}
          >
            <div className="grid gap-4 py-4 bg-muted/30 -mx-6 px-6 border-y">
              <div className="flex justify-between items-center text-sm border-b pb-2 mb-2 border-primary/10">
                <span className="text-muted-foreground">Device:</span>
                <span className="font-semibold">{dispatchItem?.name}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b pb-2 mb-2 border-primary/10">
                <span className="text-muted-foreground">Serial/MAC:</span>
                <span className="font-mono">{dispatchItem?.serial}</span>
              </div>
              
              <div className="grid gap-2 mt-2">
                <Label htmlFor="assignType">Assign To Role</Label>
                <Select defaultValue="user">
                  <SelectTrigger>
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Customer (User)</SelectItem>
                    <SelectItem value="tech">Technician (For Setup)</SelectItem>
                    <SelectItem value="core">Core Network / Pop Location</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="assignTarget">Target Name / Search</Label>
                <Input id="assignTarget" placeholder="e.g. Type customer name..." autoFocus />
              </div>
            </div>
            <DialogFooter className="mt-4 text-sm text-muted-foreground">
               <div className="flex w-full justify-between items-center">
                  <span className="text-xs italic">Updates status to Deployed.</span>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setDispatchItem(null)}>
                      Cancel
                    </Button>
                    <Button type="submit">Dispatch</Button>
                  </div>
               </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
