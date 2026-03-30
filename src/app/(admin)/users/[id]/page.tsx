"use client"

import { use, useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Edit,
  WifiOff,
  CreditCard,
  Wifi,
  CalendarDays,
  Globe,
  Package,
  Save,
  Loader2,
  RefreshCcw,
  UserCheck,
  UserX,
  Eye,
  EyeOff,
  Printer,
  History
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useReactToPrint } from "react-to-print"
import { CustomerStatement } from "./CustomerStatement"
import { format } from "date-fns"

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  
  // Data States
  const [customer, setCustomer] = useState<any>(null)
  const [liveStatus, setLiveStatus] = useState<any>(null)
  const [billing, setBilling] = useState<any>(null)
  
  // UI States
  const [loading, setLoading] = useState(true)
  const [statusLoading, setStatusLoading] = useState(false)
  const [billingLoading, setBillingLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const printRef = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Customer_Statement"
  })

  // ── Fetch Billing Ledger ──
  const fetchBilling = useCallback(async () => {
    try {
      setBillingLoading(true)
      const res = await fetch(`/api/customers/${id}/billing-history`)
      if (!res.ok) return
      const data = await res.json()
      if (data.success) {
        setBilling(data)
      }
    } catch(err) {
      console.error(err)
    } finally {
      setBillingLoading(false)
    }
  }, [id])

  // ── Fetch Customer Data (Supabase) ──
  const fetchCustomer = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/customers/${id}`)
      if (!res.ok) throw new Error("Customer not found")
      const data = await res.json()
      setCustomer(data)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  // ── Fetch Live Router Status (MikroTik) ──
  const fetchLiveStatus = useCallback(async (username: string) => {
    if (!username) return
    try {
      setStatusLoading(true)
      const res = await fetch(`/api/mikrotik/customer-status/${username}`)
      if (!res.ok) throw new Error("Failed to reach router")
      const status = await res.json()
      setLiveStatus(status)
    } catch (err: any) {
      console.error("Status fetch error:", err)
    } finally {
      setStatusLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomer()
    fetchBilling()
  }, [fetchCustomer, fetchBilling])

  useEffect(() => {
    if (customer?.pppoe_username) {
      fetchLiveStatus(customer.pppoe_username)
    }
  }, [customer?.pppoe_username, fetchLiveStatus])

  // ── Actions ──
  const handleKick = async () => {
    if (!customer?.pppoe_username) return
    try {
      setActionLoading(true)
      const res = await fetch("/api/mikrotik/kick-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: customer.pppoe_username })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Kick failed")
      }
      toast.success(`Disconnected ${customer.pppoe_username}`)
      await fetchLiveStatus(customer.pppoe_username)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleSuspension = async () => {
    try {
      setActionLoading(true)
      const newStatus = customer.status === "active" ? "suspended" : "active"
      const res = await fetch(`/api/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) throw new Error("Failed to update status")
      toast.success(`Customer ${newStatus === 'active' ? 'enabled' : 'suspended'}`)
      await fetchCustomer()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setActionLoading(false)
    }
  }


  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!customer) {
    return <div className="p-8 text-center text-muted-foreground">User not found.</div>
  }

  const initials = customer.full_name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <Link
        href="/users"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Users
      </Link>

      {/* ── Profile Header Card ── */}
      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 text-lg border-2 border-muted">
              <AvatarFallback className="bg-primary/5 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight">
                  {customer.full_name}
                </h1>
                <Badge variant={customer.status === 'active' ? 'default' : 'destructive'} className="capitalize shadow-none">
                   {customer.status}
                </Badge>
                {liveStatus?.online ? (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-300 shadow-none">
                    Online
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-300 shadow-none">
                    Offline
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{customer.phone}</p>
              <p className="text-xs text-muted-foreground max-w-md">{customer.address}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button 
                variant="outline" 
                size="sm" 
                onClick={handleToggleSuspension}
                disabled={actionLoading}
            >
              {customer.status === 'active' ? (
                <><UserX className="mr-1.5 h-3.5 w-3.5" /> Suspend Account</>
              ) : (
                <><UserCheck className="mr-1.5 h-3.5 w-3.5" /> Resume Account</>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.location.href = `/users?edit=${id}`}>
              <Edit className="mr-1.5 h-3.5 w-3.5" />
              Edit Profile
            </Button>
            <Button size="sm" onClick={() => window.location.href = `/users?pay=${id}`}>
              <CreditCard className="mr-1.5 h-3.5 w-3.5" />
              Collect Payment
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="billing">Billing Ledger</TabsTrigger>
          <TabsTrigger value="sessions">Live Session</TabsTrigger>
        </TabsList>

        {/* ── Billing Ledger Tab ── */}
        <TabsContent value="billing">
          {billingLoading ? (
             <div className="flex h-[50vh] flex-col items-center justify-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Loading financial history...</p>
             </div>
          ) : billing ? (
             <div className="flex flex-col gap-6 mt-4">
                {/* Actions */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-card p-4 rounded-xl border shadow-sm gap-4">
                   <div>
                      <h2 className="text-lg font-bold tracking-tight">Financial History</h2>
                      <p className="text-sm text-muted-foreground">Statement of account and lifetime payments</p>
                   </div>
                   <Button onClick={() => handlePrint()} className="gap-2 w-full sm:w-auto">
                      <Printer className="h-4 w-4" />
                      Download Statement
                   </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                   <Card>
                      <CardHeader className="pb-2">
                         <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                           <CreditCard className="h-3 w-3" />
                           Current Due Balance
                         </CardTitle>
                      </CardHeader>
                      <CardContent>
                         <div className={`text-2xl font-black ${billing.dueBalance > 0 ? "text-red-600" : "text-emerald-600"}`}>
                            ৳{billing.dueBalance}
                         </div>
                      </CardContent>
                   </Card>
                   <Card>
                      <CardHeader className="pb-2">
                         <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                           <CalendarDays className="h-3 w-3" />
                           Monthly Package Fee
                         </CardTitle>
                      </CardHeader>
                      <CardContent>
                         <div className="text-2xl font-black text-foreground">৳{billing.monthlyFee}</div>
                      </CardContent>
                   </Card>
                   <Card>
                      <CardHeader className="pb-2">
                         <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                           <Package className="h-3 w-3 text-amber-500" />
                           Lifetime Value
                         </CardTitle>
                      </CardHeader>
                      <CardContent>
                         <div className="text-2xl font-black text-amber-500">৳{billing.lifetimeValue}</div>
                      </CardContent>
                   </Card>
                </div>

                {/* ═══ MONTHS DUE — Invoice Breakdown ═══ */}
                {billing.unpaidInvoices && billing.unpaidInvoices.length > 0 && (
                  <Card className="border-red-500/30 bg-red-500/[0.03]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2 text-red-600">
                        <CalendarDays className="h-4 w-4" />
                        Months Due
                      </CardTitle>
                      <CardDescription>
                        Outstanding invoices that require payment
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {billing.unpaidInvoices.map((inv: any) => {
                          const remaining = Number(inv.amount_due) - Number(inv.amount_paid)
                          const isPartial = inv.status === 'partial'
                          return (
                            <Badge 
                              key={inv.id} 
                              variant="outline" 
                              className={cn(
                                "px-3 py-1.5 text-sm font-semibold shadow-none",
                                isPartial 
                                  ? "border-amber-500/40 bg-amber-500/10 text-amber-700" 
                                  : "border-red-500/40 bg-red-500/10 text-red-700"
                              )}
                            >
                              {inv.billing_month}: ৳{remaining.toLocaleString()} {isPartial ? "Remaining" : "Due"}
                            </Badge>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* All Invoices Table */}
                {billing.invoices && billing.invoices.length > 0 && (
                  <Card>
                    <CardHeader className="border-b bg-muted/20 pb-4 pt-5">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-primary" />
                        Invoice History
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead>Billing Month</TableHead>
                            <TableHead className="text-right">Invoiced</TableHead>
                            <TableHead className="text-right">Paid</TableHead>
                            <TableHead className="text-right">Remaining</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {billing.invoices.map((inv: any) => {
                            const remaining = Number(inv.amount_due) - Number(inv.amount_paid)
                            return (
                              <TableRow key={inv.id}>
                                <TableCell className="font-semibold">{inv.billing_month}</TableCell>
                                <TableCell className="text-right font-mono">৳{Number(inv.amount_due).toLocaleString()}</TableCell>
                                <TableCell className="text-right font-mono text-emerald-600">৳{Number(inv.amount_paid).toLocaleString()}</TableCell>
                                <TableCell className={cn("text-right font-mono font-bold", remaining > 0 ? "text-red-600" : "text-emerald-600")}>
                                  ৳{remaining.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "capitalize shadow-none text-xs",
                                      inv.status === 'paid' && "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
                                      inv.status === 'partial' && "border-amber-500/30 bg-amber-500/10 text-amber-600",
                                      inv.status === 'unpaid' && "border-red-500/30 bg-red-500/10 text-red-600"
                                    )}
                                  >
                                    {inv.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {/* Payment Ledger Table */}
                <Card>
                   <CardHeader className="border-b bg-muted/20 pb-4 pt-5">
                      <CardTitle className="text-sm flex items-center gap-2">
                         <History className="h-4 w-4 text-primary" />
                         Payment Ledger
                      </CardTitle>
                   </CardHeader>
                   <CardContent className="p-0">
                      <Table>
                         <TableHeader>
                            <TableRow className="hover:bg-transparent">
                               <TableHead className="w-[120px]">Date</TableHead>
                               <TableHead>Description</TableHead>
                               <TableHead>Allocated Month</TableHead>
                               <TableHead>Method</TableHead>
                               <TableHead>Received By</TableHead>
                               <TableHead className="text-right">Amount (৳)</TableHead>
                            </TableRow>
                         </TableHeader>
                         <TableBody>
                            {billing.payments?.length === 0 ? (
                               <TableRow>
                                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground italic">No payment records found.</TableCell>
                               </TableRow>
                            ) : (
                               billing.payments?.map((payment: any) => {
                                  const isPartial = payment.amount < billing.monthlyFee
                                  return (
                                     <TableRow key={payment.id}>
                                        <TableCell className="font-medium whitespace-nowrap">
                                           {format(new Date(payment.created_at), "dd MMM yyyy")}
                                        </TableCell>
                                        <TableCell>
                                           <div className="flex items-center gap-2">
                                              <span>{payment.remarks || "Monthly Internet Fee Payment"}</span>
                                              {isPartial && payment.amount > 0 && (
                                                <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-600 bg-amber-500/10 hover:bg-amber-500/10 border-dashed">Partial</Badge>
                                              )}
                                              {!isPartial && payment.amount > 0 && (
                                                <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/10 border-dashed">Full</Badge>
                                              )}
                                           </div>
                                        </TableCell>
                                        <TableCell>
                                           {payment.billing_month_reference ? (
                                             <Badge variant="outline" className="text-xs border-blue-500/30 bg-blue-500/10 text-blue-700 shadow-none font-medium">
                                               {payment.billing_month_reference}
                                             </Badge>
                                           ) : (
                                             <span className="text-muted-foreground text-xs italic">—</span>
                                           )}
                                        </TableCell>
                                        <TableCell className="capitalize text-muted-foreground">{payment.payment_method || "Cash"}</TableCell>
                                        <TableCell className="text-muted-foreground">{payment.collected_by || "System"}</TableCell>
                                        <TableCell className="text-right font-bold text-foreground">
                                           ৳{payment.amount}
                                        </TableCell>
                                     </TableRow>
                                  )
                               })
                            )}
                         </TableBody>
                      </Table>
                   </CardContent>
                </Card>
             </div>
          ) : (
             <div className="text-center py-12 text-muted-foreground border rounded-lg mt-4 border-dashed">Failed to load billing history or no data available.</div>
          )}
        </TabsContent>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
              <CardDescription>Intake CRM and network information</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-primary uppercase tracking-wider">Identity & Location</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                     <p className="text-xs text-muted-foreground">Full Name</p>
                     <p className="font-medium">{customer.full_name}</p>
                  </div>
                  <div>
                     <p className="text-xs text-muted-foreground">Phone Number</p>
                     <p className="font-medium font-mono">{customer.phone}</p>
                  </div>
                  <div>
                     <p className="text-xs text-muted-foreground">NID Number</p>
                     <p className="font-medium font-mono">{customer.nid_number || "—"}</p>
                  </div>
                  <div>
                     <p className="text-xs text-muted-foreground">Address</p>
                     <p className="font-medium">{customer.address || "—"}</p>
                  </div>
                  <div>
                     <p className="text-xs text-muted-foreground">Coverage Area</p>
                     <p className="font-medium">{customer.area || "—"}</p>
                  </div>
                  <div>
                     <p className="text-xs text-muted-foreground">Assigned Collector</p>
                     <p className="font-medium">{customer.collector || "—"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-primary uppercase tracking-wider">Billing & Network</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                     <p className="text-xs text-muted-foreground">Connection Date</p>
                     <p className="font-medium">
                       {customer.billing_start_date ? new Date(customer.billing_start_date).toLocaleDateString() : (customer.created_at ? new Date(customer.created_at).toLocaleDateString() : "—")}
                     </p>
                  </div>
                  <div>
                     <p className="text-xs text-muted-foreground">Billing Check Date</p>
                     <p className="font-medium">Day {customer.billing_day || 1} of Month</p>
                  </div>
                  <div>
                     <p className="text-xs text-muted-foreground">Static IP Address</p>
                     <p className="font-medium font-mono text-xs tracking-tight bg-muted/40 p-1 rounded inline-block">
                       {customer.ip_address || "Dynamic / Auto"}
                     </p>
                  </div>
                  <div>
                     <p className="text-xs text-muted-foreground">Internet Package</p>
                     <p className="font-medium">{customer.packages?.name || "—"}</p>
                  </div>
                  <div>
                     <p className="text-xs text-muted-foreground">Monthly Bill</p>
                     <p className="font-medium">৳ {customer.monthly_bill || customer.packages?.price || 0}</p>
                  </div>
                  <div>
                     <p className="text-xs text-muted-foreground">Discount</p>
                     <p className="font-medium text-emerald-600">৳ {customer.discount || 0}</p>
                  </div>
                  <div>
                     <p className="text-xs text-muted-foreground">Grace Period</p>
                     <p className="font-medium">{customer.custom_grace_period_days || 3} days</p>
                  </div>
                  <div>
                     <p className="text-xs text-muted-foreground">PPPoE Username</p>
                     <p className="font-medium font-mono text-blue-600">{customer.pppoe_username}</p>
                  </div>
                  <div>
                     <p className="text-xs text-muted-foreground">PPPoE Password</p>
                     <div className="flex items-center gap-2">
                        <p className="font-medium font-mono">
                           {showPassword ? customer.pppoe_password : "••••••••"}
                        </p>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>
                     </div>
                  </div>
                  <div>
                     <p className="text-xs text-muted-foreground">MAC Address (Caller-ID)</p>
                     <p className="font-medium font-mono">{customer.mac_address || "—"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Live Session Tab ── */}
        <TabsContent value="sessions">
          <Card className="mt-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Active Session</CardTitle>
                <CardDescription>
                  Real-time diagnostics from the router&apos;s active list.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                 <Button variant="outline" size="sm" onClick={() => fetchLiveStatus(customer.pppoe_username)} disabled={statusLoading}>
                    <RefreshCcw className={cn("h-4 w-4 mr-2", statusLoading && "animate-spin")} />
                    Refresh
                 </Button>
                 {liveStatus?.online && (
                    <Button variant="destructive" size="sm" onClick={handleKick} disabled={actionLoading}>
                        <WifiOff className="mr-2 h-4 w-4" />
                        Force Disconnect
                    </Button>
                 )}
              </div>
            </CardHeader>
            <CardContent>
               {!liveStatus?.online ? (
                 <div className="py-12 text-center text-muted-foreground">
                    User is currently offline. No active session found.
                 </div>
               ) : (
                 <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase">Assigned IP</p>
                        <p className="text-lg font-bold font-mono">{liveStatus.address}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase">Session Uptime</p>
                        <p className="text-lg font-bold">{liveStatus.uptime}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase">Traffic In</p>
                        <p className="text-lg font-bold text-emerald-600">{(Number(liveStatus.bytesIn || 0) / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase">Traffic Out</p>
                        <p className="text-lg font-bold text-blue-600">{(Number(liveStatus.bytesOut || 0) / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                 </div>
               )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Hidden React-to-Print Component */}
      <div className="hidden">
        {customer && billing && (
          <CustomerStatement
            ref={printRef}
            customer={customer}
            payments={billing.payments || []}
            dueBalance={billing.dueBalance}
            monthlyFee={billing.monthlyFee}
            lifetimeValue={billing.lifetimeValue}
          />
        )}
      </div>
    </div>
  )
}
