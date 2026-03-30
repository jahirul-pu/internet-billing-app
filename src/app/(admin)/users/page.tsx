"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { 
  MoreHorizontal, UserPlus, FileWarning, RefreshCcw, Search, ArrowDown, ArrowUp, 
  DollarSign, Wallet2, CheckCircle2, History, Filter, X, MapPin, Shield, Wifi, CreditCard, User, Pencil, Eye, EyeOff 
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
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
import { Textarea } from "@/components/ui/textarea"
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
import { cn } from "@/lib/utils"
import { toast } from "sonner"


export default function UsersPage() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  
  // Filtering & Data State
  const [zones, setZones] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  // CRM dynamic areas & staff for the Add User form
  const [crmAreas, setCrmAreas] = useState<string[]>([])
  const [crmStaff, setCrmStaff] = useState<any[]>([])
  const [filters, setFilters] = useState({
    plan: "all",
    status: "all",
    netStatus: "all",
    billingStatus: "all",
    area: "all",
    collector: "all"
  })

  // Flyout State
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailUser, setDetailUser] = useState<any>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  
  // Traffic state
  const [trafficHistory, setTrafficHistory] = useState<any[]>([])
  const [currentTraffic, setCurrentTraffic] = useState({ download: 0, upload: 0, traffic_in: '0 B', traffic_out: '0 B' })
  const [usageHistory, setUsageHistory] = useState<any[]>([])
  
  // Billing State
  const [selectedForPayment, setSelectedForPayment] = useState<any>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isRecordingPayment, setIsRecordingPayment] = useState(false)
  const [paymentUnpaidInvoices, setPaymentUnpaidInvoices] = useState<any[]>([])
  const [targetInvoiceId, setTargetInvoiceId] = useState<string>("auto")

  // Fetch unpaid invoices when payment modal opens
  useEffect(() => {
    if (isPaymentModalOpen && selectedForPayment) {
      const fetchInvoices = async () => {
        try {
          const res = await fetch(`/api/customers/${selectedForPayment.id}/billing-history`)
          if (res.ok) {
            const data = await res.json()
            if (data.success && data.unpaidInvoices) {
              setPaymentUnpaidInvoices(data.unpaidInvoices)
            }
          }
        } catch (err) {
          console.error("Failed to fetch unpaid invoices", err)
        }
      }
      fetchInvoices()
    } else {
      setPaymentUnpaidInvoices([])
      setTargetInvoiceId("auto")
    }
  }, [selectedForPayment, isPaymentModalOpen])

  // Pagination & Search State
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [total, setTotal] = useState(0)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  const limit = 50
  
  // Form State
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    nid_number: "",
    address: "",
    area: "",
    collector: "",
    monthly_bill: "",
    discount: "0",
    billing_start_date: new Date().toISOString().split('T')[0],
    grace_period_days: "3",
    pppoe_username: "",
    pppoe_password: "",
    ip_address: "",
    package_id: ""
  })

  // Derived: filtered collectors based on selected area (from CRM staff data)
  const filteredCollectors = useMemo(() => {
    if (!formData.area) return crmStaff
    return crmStaff.filter(s => 
      (Array.isArray(s.assigned_areas) && s.assigned_areas.includes(formData.area)) || 
      (s.zone === formData.area) ||
      (s.roles && s.roles.includes('Manager')) // Just safely include anyone if they're managers too
    )
  }, [formData.area, crmStaff])

  const [editMode, setEditMode] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const openAddModal = () => {
    setEditMode(false)
    setEditingUserId(null)
    setFormData({
      full_name: "",
      phone: "",
      nid_number: "",
      address: "",
      area: "",
      collector: "",
      monthly_bill: "",
      discount: "0",
      billing_start_date: new Date().toISOString().split('T')[0],
      grace_period_days: "3",
      pppoe_username: "",
      pppoe_password: "",
      ip_address: "",
      package_id: ""
    })
    setShowPassword(false)
    setSheetOpen(true)
  }

  const openEditModal = (user: any) => {
    setEditMode(true)
    setEditingUserId(user.id)
    setFormData({
      full_name: user.full_name || "",
      phone: user.phone || "",
      nid_number: user.nid_number || "",
      address: user.address || "",
      area: user.area || "",
      collector: user.collector || "",
      monthly_bill: user.monthly_bill ? String(user.monthly_bill) : "",
      discount: user.discount ? String(user.discount) : "0",
      billing_start_date: user.billing_start_date ? new Date(user.billing_start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      grace_period_days: user.grace_period_days !== undefined ? String(user.grace_period_days) : "3",
      pppoe_username: user.pppoe_username || "",
      pppoe_password: user.pppoe_password || "",
      ip_address: user.ip_address || "",
      package_id: user.package_id || ""
    })
    setShowPassword(false)
    setSheetOpen(true)
  }

  // Deep Link Edit & Add Mode logic
  useEffect(() => {
    const handleLocationQuery = async () => {
      if (typeof window === "undefined") return
      const urlParams = new URLSearchParams(window.location.search)
      const editId = urlParams.get("edit")
      const action = urlParams.get("action")
      
      if (editId) {
        try {
          const res = await fetch(`/api/customers/${editId}`)
          if (res.ok) {
            const user = await res.json()
            // Wait slightly for packages to be populated if needed, but the form has fail-safes.
            openEditModal(user)
          }
        } catch (e) {
            console.error("Deep link edit failed", e)
        }
        // Clean URL after opening modal
        window.history.replaceState(null, "", window.location.pathname)
      } else if (action === "new") {
        openAddModal()
        // Clean URL after opening modal
        window.history.replaceState(null, "", window.location.pathname)
      }
    }
    handleLocationQuery()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // IP Auto-assignment State
  const [availableIps, setAvailableIps] = useState<string[]>([])
  const [isLoadingIps, setIsLoadingIps] = useState(false)

  // Fetch available IPs when package changes
  useEffect(() => {
    let isMounted = true;
    if (formData.package_id) {
      const pkg = packages.find(p => p.id === formData.package_id)
      if (pkg?.mikrotik_profile) {
        setIsLoadingIps(true)
        fetch(`/api/mikrotik/available-ips/${encodeURIComponent(pkg.mikrotik_profile)}`)
          .then(res => res.json())
          .then(data => {
            if (isMounted) {
              if (data.success) {
                setAvailableIps(data.available_ips || [])
              } else {
                setAvailableIps([])
              }
              setIsLoadingIps(false)
            }
          })
          .catch(err => {
            console.error("IP Fetch Error:", err)
            if (isMounted) {
              setAvailableIps([])
              setIsLoadingIps(false)
            }
          })
      }
    } else {
      setAvailableIps([])
    }
    
    return () => { isMounted = false }
  }, [formData.package_id, packages])

  // ── Data Loading ──
  const loadData = useCallback(async (pageNum = page, querySearch = search, currentFilters = filters) => {
    try {
      setIsLoading(true)
      
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: limit.toString(),
        search: querySearch,
        package_id: currentFilters.plan,
        status: currentFilters.status,
        zone_id: currentFilters.area,
        // billing_status and collector will be handled by the API if possible, or filtered on client
      })

      const [custRes, pkgRes, liveRes, zoneRes, staffRes, crmRes] = await Promise.all([
        fetch(`/api/customers?${params.toString()}`),
        fetch('/api/packages'),
        fetch('/api/mikrotik/live-sessions'),
        fetch('/api/zones'),
        fetch('/api/staff'),
        fetch('/api/crm/get-areas-staff'),
      ])
      
      const custData = await custRes.json()
      const pkgData = await pkgRes.json()
      const liveData = await liveRes.json()
      const zoneData = zoneRes.ok ? await zoneRes.json() : []
      const staffData = staffRes.ok ? await staffRes.json() : { data: [] }
      const crmData = crmRes.ok ? await crmRes.json() : { areas: [], staff: [] }

      if (custRes.ok) {
        setCustomers(custData.data || [])
        setTotal(custData.total || 0)
      }
      if (pkgRes.ok) setPackages(pkgData)
      if (liveRes.ok) {
        setOnlineUsers(new Set(liveData.online || []))
      }
      if (zoneRes.ok) setZones(zoneData)
      if (staffRes.ok) setStaff(staffData.data || [])
      // CRM dynamic data for form dropdowns
      setCrmAreas(crmData.areas || [])
      setCrmStaff(crmData.staff || [])

    } catch (e) {
      console.error("Failed loading data", e)
    } finally {
      setIsLoading(false)
    }
  }, [page, limit, filters, search])

  // Initial load
  useEffect(() => {
    loadData(1, "")
  }, []) // Empty dependency for initial load only

  // Search & Filter Effect
  useEffect(() => {
    const timer = setTimeout(() => {
        loadData(1, search, filters)
        setPage(1)
    }, 500)

    return () => clearTimeout(timer)
  }, [search, filters, loadData])

  const handleResetFilters = () => {
    setFilters({
      plan: "all",
      status: "all",
      netStatus: "all",
      billingStatus: "all",
      area: "all",
      collector: "all"
    })
    setSearch("")
  }

  const handleDetailOpen = async (user: any) => {
    setDetailUser({ ...user, live: null })
    setUsageHistory([]) // Clear previous
    setDetailOpen(true)
    setIsDetailLoading(true)
    try {
      // 1. Fetch live detail
      const res = await fetch(`/api/mikrotik/user-detail/${user.pppoe_username}`)
      const data = await res.json()
      if (res.ok && data.success) {
        setDetailUser((prev: any) => ({ ...prev, live: data.detail }))
      }

      // 2. Fetch usage history (GB)
      const usageRes = await fetch(`/api/customers/usage/${user.pppoe_username}`)
      const usageData = await usageRes.json()
      if (usageRes.ok && usageData.success) {
        setUsageHistory(usageData.history || [])
      }
    } catch (err) {
      console.error("Detail fetch failed", err)
    } finally {
      setIsDetailLoading(false)
    }
  }

  const handleRecordPayment = async (amount: number, method: string, collectedBy: string) => {
    if (!selectedForPayment) return
    setIsRecordingPayment(true)
    console.log('[DEBUG] Recording Payment:', { customer_id: selectedForPayment.id, amount, method, collected_by: collectedBy, target_invoice_id: targetInvoiceId })
    
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: selectedForPayment.id,
          amount: parseFloat(amount?.toString() || "0"),
          payment_method: method,
          collected_by: collectedBy,
          target_invoice_id: targetInvoiceId === "auto" ? null : targetInvoiceId
        })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        toast.success(`Payment of ৳${amount} recorded for ${selectedForPayment.full_name}`)
        setIsPaymentModalOpen(false)
        loadData() // Refresh status
      } else {
        console.error('[DEBUG] Payment API Error:', data)
        toast.error(data.error || "Failed to record payment.")
      }
    } catch (err: any) {
      console.error('[DEBUG] Payment Network Error:', err)
      toast.error("Network error: Could not reach payment server.")
    } finally {
      setIsRecordingPayment(false)
    }
  }

  const getBillingStatus = (user: any) => {
    const due = Number(user.due_balance || 0)
    
    // If they physically owe no money (0 or advance credit), they are Paid out.
    if (due <= 0) return 'paid'
    
    const now = new Date()
    const currentDay = now.getDate()
    const billingDay = user.billing_day || 1
    
    // If they owe money and their billing day has passed, they are Overdue.
    return currentDay >= billingDay ? 'overdue' : 'pending'
  }

  // Live Traffic Polling
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    const fetchTraffic = async () => {
      if (!detailUser?.pppoe_username || !onlineUsers.has(detailUser.pppoe_username)) return

      try {
        const res = await fetch(`/api/mikrotik/user-traffic/${detailUser.pppoe_username}`)
        const data = await res.json()
        if (res.ok && data.success) {
          const newPoint = {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            download: data.download,
            upload: data.upload
          }
          setCurrentTraffic({ download: data.download, upload: data.upload, traffic_in: data.traffic_in || '0 B', traffic_out: data.traffic_out || '0 B' })
          setTrafficHistory(prev => [...prev.slice(-19), newPoint])
        }
      } catch (e) {
        console.error("Traffic poll failed", e)
      }
    }

    if (detailOpen && detailUser && onlineUsers.has(detailUser.pppoe_username)) {
      setTrafficHistory([]) // Reset graph on open
      fetchTraffic()
      interval = setInterval(fetchTraffic, 2000)
    } else {
      setTrafficHistory([])
      setCurrentTraffic({ download: 0, upload: 0, traffic_in: '0 B', traffic_out: '0 B' })
    }

    return () => {
        if (interval) clearInterval(interval)
    }
  }, [detailOpen, detailUser?.pppoe_username, onlineUsers])

  const userChartConfig = {
    download: { label: "Download", color: "hsl(var(--chart-emerald))" },
    upload: { label: "Upload", color: "hsl(var(--chart-blue))" },
  } satisfies ChartConfig

  const handleSync = async () => {
    try {
      setIsSyncing(true)
      const res = await fetch('/api/mikrotik/sync-customers', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Sync failed")

      toast.success(`Successfully synced ${data.count} customers from the router.`)
      loadData(1) // Reset to first page to see newest imports
      setPage(1)
    } catch (err: any) {
      toast.error(err.message || "Failed to sync customers")
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const defaultExpiry = new Date()
      defaultExpiry.setDate(defaultExpiry.getDate() + 30)

      // Calculate billing_day from billing_start_date
      const billingDay = formData.billing_start_date
        ? new Date(formData.billing_start_date).getDate()
        : 1

      const method = editMode ? 'PATCH' : 'POST'
      const url = editMode ? `/api/customers/${editingUserId}` : '/api/customers'

      const payload: any = {
        ...formData,
        monthly_bill: parseFloat(formData.monthly_bill || '0'),
        discount: parseFloat(formData.discount || '0'),
        grace_period_days: parseInt(formData.grace_period_days || '3'),
        billing_day: billingDay,
      }
      
      if (!editMode) {
        payload.status = "active"
        payload.expiry_date = defaultExpiry.toISOString()
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const responseData = await response.json()

      if (!response.ok) {
        toast.error(responseData.error || (editMode ? "Failed to update customer" : "Failed to create customer"))
        return
      }

      toast.success(editMode ? 'Customer updated successfully.' : 'Customer provisioned successfully.')
      setSheetOpen(false)
      loadData(1)
      setPage(1)
      
      setFormData({
        full_name: "",
        phone: "",
        nid_number: "",
        address: "",
        area: "",
        collector: "",
        monthly_bill: "",
        discount: "0",
        billing_start_date: new Date().toISOString().split('T')[0],
        grace_period_days: "3",
        pppoe_username: "",
        pppoe_password: "",
        ip_address: "",
        package_id: ""
      })
    } catch (e) {
      toast.error("Unexpected failure during network request.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search username, name, or phone..."
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Popover>
            <PopoverTrigger render={<Button variant="outline" size="sm" className="h-9 gap-2" />}>
              <Filter className="h-4 w-4" />
              Filters
              {Object.values(filters).filter(v => v !== "all").length > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-primary text-primary-foreground pointer-events-none">
                  {Object.values(filters).filter(v => v !== "all").length}
                </Badge>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 pt-3" align="end">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-sm leading-none">Filter Records</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  onClick={handleResetFilters}
                >
                  Clear all
                </Button>
              </div>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label className="text-xs">Service Plan</Label>
                  <Select value={filters.plan} onValueChange={(v) => setFilters(f => ({ ...f, plan: v || "all" }))}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All Plans">
                        {filters.plan !== "all" ? (
                          packages.find(p => p.id === filters.plan)?.name || "Service Plan"
                        ) : "All Plans"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Plans</SelectItem>
                      {packages.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label className="text-xs">Account Status</Label>
                    <Select value={filters.status} onValueChange={(v) => setFilters(f => ({ ...f, status: v || "all" }))}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="All Statuses">
                          {{ all: "All Statuses", active: "Active", deactivated: "Deactivated", cancelled: "Cancelled" }[filters.status] || "All Statuses"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="deactivated">Deactivated</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs">Network Status</Label>
                    <Select value={filters.netStatus} onValueChange={(v) => setFilters(f => ({ ...f, netStatus: v || "all" }))}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="All">
                          {{ all: "All", online: "Online", offline: "Offline" }[filters.netStatus] || "All"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label className="text-xs">Billing Status</Label>
                    <Select value={filters.billingStatus} onValueChange={(v) => setFilters(f => ({ ...f, billingStatus: v || "all" }))}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="All">
                          {{ all: "All", paid: "Paid", overdue: "Overdue", pending: "Pending" }[filters.billingStatus] || "All"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs">Coverage Area</Label>
                    <Select value={filters.area} onValueChange={(v) => setFilters(f => ({ ...f, area: v || "all" }))}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="All Areas">
                          {filters.area && filters.area !== "all" 
                            ? zones.find(z => z.id === filters.area)?.name 
                            : "All Areas"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Areas</SelectItem>
                        {zones.map(z => (
                          <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label className="text-xs">Collector (Staff)</Label>
                  <Select value={filters.collector} onValueChange={(v) => setFilters(f => ({ ...f, collector: v || "all" }))}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All Collectors">
                        {filters.collector && filters.collector !== "all" 
                          ? staff.find(s => s.id === filters.collector)?.name 
                          : "All Collectors"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Staff</SelectItem>
                      {staff.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name} ({s.zone})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button 
            variant="outline" 
            size="sm"
            className="h-9"
            disabled={isSyncing} 
            onClick={handleSync}
          >
            {isSyncing ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            {isSyncing ? "Syncing..." : "Sync from Router"}
          </Button>

          <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
            <DialogTrigger render={<Button size="sm" className="h-9" onClick={openAddModal} />}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add New User
            </DialogTrigger>
            <DialogContent className="w-screen h-[100dvh] max-w-none sm:max-w-none m-0 rounded-none border-0 overflow-y-auto">
              <DialogHeader className="px-6 pt-6 pb-2">
                <DialogTitle className="text-xl flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <UserPlus className="h-4 w-4 text-primary" />
                  </div>
                  {editMode ? "Edit Customer Details" : "New Customer Registration"}
                </DialogTitle>
                <DialogDescription>
                  {editMode ? "Update the customer's CRM and network profiling details." : "Complete the CRM intake form below. All sections must be filled to provision a new subscriber."}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="px-6 pb-6 mt-4">
                <div className="grid md:grid-cols-2 gap-5">
                {/* ── Section 1: Identity ── */}
                <Card className="border-l-4 border-l-blue-500 shadow-sm">
                  <CardHeader className="pb-3 pt-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-md bg-blue-500/10 flex items-center justify-center">
                        <User className="h-3.5 w-3.5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">Identity</CardTitle>
                        <CardDescription className="text-[11px]">Customer personal information</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="grid gap-3">
                      <div className="grid gap-1.5">
                        <Label htmlFor="fullName" className="text-xs">Full Name</Label>
                        <Input 
                          id="fullName" 
                          placeholder="e.g. Rahim Uddin" 
                          required 
                          className="h-9"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                          <Label htmlFor="phone" className="text-xs">Phone Number</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="01712-345678"
                            required
                            className="h-9"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="nid" className="text-xs">NID Number</Label>
                          <Input
                            id="nid"
                            placeholder="National ID"
                            className="h-9"
                            value={formData.nid_number}
                            onChange={(e) => setFormData({ ...formData, nid_number: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* ── Section 2: Location & Field ── */}
                <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                  <CardHeader className="pb-3 pt-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-md bg-emerald-500/10 flex items-center justify-center">
                        <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">Location & Field</CardTitle>
                        <CardDescription className="text-[11px]">Address, area assignment & collector</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="grid gap-3">
                      <div className="grid gap-1.5">
                        <Label htmlFor="address" className="text-xs">Full Address</Label>
                        <Textarea
                          id="address"
                          placeholder="House #, Road #, Village/Area, Post Office, Upazila, District"
                          required
                          className="min-h-[64px]"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                          <Label className="text-xs">Area</Label>
                          <Select 
                            value={formData.area} 
                            onValueChange={(val) => val && setFormData({ ...formData, area: val, collector: "" })}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Select area">
                                {formData.area || undefined}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {crmAreas.length === 0 ? (
                                <div className="p-2 text-xs text-muted-foreground">No areas configured. Add areas in Staff Directory first.</div>
                              ) : (
                                crmAreas.map((area: string) => (
                                  <SelectItem key={area} value={area}>{area}</SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="text-xs">Collector</Label>
                          <Select 
                            value={formData.collector} 
                            onValueChange={(val) => val && setFormData({ ...formData, collector: val })}
                            disabled={!formData.area}
                          >
                            <SelectTrigger className={cn("h-9 text-xs", !formData.area && "opacity-50")}>
                              <SelectValue placeholder={formData.area ? "Select collector" : "Select area first"}>
                                {formData.collector || undefined}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {filteredCollectors.length === 0 ? (
                                <div className="p-2 text-xs text-muted-foreground">No collectors for this area</div>
                              ) : (
                                filteredCollectors.map((s: any) => (
                                  <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* ── Section 3: Billing Settings ── */}
                <Card className="border-l-4 border-l-amber-500 shadow-sm">
                  <CardHeader className="pb-3 pt-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-md bg-amber-500/10 flex items-center justify-center">
                        <CreditCard className="h-3.5 w-3.5 text-amber-600" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">Billing Settings</CardTitle>
                        <CardDescription className="text-[11px]">Monthly fee, discount & billing cycle</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="grid gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                          <Label htmlFor="monthlyBill" className="text-xs">
                            Monthly Bill (৳)
                            {formData.package_id && (
                              <span className="ml-1 text-[10px] text-muted-foreground font-normal">(auto-filled)</span>
                            )}
                          </Label>
                          <Input
                            id="monthlyBill"
                            type="number"
                            placeholder="0"
                            className="h-9"
                            value={formData.monthly_bill}
                            onChange={(e) => setFormData({ ...formData, monthly_bill: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="discount" className="text-xs">Discount (৳)</Label>
                          <Input
                            id="discount"
                            type="number"
                            placeholder="0"
                            className="h-9"
                            value={formData.discount}
                            onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                          <Label htmlFor="billingStart" className="text-xs">Billing Start Date</Label>
                          <Input
                            id="billingStart"
                            type="date"
                            className="h-9 text-xs"
                            value={formData.billing_start_date}
                            onChange={(e) => setFormData({ ...formData, billing_start_date: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="gracePeriod" className="text-xs">Grace Period (Days)</Label>
                          <Input
                            id="gracePeriod"
                            type="number"
                            placeholder="3"
                            className="h-9"
                            min={0}
                            max={30}
                            value={formData.grace_period_days}
                            onChange={(e) => setFormData({ ...formData, grace_period_days: e.target.value })}
                          />
                        </div>
                      </div>
                      {formData.monthly_bill && formData.discount && parseFloat(formData.discount) > 0 && (
                        <div className="flex items-center justify-between p-2.5 bg-emerald-500/5 rounded-lg border border-emerald-200/50">
                          <span className="text-[11px] text-muted-foreground">Effective Monthly Fee</span>
                          <span className="text-sm font-bold text-emerald-600">
                            ৳ {Math.max(0, parseFloat(formData.monthly_bill) - parseFloat(formData.discount))}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* ── Section 4: Network ── */}
                <Card className="border-l-4 border-l-violet-500 shadow-sm">
                  <CardHeader className="pb-3 pt-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-md bg-violet-500/10 flex items-center justify-center">
                        <Wifi className="h-3.5 w-3.5 text-violet-600" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">Network</CardTitle>
                        <CardDescription className="text-[11px]">PPPoE credentials, package & IP assignment</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="grid gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                          <Label htmlFor="pppoeUser" className="text-xs">PPPoE Username</Label>
                          <Input 
                            id="pppoeUser" 
                            placeholder="e.g. rahim_uddin" 
                            required
                            className="h-9"
                            value={formData.pppoe_username}
                            onChange={(e) => setFormData({ ...formData, pppoe_username: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="pppoePwd" className="text-xs">PPPoE Password</Label>
                          <div className="relative">
                            <Input
                              id="pppoePwd"
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              required
                              className="h-9 pr-9"
                              value={formData.pppoe_password}
                              onChange={(e) => setFormData({ ...formData, pppoe_password: e.target.value })}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-9 w-9 px-0 py-0 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="sr-only">
                                {showPassword ? "Hide password" : "Show password"}
                              </span>
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-xs">Internet Package</Label>
                        <Select 
                          required 
                          value={formData.package_id} 
                          onValueChange={(val: any) => {
                            const pkg = packages.find(p => p.id === val);
                            setFormData({ 
                              ...formData, 
                              package_id: val, 
                              ip_address: "",
                              ...(pkg?.price && { monthly_bill: String(pkg.price) })
                            });
                          }}
                        >
                          <SelectTrigger className="w-full h-9 text-xs">
                            <SelectValue placeholder="Select a package">
                              {formData.package_id ? (
                                packages.find(p => p.id === formData.package_id)?.name || "Select a package"
                              ) : null}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {packages.length === 0 ? (
                              <div className="p-2 text-sm text-muted-foreground flex items-center">
                                <FileWarning className="w-4 h-4 mr-2"/> No packages loaded
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
                      <div className="grid gap-1.5">
                        <Label className="text-xs">
                          IP Address <span className="text-muted-foreground font-normal">(auto or static)</span>
                        </Label>
                        <Select 
                          value={formData.ip_address || "auto"} 
                          onValueChange={(val: any) => setFormData({ ...formData, ip_address: val === 'auto' ? '' : val })}
                          disabled={!formData.package_id || isLoadingIps}
                        >
                          <SelectTrigger className="w-full h-9 text-xs">
                            {isLoadingIps ? (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
                                <span>Scanning IP pool...</span>
                              </div>
                            ) : (
                              <SelectValue placeholder="Dynamic Auto-Assign">
                                {formData.ip_address ? formData.ip_address : "Dynamic Auto-Assign"}
                              </SelectValue>
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Dynamic Auto-Assign (DHCP/Pool)</SelectItem>
                            {availableIps.length > 0 && availableIps.map(ip => (
                              <SelectItem key={ip} value={ip}>{ip}</SelectItem>
                            ))}
                            {availableIps.length === 0 && formData.package_id && !isLoadingIps && (
                              <div className="p-2 text-xs text-muted-foreground flex items-center">
                                <FileWarning className="w-3.5 h-3.5 mr-1.5"/> No static IPs available
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </div>
                <div className="mt-5">
                  {/* ── Submit ── */}
                  <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={isSubmitting}>
                    {isSubmitting ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
                    {isSubmitting ? (editMode ? "Saving Changes..." : "Provisioning Link...") : (editMode ? "Save Changes" : "Provision & Create Account")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Subscribers</CardTitle>
              <CardDescription>
                {total} users registered in the database.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {mounted ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1 || isLoading}
                    onClick={() => {
                      const newPage = page - 1
                      setPage(newPage)
                      loadData(newPage)
                    }}
                  >
                    Previous
                  </Button>
                  <div className="text-xs font-medium px-2 py-1 rounded bg-muted/50 border">
                    Page {page} of {Math.max(1, Math.ceil(total / limit))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= Math.max(1, Math.ceil(total / limit)) || isLoading}
                    onClick={() => {
                      const newPage = page + 1
                      setPage(newPage)
                      loadData(newPage)
                    }}
                  >
                    Next
                  </Button>
                </>
              ) : (
                <div className="h-9 w-40 bg-muted/20 animate-pulse rounded" />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <RefreshCcw className="animate-spin h-6 w-6 mr-3 text-primary/60" /> 
              Synchronizing with database...
            </div>
          ) : customers.length === 0 ? (
             <div className="h-48 flex items-center justify-center text-muted-foreground text-sm border border-dashed rounded-lg">
                No users found on this page.
             </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Net Status</TableHead>
                  <TableHead>Acc Status</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers
                  .filter(user => {
                    // Client-side supplemental filtering
                    if (filters.netStatus !== "all") {
                      const isOnline = onlineUsers.has(user.pppoe_username)
                      if (filters.netStatus === "online" && !isOnline) return false
                      if (filters.netStatus === "offline" && isOnline) return false
                    }
                    if (filters.billingStatus !== "all" && getBillingStatus(user) !== filters.billingStatus) return false
                    if (filters.collector !== "all") {
                      const selectedStaff = staff.find(s => s.id === filters.collector)
                      if (selectedStaff && user.zones?.name !== selectedStaff.zone) return false
                    }
                    return true
                  })
                  .map((user: any) => {
                    const isOnline = onlineUsers.has(user.pppoe_username)
                    const bStatus = getBillingStatus(user)
                    const isOverdue = bStatus === 'overdue'
                    
                    return (
                      <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <button 
                          onClick={() => handleDetailOpen(user)}
                          className="font-medium hover:text-primary transition-colors text-left focus:outline-none"
                        >
                          {user.full_name}
                        </button>
                        <div className="flex items-center gap-1.5 mt-0.5">
                           <div className="text-xs text-muted-foreground font-normal tracking-wider">
                            {user.pppoe_username}
                           </div>
                           {isOverdue && <Badge variant="outline" className="h-4 py-0 text-[8px] bg-destructive/10 text-destructive border-destructive/20 font-bold uppercase tracking-tighter">Debit Warning</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {isOnline ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/15 text-emerald-600 border-emerald-200 shadow-none capitalize animate-pulse"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                            Online
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-slate-500/10 text-slate-500 border-slate-300 shadow-none capitalize"
                          >
                            Offline
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.status === "active" ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-none capitalize"
                          >
                            Active
                          </Badge>
                        ) : user.status === "expired" ? (
                          <Badge
                            variant="outline"
                            className="bg-red-500/10 text-red-600 border-red-500/20 shadow-none capitalize"
                          >
                            Expired
                          </Badge>
                        ) : user.status === "pending" ? (
                          <Badge
                            variant="outline"
                            className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 shadow-none capitalize"
                          >
                            Pending
                          </Badge>
                        ) : user.status === "suspended" ? (
                          <Badge
                            variant="outline"
                            className="bg-orange-500/10 text-orange-600 border-orange-500/20 shadow-none capitalize"
                          >
                            Suspended
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-slate-500/10 text-slate-600 border-slate-500/20 shadow-none capitalize"
                          >
                            {user.status || 'Unknown'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                         {bStatus === 'paid' ? (
                           <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 border-emerald-200 capitalize py-0.5">
                             Paid
                           </Badge>
                         ) : bStatus === 'overdue' ? (
                           <Badge variant="destructive" className="capitalize py-0.5">
                             Overdue
                           </Badge>
                         ) : (
                           <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200 capitalize py-0.5">
                             Pending
                           </Badge>
                         )}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {user.packages ? user.packages.name : "Unmapped Plan"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                           {bStatus !== 'paid' && (
                             <Button 
                               variant="secondary" 
                               size="sm" 
                               className="h-7 text-[10px] font-bold px-2.5 gap-1.5 shadow-none"
                               onClick={() => {
                                  setSelectedForPayment(user)
                                  setIsPaymentModalOpen(true)
                               }}
                             >
                                <DollarSign className="h-3 w-3 text-emerald-600" />
                                Collect
                             </Button>
                           )}
                           <DropdownMenu>
                             <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                                 <MoreHorizontal className="h-4 w-4" />
                                 <span className="sr-only">Open menu</span>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent align="end">
                               <DropdownMenuItem onClick={() => handleDetailOpen(user)}>
                                 View Live Detail
                               </DropdownMenuItem>
                               <DropdownMenuItem onClick={() => window.location.href = `/users/${user.id}`}>
                                 Full Profile
                               </DropdownMenuItem>
                               <DropdownMenuItem onClick={() => openEditModal(user)}>
                                 Edit Details
                               </DropdownMenuItem>
                               <DropdownMenuItem>View Billing</DropdownMenuItem>
                               <DropdownMenuSeparator />
                               <DropdownMenuItem variant="destructive">
                                 Suspend Connection
                               </DropdownMenuItem>
                             </DropdownMenuContent>
                           </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* User Detail Flyout */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-between pr-6">
              <SheetTitle className="text-xl">User Life-Monitor</SheetTitle>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {onlineUsers.has(detailUser?.pppoe_username) ? (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                  Online
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-300">
                  Offline
                </Badge>
              )}
              {detailUser?.status === "active" ? (
                <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-200">
                  Account: Active
                </Badge>
              ) : (
                <Badge variant="destructive" className="capitalize">
                  Account: {detailUser?.status || 'Unknown'}
                </Badge>
              )}
            </div>
            </div>
            <SheetDescription>
              Real-time technical metadata for {detailUser?.full_name}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-8 px-6 pb-8">
            {/* Identity Group */}
            <div className="grid gap-4">
              <div className="flex flex-col gap-1 px-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Identity</span>
                <Separator className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Username</p>
                  <p className="font-mono text-sm">{detailUser?.pppoe_username}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Phone</p>
                  <p className="text-sm font-semibold">{detailUser?.phone}</p>
                </div>
              </div>
            </div>

            {/* Live Session Group */}
            <div className="grid gap-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex flex-col gap-1">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Live Telemetry</span>
                   <Separator className="mt-1" />
                </div>
                <Button 
                   variant="ghost" 
                   size="icon" 
                   className="h-8 w-8 rounded-full hover:bg-muted"
                   disabled={isDetailLoading}
                   onClick={() => handleDetailOpen(detailUser)}
                >
                   <RefreshCcw className={cn("h-3.5 w-3.5", isDetailLoading && "animate-spin")} />
                </Button>
              </div>
              
              {isDetailLoading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3 border border-dashed rounded-lg bg-muted/30">
                  <RefreshCcw className="h-5 w-5 animate-spin text-primary/60" />
                  <p className="text-[11px] font-medium text-muted-foreground italic">Querying MikroTik Active Sessions...</p>
                </div>
              ) : detailUser?.live ? (
                <div className="grid gap-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase">Live IP Address</p>
                        <p className="font-mono text-sm text-emerald-600 font-bold">{detailUser.live.ip_address}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase">Connection Uptime</p>
                        <p className="font-mono text-sm text-amber-600 font-bold">{detailUser.live.uptime}</p>
                      </div>
                   </div>
                   <div className="space-y-1 bg-muted/50 p-3 rounded-lg border">
                      <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Hardware MAC Binding
                      </p>
                      <p className="font-mono text-sm tracking-wider font-bold mt-1">{detailUser.live.mac_address}</p>
                   </div>

                   {/* Session Cumulative Traffic */}
                    <div className="grid grid-cols-2 gap-4">
                     <div className="flex flex-col gap-1 p-3 border rounded-lg bg-violet-500/5">
                        <div className="flex items-center gap-2 text-violet-600">
                          <ArrowDown className="h-3 w-3" />
                          <span className="text-[10px] font-bold uppercase tracking-tight">Session Download</span>
                        </div>
                        <p className="text-lg font-bold tracking-tight">{currentTraffic.traffic_in}</p>
                        <p className="text-[9px] text-muted-foreground leading-none mt-0.5">Total Data Recv</p>
                     </div>
                     <div className="flex flex-col gap-1 p-3 border rounded-lg bg-orange-500/5">
                        <div className="flex items-center gap-2 text-orange-600">
                          <ArrowUp className="h-3 w-3" />
                          <span className="text-[10px] font-bold uppercase tracking-tight">Session Upload</span>
                        </div>
                        <p className="text-lg font-bold tracking-tight">{currentTraffic.traffic_out}</p>
                        <p className="text-[9px] text-muted-foreground leading-none mt-0.5">Total Data Sent</p>
                     </div>
                    </div>

                   {/* Live Traffic Graph */}
                   <div className="grid gap-4 pt-4">
                      <div className="flex flex-col gap-1 px-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Live Throughput</span>
                        <Separator className="mt-1" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1 p-3 border rounded-lg bg-emerald-500/5">
                           <div className="flex items-center gap-2 text-emerald-600">
                             <ArrowDown className="h-3 w-3" />
                             <span className="text-[10px] font-bold uppercase">Download</span>
                           </div>
                           <p className="text-lg font-bold tracking-tight">{currentTraffic.download} <span className="text-[10px] font-normal text-muted-foreground">Mbps</span></p>
                        </div>
                        <div className="flex flex-col gap-1 p-3 border rounded-lg bg-blue-500/5">
                           <div className="flex items-center gap-2 text-blue-600">
                             <ArrowUp className="h-3 w-3" />
                             <span className="text-[10px] font-bold uppercase">Upload</span>
                           </div>
                           <p className="text-lg font-bold tracking-tight">{currentTraffic.upload} <span className="text-[10px] font-normal text-muted-foreground">Mbps</span></p>
                        </div>
                      </div>

                      <div className="h-[180px] w-full mt-2">
                        <ChartContainer config={userChartConfig}>
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trafficHistory}>
                              <defs>
                                <linearGradient id="fillDownload" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="var(--color-download)" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="var(--color-download)" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="fillUpload" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="var(--color-upload)" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="var(--color-upload)" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                              <XAxis 
                                dataKey="time" 
                                hide 
                              />
                              <YAxis 
                                hide
                                domain={[0, 'auto']}
                              />
                              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                              <Area
                                type="monotone"
                                dataKey="download"
                                stroke="var(--color-download)"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#fillDownload)"
                              />
                              <Area
                                type="monotone"
                                dataKey="upload"
                                stroke="var(--color-upload)"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#fillUpload)"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </div>
                   </div>

                   {/* Monthly Usage History */}
                   <div className="grid gap-4 pt-4">
                      <div className="flex flex-col gap-1 px-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Monthly Usage History</span>
                        <Separator className="mt-1" />
                      </div>

                      {usageHistory.length > 0 ? (
                        <div className="h-[180px] w-full mt-2">
                           <ChartContainer config={userChartConfig}>
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={usageHistory}>
                                  <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                                  <XAxis 
                                    dataKey="date" 
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 9 }}
                                    tickFormatter={(val) => val.split('/')[0]} // Show just the day
                                  />
                                  <YAxis hide />
                                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                  <Bar 
                                    dataKey="downloadGB" 
                                    fill="var(--color-download)" 
                                    radius={[0, 0, 2, 2]} 
                                    stackId="a" 
                                  />
                                  <Bar 
                                    dataKey="uploadGB" 
                                    fill="var(--color-upload)" 
                                    radius={[2, 2, 0, 0]} 
                                    stackId="a" 
                                  />
                                </BarChart>
                              </ResponsiveContainer>
                           </ChartContainer>
                           <p className="text-[10px] text-center text-muted-foreground mt-2 italic">Data consumption in Gigabytes (GB) over last 30 days</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 gap-2 border border-dashed rounded-lg bg-muted/10 opacity-60">
                          <p className="text-[10px] text-muted-foreground">Compiling historical snapshots...</p>
                        </div>
                      )}
                   </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-2 border border-dashed rounded-lg bg-muted/20">
                   <FileWarning className="h-5 w-5 text-muted-foreground/50" />
                   <p className="text-[11px] text-muted-foreground font-medium">Device is currently inactive</p>
                </div>
              )}
            </div>

            {/* Billing Overview */}
            <div className="grid gap-4">
              <div className="flex flex-col gap-1 px-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Plan Mapping</span>
                <Separator className="mt-1" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Assigned Profile</span>
                  <span className="text-sm font-bold text-primary">{detailUser?.packages?.name || "No Profile Linked"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Monthly Price</span>
                  <span className="text-sm font-bold">
                    ৳ {detailUser?.monthly_fee || 
                       (Array.isArray(detailUser?.packages) ? detailUser?.packages[0]?.price : detailUser?.packages?.price) || 
                       0}
                  </span>
                </div>
              </div>
            </div>

            <Button className="w-full mt-4" variant="outline" onClick={() => window.location.href = `/users/${detailUser.id}`}>
               Manage Configuration & Billing
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Payment Collection Dialog */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
             <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                   <Wallet2 className="h-5 w-5 text-emerald-600" />
                </div>
                <DialogTitle className="text-xl">Collect Payment</DialogTitle>
             </div>
             <DialogDescription>
                Recording invoice reconciliation for <span className="font-bold text-foreground">{selectedForPayment?.full_name}</span>
             </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-6 py-4">
            <div className="p-4 bg-muted/40 rounded-xl border space-y-3">
               <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Monthly Fee</span>
                  <span className="text-lg font-bold">৳ {selectedForPayment?.monthly_fee || selectedForPayment?.packages?.price || 0}</span>
               </div>
               <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Billing Cycle</span>
                  <span className="text-sm font-medium">Day {selectedForPayment?.billing_day || 1} of Month</span>
               </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Allocate Payment To:</Label>
                <Select value={targetInvoiceId} onValueChange={(v) => setTargetInvoiceId(v || "auto")}>
                   <SelectTrigger>
                      <SelectValue placeholder="Auto-Allocate (Oldest Debt First)" />
                   </SelectTrigger>
                   <SelectContent>
                      <SelectItem value="auto">Auto-Allocate (Oldest Debt First)</SelectItem>
                      {paymentUnpaidInvoices.map((inv: any) => {
                         const remaining = Number(inv.amount_due) - Number(inv.amount_paid)
                         return (
                            <SelectItem key={inv.id} value={inv.id}>
                               {inv.billing_month} - ৳{remaining.toLocaleString()} Remaining
                            </SelectItem>
                         )
                      })}
                   </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select defaultValue="Cash" onValueChange={(v) => setSelectedForPayment({ ...selectedForPayment, method: v })}>
                   <SelectTrigger>
                      <SelectValue placeholder="Cash Transaction">
                        {{ Cash: "Cash Transaction", Bkash: "Bkash Transfer", Nagad: "Nagad Transfer" }[selectedForPayment?.method || "Cash"] || "Cash Transaction"}
                      </SelectValue>
                   </SelectTrigger>
                   <SelectContent>
                      <SelectItem value="Cash">Cash Transaction</SelectItem>
                      <SelectItem value="Bkash">Bkash Transfer</SelectItem>
                      <SelectItem value="Nagad">Nagad Transfer</SelectItem>
                   </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Collected By</Label>
                <Select 
                   defaultValue={selectedForPayment?.collector || "Office"} 
                   onValueChange={(v) => setSelectedForPayment({ ...selectedForPayment, collected_by: v })}
                >
                   <SelectTrigger>
                      <SelectValue placeholder="Select collector">
                        {(() => {
                          const val = selectedForPayment?.collected_by || selectedForPayment?.collector || "Office";
                          if (val === "Office") return "Office / Online";
                          return val;
                        })()}
                      </SelectValue>
                   </SelectTrigger>
                   <SelectContent>
                      <SelectItem value="Office">Office / Online</SelectItem>
                      {crmStaff.map((s: any) => (
                         <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                      ))}
                   </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Confirmation Amount</Label>
                <Input 
                   type="number" 
                   value={selectedForPayment?.amount || selectedForPayment?.monthly_fee || selectedForPayment?.packages?.price || 0}
                   onChange={(e) => setSelectedForPayment({ ...selectedForPayment, amount: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
            <Button 
               className="bg-emerald-600 hover:bg-emerald-700"
               disabled={isRecordingPayment}
               onClick={() => handleRecordPayment(
                 selectedForPayment.amount || selectedForPayment?.monthly_fee || selectedForPayment?.packages?.price || 0,
                 selectedForPayment.method || "Cash",
                 selectedForPayment.collected_by || selectedForPayment?.collector || "Office"
               )}
            >
               {isRecordingPayment ? <RefreshCcw className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
               Confirm & Mark Paid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
