"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { MoreHorizontal, UserPlus, FileWarning, RefreshCcw } from "lucide-react"
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
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function UsersPage() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form State
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address: "",
    pppoe_username: "",
    pppoe_password: "",
    ip_address: "",
    package_id: ""
  })

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [custRes, pkgRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/packages')
      ])
      
      const custData = await custRes.json()
      const pkgData = await pkgRes.json()

      if (custRes.ok) setCustomers(custData)
      if (pkgRes.ok) setPackages(pkgData)
    } catch (e) {
      console.error("Failed loading data", e)
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
      // Hardcode expiry to exactly 30 days dynamically out of creation
      const defaultExpiry = new Date()
      defaultExpiry.setDate(defaultExpiry.getDate() + 30)

      const payload = {
        ...formData,
        status: "active",
        expiry_date: defaultExpiry.toISOString()
      }

      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const responseData = await response.json()

      if (!response.ok) {
        alert(`Error: ${responseData.error}`)
        return
      }

      // Success
      alert('✅ Customer Created Successfully')
      setSheetOpen(false)
      loadData() // Refresh ledger table natively 
      
      // Reset defaults cleanly
      setFormData({
        full_name: "",
        phone: "",
        address: "",
        pppoe_username: "",
        pppoe_password: "",
        ip_address: "",
        package_id: ""
      })
    } catch (e) {
      alert("Unexpected failure during network request.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger render={<Button />}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add New User
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>New Customer Registration</SheetTitle>
              <SheetDescription>
                Fill in the details below to register a new subscriber.
              </SheetDescription>
            </SheetHeader>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6 px-4 pb-4 mt-6">
              {/* ── Personal Details ── */}
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold tracking-tight">Personal Details</h3>
              </div>
              <Separator />
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName" 
                    placeholder="e.g. Rahim Uddin" 
                    required 
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="e.g. 01712-345678"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Full Address</Label>
                  <Input
                    id="address"
                    placeholder="House, Road, Area, City"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>

              {/* ── Network Details ── */}
              <div className="flex flex-col gap-1 pt-2">
                <h3 className="text-sm font-semibold tracking-tight">Network Details</h3>
              </div>
              <Separator />
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="pppoeUser">PPPoE Username</Label>
                    <Input 
                      id="pppoeUser" 
                      placeholder="e.g. rahim_uddin" 
                      required
                      value={formData.pppoe_username}
                      onChange={(e) => setFormData({ ...formData, pppoe_username: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pppoePwd">PPPoE Password</Label>
                    <Input
                      id="pppoePwd"
                      type="password"
                      placeholder="••••••••"
                      required
                      value={formData.pppoe_password}
                      onChange={(e) => setFormData({ ...formData, pppoe_password: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ipAddr">
                    IP Address <span className="text-muted-foreground font-normal">(leave blank for dynamic)</span>
                  </Label>
                  <Input
                    id="ipAddr"
                    placeholder="e.g. 10.0.0.120"
                    value={formData.ip_address}
                    onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Internet Package</Label>
                  <Select required onValueChange={(val: any) => setFormData({ ...formData, package_id: val })}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a package" />
                    </SelectTrigger>
                    <SelectContent>
                      {packages.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground flex items-center">
                          <FileWarning className="w-4 h-4 mr-2"/> No packages currently loaded in database
                        </div>
                      ) : (
                        packages.map((pkg) => (
                          <SelectItem key={pkg.id} value={pkg.id}>
                            {pkg.name} — {pkg.price} ৳
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
                {isSubmitting ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? "Provisioning Link..." : "Create Account"}
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Subscribers</CardTitle>
          <CardDescription>
            Manage subscriber accounts, packages, and connection status pulled live from your PostgreSQL ledger.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <RefreshCcw className="animate-spin h-6 w-6 mr-3 text-primary/60" /> 
              Synchronizing with database...
            </div>
          ) : customers.length === 0 ? (
             <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No active users detected in database. Create your first profile!
             </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Package Target</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <Link href={`/users/${user.id}`} className="hover:underline">
                        {user.full_name}
                      </Link>
                      <div className="text-xs text-muted-foreground font-normal tracking-wider mt-0.5">
                        {user.pppoe_username}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {user.ip_address || "Dynamic (Pool)"}
                    </TableCell>
                    <TableCell>
                       {user.packages ? user.packages.name : "Unmapped Plan"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          user.status === "active"
                            ? "bg-emerald-500/15 text-emerald-600 border-emerald-200 shadow-none capitalize"
                            : "bg-destructive/10 text-destructive border-destructive/20 shadow-none capitalize"
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => window.location.href = `/users/${user.id}`}>
                             View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem>View Billing</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive">
                            Suspend Connection
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
