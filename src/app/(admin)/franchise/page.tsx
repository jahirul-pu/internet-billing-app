"use client"

import { useState } from "react"
import { Building2, Activity, DollarSign, MoreHorizontal, Plus, HardDrive } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const franchises: any[] = []

export default function FranchisesPage() {
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false)

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Franchise Management</h2>
        <div className="flex items-center space-x-2">
          <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
            <DialogTrigger className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
              <Plus className="h-4 w-4 mr-2" /> Register New Franchise
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Register New Franchise</DialogTitle>
                <DialogDescription>
                  Enter the details for the new B2B client and assign a dedicated VLAN.
                </DialogDescription>
              </DialogHeader>
              <form className="grid gap-4 py-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input id="companyName" placeholder="e.g. Acme Net" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerName">Owner Name</Label>
                    <Input id="ownerName" placeholder="e.g. John Doe" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input id="contactEmail" type="email" placeholder="contact@acmenet.com" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bandwidthLimit">Allocated Bandwidth</Label>
                    <Input id="bandwidthLimit" placeholder="e.g. 500 Mbps" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vlanId">VLAN ID</Label>
                    <Input id="vlanId" placeholder="e.g. VLAN-250" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthlyFee">Agreed Monthly Fee</Label>
                  <Input id="monthlyFee" type="number" placeholder="৳50,000" />
                </div>
              </form>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsRegisterDialogOpen(false)}>Cancel</Button>
                <Button type="button" onClick={() => setIsRegisterDialogOpen(false)}>Complete Registration</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Franchises
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              +0 from last quarter
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Bulk Bandwidth Sold
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 Mbps</div>
            <p className="text-xs text-muted-foreground">
              Across all active VLANs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Franchise Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳ 0</div>
            <p className="text-xs text-muted-foreground">
              Estimated MMR from B2B
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight">The Franchise Ledger</h3>
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Allocated Bandwidth</TableHead>
                <TableHead>VLAN ID</TableHead>
                <TableHead>Monthly Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {franchises.map((franchise) => (
                <TableRow key={franchise.id}>
                  <TableCell className="font-medium">{franchise.company}</TableCell>
                  <TableCell>{franchise.owner}</TableCell>
                  <TableCell className="font-semibold">{franchise.bandwidth}</TableCell>
                  <TableCell>
                    <span className="font-mono text-sm bg-muted px-2 py-1 rounded-sm">{franchise.vlanId}</span>
                  </TableCell>
                  <TableCell>{franchise.fee}</TableCell>
                  <TableCell>
                    <Badge variant={franchise.status === "Active" ? "default" : franchise.status === "Warning" ? "outline" : "destructive"}
                      className={cn(
                        franchise.status === "Active" && "bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white",
                        franchise.status === "Warning" && "border-amber-500 text-amber-500 bg-amber-50 dark:bg-amber-500/10"
                      )}
                    >
                      {franchise.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-900 border-0 focus:outline-none dark:hover:bg-slate-800 dark:hover:text-slate-100">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[200px]">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>View Usage Graph</DropdownMenuItem>
                        <DropdownMenuItem>Generate Invoice</DropdownMenuItem>
                        <DropdownMenuItem>Adjust Bandwidth Limit</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
