"use client"

import { use, useState, useEffect, useCallback } from "react"
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

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  
  // Data States
  const [customer, setCustomer] = useState<any>(null)
  const [liveStatus, setLiveStatus] = useState<any>(null)
  
  // UI States
  const [loading, setLoading] = useState(true)
  const [statusLoading, setStatusLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [graceSaving, setGraceSaving] = useState(false)
  const [graceDays, setGraceDays] = useState<string>("")

  // Network Form State
  const [networkForm, setNetworkForm] = useState({
    pppoe_username: "",
    pppoe_password: "",
    mac_address: ""
  })

  // ── Fetch Customer Data (Supabase) ──
  const fetchCustomer = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/customers/${id}`)
      if (!res.ok) throw new Error("Customer not found")
      const data = await res.json()
      setCustomer(data)
      setGraceDays(data.custom_grace_period_days?.toString() ?? "")
      setNetworkForm({
        pppoe_username: data.pppoe_username || "",
        pppoe_password: data.pppoe_password || "",
        mac_address: data.mac_address || ""
      })
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
  }, [fetchCustomer])

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

  const handleNetworkUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setActionLoading(true)
      const res = await fetch(`/api/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(networkForm)
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Update failed")
      }
      toast.success("Network settings synced to router & database")
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
            <Button size="sm">
              <CreditCard className="mr-1.5 h-3.5 w-3.5" />
              Collect Payment
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="billing">Billing & Grace</TabsTrigger>
          <TabsTrigger value="network">Network Settings</TabsTrigger>
          <TabsTrigger value="sessions">Live Session</TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                  Internet Package
                </CardDescription>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{customer.packages?.name || "No Plan"}</div>
                <p className="text-xs text-muted-foreground mt-1">Rate limit handled by Queue Tree</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                  Monthly Rate
                </CardDescription>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{customer.packages?.price || 0} BDT</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                  Expiry Date
                </CardDescription>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                    {customer.expiry_date ? new Date(customer.expiry_date).toLocaleDateString() : "No Expiry Set"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                  PPPoE User
                </CardDescription>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold font-mono text-primary">{customer.pppoe_username}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Billing History Tab ── */}
        <TabsContent value="billing">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Grace Period Override</CardTitle>
              <CardDescription>
                Customize how many days this user can stay online after their expiry date.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  try {
                    setGraceSaving(true)
                    const res = await fetch(`/api/customers/${id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ custom_grace_period_days: graceDays ? parseInt(graceDays) : null })
                    })
                    if (!res.ok) throw new Error("Failed to save grace period")
                    toast.success("Grace period updated")
                    await fetchCustomer()
                  } catch (err: any) {
                    toast.error(err.message)
                  } finally {
                    setGraceSaving(false)
                  }
                }}
                className="flex items-end gap-4 max-w-md"
              >
                <div className="flex-1 space-y-2">
                  <Label htmlFor="gracePeriod">Days Overdue Allowed</Label>
                  <Input
                    id="gracePeriod"
                    type="number"
                    min="0"
                    placeholder="e.g. 7"
                    value={graceDays}
                    onChange={(e) => setGraceDays(e.target.value)}
                  />
                </div>
                <Button type="submit" size="sm" disabled={graceSaving}>
                   {graceSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                   Save
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Network Settings Tab ── */}
        <TabsContent value="network">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Router Configuration</CardTitle>
              <CardDescription>
                Updating these fields will immediately sync the PPPoE secret on the MikroTik router.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleNetworkUpdate} className="grid gap-6 max-w-lg">
                <div className="grid gap-2">
                  <Label htmlFor="pppoe-user">PPPoE Username</Label>
                  <Input 
                    id="pppoe-user" 
                    value={networkForm.pppoe_username} 
                    onChange={(e) => setNetworkForm({...networkForm, pppoe_username: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pppoe-pwd">PPPoE Password</Label>
                  <Input
                    id="pppoe-pwd"
                    type="password"
                    value={networkForm.pppoe_password}
                    onChange={(e) => setNetworkForm({...networkForm, pppoe_password: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mac-addr">MAC Address (Caller-ID)</Label>
                  <Input
                    id="mac-addr"
                    value={networkForm.mac_address}
                    onChange={(e) => setNetworkForm({...networkForm, mac_address: e.target.value})}
                    placeholder="e.g. AA:BB:CC:DD:EE:FF"
                    className="font-mono"
                  />
                </div>
                <Button type="submit" className="w-fit" disabled={actionLoading}>
                   {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wifi className="mr-2 h-4 w-4" />}
                   Sync to Router
                </Button>
              </form>
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
    </div>
  )
}
