"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import {
  Users,
  Activity,
  Clock,
  AlertTriangle,
  Loader2,
  Signal,
  Zap,
  ShieldAlert,
  ShieldOff,
  Target,
  DollarSign,
  CheckCircle2,
  ArrowDown,
  ArrowUp,
  UserPlus,
  MessageSquareText,
  CreditCard,
  ContactRound,
  Terminal,
  Wallet,
  Radio,
  TrendingUp,
  Server,
  Command,
  CircleAlert,
  Cpu,
  MemoryStick,
  Timer,
  Cable,
  BarChart3,
  ScrollText,
  UserCheck,
  UserX,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// ── Interfaces ──
interface DashboardStats {
  cpu_load: number
  mem_usage: number
  uptime: string
  active_sessions: number
  traffic: {
    wan1: { rx: number; tx: number }
    wan2: { rx: number; tx: number }
  }
}

interface AnalyticsStats {
  total: number
  online: number
  deactivated: number
  offline: number
  load_factor: number
}

interface LogEntry {
  id: string
  action_type: string
  target_user: string
  description: string
  triggered_by: string
  created_at: string
}

interface PaymentDayData {
  day: string
  amount: number
}

// ── VLAN Configuration ──
const DASHBOARD_VLANS = [
  { name: "IIG", label: "IIG", color: "#818cf8" },
  { name: "BDIX", label: "BDIX", color: "#34d399" },
  { name: "YouTube", label: "GGC (YouTube)", color: "#fbbf24" },
  { name: "Facebook", label: "Facebook", color: "#60a5fa" },
  { name: "FTP", label: "FTP", color: "#f87171" },
]
const MAX_VLAN_POINTS = 40


// ── Custom Tooltip for BarChart ──
function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border/50 bg-background/95 backdrop-blur-md px-3 py-2 shadow-xl">
      <p className="text-[11px] font-semibold text-foreground mb-0.5">{label}</p>
      <p className="text-sm font-bold text-emerald-400">৳ {payload[0].value.toLocaleString()}</p>
    </div>
  )
}

// ── Custom Tooltip for VLAN charts ──
function VlanTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border/50 bg-background/95 backdrop-blur-md px-3 py-2 shadow-xl">
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.stroke }} />
          <span className="font-mono font-bold" style={{ color: p.stroke }}>
            {p.value.toFixed(1)} Mbps
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Main Component ──
export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [revenue, setRevenue] = useState({
    expected: 0,
    collected: 0,
    collected_field: 0,
    collected_office: 0,
    collected_today: 0,
    outstanding: 0,
  })
  const [errorCount, setErrorCount] = useState(0)
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([])
  const [paymentTrend, setPaymentTrend] = useState<PaymentDayData[]>([])

  // VLAN uplink state
  const [vlanLive, setVlanLive] = useState<
    Record<string, { rx_mbps: number; tx_mbps: number }>
  >({})
  const [vlanHistory, setVlanHistory] = useState<
    Record<string, { time: string; rx: number; tx: number }[]>
  >(() => {
    const init: Record<string, { time: string; rx: number; tx: number }[]> = {}
    DASHBOARD_VLANS.forEach((v) => {
      init[v.name] = []
    })
    return init
  })

  // Sweeper status
  const [sweeperStatus, setSweeperStatus] = useState<string>("Checking...")

  const bandwidthPollRef = useRef<NodeJS.Timeout | null>(null)
  const analyticsPollRef = useRef<NodeJS.Timeout | null>(null)
  const revenuePollRef = useRef<NodeJS.Timeout | null>(null)
  const vlanPollRef = useRef<NodeJS.Timeout | null>(null)

  // ── Fetch Throughput Stats (2s polling) ──
  const fetchThroughput = async () => {
    try {
      const res = await fetch("/api/mikrotik/dashboard")
      if (!res.ok) {
        setErrorCount((prev) => prev + 1)
        return
      }
      const data = await res.json()
      setStats(data.stats)
      setErrorCount(0)
    } catch (err: any) {
      console.error("Bandwidth Poll Error:", err)
      setErrorCount((prev) => prev + 1)
    } finally {
      if (loading && stats) setLoading(false)
    }
  }

  // ── Fetch Analytics (10s polling) ──
  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/mikrotik/analytics")
      if (!res.ok) return
      const data = await res.json()
      setAnalytics(data.stats)
    } catch (err) {
      console.error("Analytics fetch fail", err)
    } finally {
      setLoading(false)
    }
  }

  // ── Fetch Revenue (60s polling) ──
  const fetchRevenue = async () => {
    try {
      const res = await fetch("/api/analytics/revenue")
      if (!res.ok) return
      const data = await res.json()
      if (data.success) {
        setRevenue(data.summary)
      }
    } catch (err) {
      console.error("Revenue fetch fail", err)
    }
  }

  // ── Fetch VLAN Uplinks (2s polling) ──
  const fetchVlanLive = useCallback(async () => {
    try {
      const res = await fetch("/api/mikrotik/uplink-live", { cache: "no-store" })
      if (!res.ok) return
      const json = await res.json()
      if (!json.success) return
      const vlans: Record<string, { rx_mbps: number; tx_mbps: number }> =
        json.vlans || {}
      setVlanLive(vlans)
      const now = new Date().toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
      setVlanHistory((prev) => {
        const next = { ...prev }
        DASHBOARD_VLANS.forEach((v) => {
          const point = {
            time: now,
            rx: vlans[v.name]?.rx_mbps ?? 0,
            tx: vlans[v.name]?.tx_mbps ?? 0,
          }
          const arr = [...(next[v.name] || []), point]
          next[v.name] = arr.slice(-MAX_VLAN_POINTS)
        })
        return next
      })
    } catch {
      /* silent */
    }
  }, [])

  // ── Fetch Recent Logs (one-shot + 30s polling) ──
  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/logs?limit=5")
      if (!res.ok) return
      const data = await res.json()
      if (data.success) {
        setRecentLogs(data.data || [])
      }
    } catch {
      /* silent */
    }
  }

  // ── Fetch Payment 7-Day Trend (one-shot + 60s polling) ──
  const fetchPaymentTrend = async () => {
    try {
      const res = await fetch("/api/collections")
      if (!res.ok) return
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        // Group by day for the last 7 days
        const today = new Date()
        const dayMap: Record<string, number> = {}
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today)
          d.setDate(d.getDate() - i)
          const key = d.toLocaleDateString("en-US", { weekday: "short" })
          dayMap[key] = 0
        }
        data.data.forEach((p: any) => {
          const payDate = new Date(p.created_at)
          const key = payDate.toLocaleDateString("en-US", { weekday: "short" })
          if (dayMap[key] !== undefined) {
            dayMap[key] += parseFloat(p.amount) || 0
          }
        })
        setPaymentTrend(
          Object.entries(dayMap).map(([day, amount]) => ({ day, amount: Math.round(amount) }))
        )
      }
    } catch {
      /* silent */
    }
  }

  // ── Fetch Sweeper Status ──
  const fetchSweeperStatus = async () => {
    try {
      const res = await fetch("/api/logs?limit=1&search=AUTO_SUSPEND")
      if (!res.ok) {
        setSweeperStatus("Unknown")
        return
      }
      const data = await res.json()
      if (data.success && data.data?.length > 0) {
        const lastRun = new Date(data.data[0].created_at)
        setSweeperStatus(
          `Last Run: ${lastRun.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}`
        )
      } else {
        setSweeperStatus("No runs logged")
      }
    } catch {
      setSweeperStatus("Offline")
    }
  }

  useEffect(() => {
    fetchThroughput()
    fetchAnalytics()
    fetchRevenue()
    fetchVlanLive()
    fetchLogs()
    fetchPaymentTrend()
    fetchSweeperStatus()

    bandwidthPollRef.current = setInterval(fetchThroughput, 2000)
    analyticsPollRef.current = setInterval(fetchAnalytics, 10000)
    revenuePollRef.current = setInterval(fetchRevenue, 60000)
    vlanPollRef.current = setInterval(fetchVlanLive, 2000)
    const logsPoll = setInterval(fetchLogs, 30000)
    const trendPoll = setInterval(fetchPaymentTrend, 60000)

    return () => {
      if (bandwidthPollRef.current) clearInterval(bandwidthPollRef.current)
      if (analyticsPollRef.current) clearInterval(analyticsPollRef.current)
      if (revenuePollRef.current) clearInterval(revenuePollRef.current)
      if (vlanPollRef.current) clearInterval(vlanPollRef.current)
      clearInterval(logsPoll)
      clearInterval(trendPoll)
    }
  }, [])

  // ── Loading State ──
  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
            <Loader2 className="h-10 w-10 animate-spin text-emerald-400 relative z-10" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Initializing Command Center</p>
            <p className="text-xs text-muted-foreground mt-1">
              Synchronizing uplink telemetry...
            </p>
          </div>
        </div>
      </div>
    )
  }

  const onlineUsers = analytics?.online ?? 0
  const offlineUsers = analytics?.offline ?? 0
  const totalUsers = analytics?.total ?? 0
  const suspendedUsers = analytics?.deactivated ?? 0

  return (
    <div className="flex flex-col gap-0 -m-4 md:-m-6 lg:-m-8">
      {/* ═══ TOP COMMAND BAR ══════════════════════════════════════════════ */}
      <div className="flex items-center justify-between px-4 md:px-6 py-4 bg-muted/20">
        <div className="flex items-center gap-3">
          <Radio className="h-4 w-4 text-muted-foreground" />
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-muted-foreground">
            <span className="font-medium opacity-70">Purrfect Universe</span>{" "}
            <span>Command Center</span>
          </h1>
          {errorCount > 0 && (
            <Badge
              variant="destructive"
              className="h-5 px-2 gap-1 text-xs font-bold uppercase animate-pulse"
            >
              <AlertTriangle className="h-3 w-3" />
              ERR ({errorCount})
            </Badge>
          )}
        </div>
      </div>

      {/* ═══ MAIN GRID CONTENT ════════════════════════════════════════ */}
      <div className="p-3 md:p-5 lg:p-6 flex flex-col gap-4">

        {/* ── System Status Inline Bar ────────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap rounded-lg border border-border/20 bg-card/40 backdrop-blur-sm px-4 py-2">
          <Badge variant="outline" className="gap-1.5 h-6 border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-xs font-semibold">
            <div className="relative">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              <div className="absolute inset-0 h-2 w-2 rounded-full bg-emerald-400/50 animate-ping" />
            </div>
            System Online
          </Badge>
          
          <Separator orientation="vertical" className="h-4 bg-border/50 hidden sm:block" />

          <Badge variant="outline" className="gap-1.5 h-6 border-border/30 text-xs font-mono">
            <Cpu className="h-3 w-3 text-blue-400" />
            CPU {stats?.cpu_load ?? 0}%
          </Badge>
          <Badge variant="outline" className="gap-1.5 h-6 border-border/30 text-xs font-mono">
            <MemoryStick className="h-3 w-3 text-violet-400" />
            MEM {stats?.mem_usage ?? 0}%
          </Badge>
          <Badge variant="outline" className="gap-1.5 h-6 border-border/30 text-xs font-mono">
            <Timer className="h-3 w-3 text-amber-400" />
            {stats?.uptime ?? "—"}
          </Badge>

          <Separator orientation="vertical" className="h-4 bg-border/50 hidden sm:block" />

          <Badge variant="outline" className="gap-1.5 h-6 border-border/30 text-xs font-mono">
            <Server className="h-3 w-3 text-emerald-400" />
            Sweeper: {sweeperStatus}
          </Badge>
        </div>

        {/* ── Row 1: THE PULSE — 5 KPI Cards ─────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {/* KPI 1: Online Status */}
          <Card className="relative overflow-hidden shadow-none border-border/30 bg-card/60 backdrop-blur-md">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-6">
              <CardTitle className="text-sm font-medium">
                Online Status
              </CardTitle>
              <Signal className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground tabular-nums">
                  {onlineUsers}
                </span>
                <Badge variant="outline" className="border-emerald-500/20 text-emerald-500 bg-emerald-500/5 text-[11px] h-5 opacity-80">online</Badge>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold text-muted-foreground tabular-nums">
                  {offlineUsers}
                </span>
                <Badge variant="outline" className="border-slate-500/20 text-muted-foreground bg-slate-500/5 text-[11px] h-5 opacity-80">offline</Badge>
              </div>
            </CardContent>
          </Card>

          {/* KPI 2: Subscribers */}
          <Card className="relative overflow-hidden shadow-none border-border/30 bg-card/60 backdrop-blur-md">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-6">
              <CardTitle className="text-sm font-medium">
                Total Subscribers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-3xl font-bold text-foreground tabular-nums">
                {totalUsers}
              </div>
              <div className="flex items-center gap-2 mt-1.5 opacity-80">
                <Badge variant="outline" className="border-blue-500/20 text-blue-500 bg-blue-500/5 text-[11px] h-5 gap-1">
                  <UserCheck className="h-3 w-3" /> {totalUsers - suspendedUsers} active
                </Badge>
                <Separator orientation="vertical" className="h-3 bg-border/50" />
                <Badge variant="outline" className="border-red-500/20 text-red-500 bg-red-500/5 text-[11px] h-5 gap-1">
                  <UserX className="h-3 w-3" /> {suspendedUsers} suspended
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* KPI 3: Monthly Target */}
          <Card className="relative overflow-hidden shadow-none border-border/30 bg-card/60 backdrop-blur-md">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-6">
              <CardTitle className="text-sm font-medium">
                Monthly Target
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-3xl font-bold text-foreground tabular-nums">
                ৳ {(revenue.expected || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground/70 mt-1.5 flex items-center gap-1">
                <Clock className="h-3 w-3 opacity-70" />
                Expected for current cycle
              </p>
            </CardContent>
          </Card>

          {/* KPI 4: Actual Vault */}
          <Card className="relative overflow-hidden shadow-none border-border/30 bg-card/60 backdrop-blur-md">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-6">
              <CardTitle className="text-sm font-medium">
                Actual Vault
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-3xl font-bold text-foreground tabular-nums">
                ৳ {revenue.collected.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 mt-1.5 opacity-80">
                <Badge variant="outline" className="border-amber-500/20 text-amber-500 bg-amber-500/5 text-[11px] h-5">
                  Field: <strong className="ml-1 opacity-80">৳{revenue.collected_field?.toLocaleString() || 0}</strong>
                </Badge>
                <Separator orientation="vertical" className="h-3 bg-border/50" />
                <Badge variant="outline" className="border-violet-500/20 text-violet-500 bg-violet-500/5 text-[11px] h-5">
                  Office: <strong className="ml-1 opacity-80">৳{revenue.collected_office?.toLocaleString() || 0}</strong>
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* KPI 5: Due Bills */}
          <Card className="relative overflow-hidden shadow-none border-border/30 bg-card/60 backdrop-blur-md">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-6">
              <CardTitle className="text-sm font-medium">
                Due Bills
              </CardTitle>
              <ShieldOff className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-3xl font-bold text-foreground tabular-nums">
                ৳ {revenue.outstanding.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground/70 mt-1.5 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 opacity-70" />
                Outstanding from overdue
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── Row 2: THE TELEMETRY — Charts ──────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Core Uplinks (2/3 width) */}
          <Card className="lg:col-span-2 relative overflow-hidden shadow-none border-border/30 bg-card/60 backdrop-blur-md">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500/50 via-emerald-500/50 to-amber-500/50" />
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Cable className="h-4 w-4 text-muted-foreground mr-2" />
                  <div>
                    <CardTitle className="text-sm font-bold tracking-tight">
                      Core Uplinks
                    </CardTitle>
                    <p className="text-xs text-muted-foreground/60">
                      Live VLAN bandwidth · 2s refresh
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] border-emerald-500/40 text-emerald-400 bg-emerald-500/10 h-5 gap-1"
                >
                  <Activity className="h-2.5 w-2.5 animate-pulse" />
                  LIVE
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DASHBOARD_VLANS.map((vlan) => {
                  const data = vlanHistory[vlan.name] || []
                  const current = vlanLive[vlan.name]
                  const rx = current?.rx_mbps ?? 0
                  const tx = current?.tx_mbps ?? 0
                  return (
                    <div
                      key={vlan.name}
                      className="relative overflow-hidden rounded-lg border border-border/20 bg-background/40 backdrop-blur-sm group hover:border-border/40 transition-all"
                    >
                      <div
                        className="absolute top-0 left-0 right-0 h-[1.5px] opacity-50 group-hover:opacity-100 transition-opacity"
                        style={{
                          background: `linear-gradient(90deg, transparent, ${vlan.color}, transparent)`,
                        }}
                      />
                      <div className="px-3 pt-2.5 pb-1">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="gap-1.5 h-6 border-border/30 bg-background/50 text-sm font-bold px-2">
                            <span
                              className="w-2 h-2 rounded-full animate-pulse"
                              style={{ background: vlan.color }}
                            />
                            {vlan.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="flex items-center gap-1 text-sm">
                            <ArrowDown className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="font-mono font-bold text-emerald-400 text-base">
                              {rx.toFixed(1)}
                            </span>
                          </span>
                          <span className="flex items-center gap-1 text-sm">
                            <ArrowUp className="h-3.5 w-3.5 text-blue-400" />
                            <span className="font-mono font-bold text-blue-400 text-base">
                              {tx.toFixed(1)}
                            </span>
                          </span>
                          <span className="text-xs text-muted-foreground/50">
                            Mbps
                          </span>
                        </div>
                      </div>
                      <div className="h-[100px] px-0.5">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={data}
                            margin={{ top: 2, right: 2, left: -24, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient
                                id={`cc-rx-${vlan.name}`}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor={vlan.color}
                                  stopOpacity={0.35}
                                />
                                <stop
                                  offset="95%"
                                  stopColor={vlan.color}
                                  stopOpacity={0}
                                />
                              </linearGradient>
                              <linearGradient
                                id={`cc-tx-${vlan.name}`}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#3b82f6"
                                  stopOpacity={0.15}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#3b82f6"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="time" hide />
                            <YAxis
                              tick={{ fontSize: 7 }}
                              tickLine={false}
                              axisLine={false}
                            />
                            <RechartsTooltip content={<VlanTooltip />} />
                            <Area
                              type="monotone"
                              dataKey="rx"
                              stroke={vlan.color}
                              strokeWidth={1.5}
                              fill={`url(#cc-rx-${vlan.name})`}
                              dot={false}
                              isAnimationActive={false}
                            />
                            <Area
                              type="monotone"
                              dataKey="tx"
                              stroke="#3b82f6"
                              strokeWidth={1}
                              fill={`url(#cc-tx-${vlan.name})`}
                              dot={false}
                              isAnimationActive={false}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Right: Revenue Velocity */}
          <Card className="relative overflow-hidden shadow-none border-border/30 bg-card/60 backdrop-blur-md">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="h-4 w-4 text-muted-foreground mr-2" />
                  <div>
                    <CardTitle className="text-sm font-bold tracking-tight">
                      Revenue Velocity
                    </CardTitle>
                    <p className="text-xs text-muted-foreground/60">
                      Last 7 days · cash flow trend
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground/50">Today</p>
                  <p className="text-sm font-bold text-amber-400 font-mono tabular-nums drop-shadow-[0_0_6px_rgba(251,191,36,0.3)]">
                    ৳{revenue.collected_today?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-1">
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paymentTrend} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                      strokeOpacity={0.3}
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <RechartsTooltip content={<RevenueTooltip />} />
                    <Bar
                      dataKey="amount"
                      fill="url(#barGrad)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={36}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Row 3: THE ACTION CENTER ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Recent Activity */}
          <Card className="relative overflow-hidden shadow-none border-border/30 bg-card/60 backdrop-blur-md">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ScrollText className="h-4 w-4 text-muted-foreground mr-2" />
                  <div>
                    <CardTitle className="text-sm font-bold tracking-tight">
                      Recent Activity
                    </CardTitle>
                    <p className="text-xs text-muted-foreground/60">
                      Last 5 system events
                    </p>
                  </div>
                </div>
                <Link href="/logs">
                  <Badge
                    variant="outline"
                    className="text-[11px] border-cyan-500/30 text-cyan-400 bg-cyan-500/5 h-5 cursor-pointer hover:bg-cyan-500/10 transition-colors"
                  >
                    View All →
                  </Badge>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3 pt-1">
              {recentLogs.length > 0 ? (
                <div className="flex flex-col gap-0">
                  {recentLogs.map((log, i) => {
                    const isPayment = log.action_type === "PAYMENT_LOGGED"
                    const isSuspend = log.action_type === "AUTO_SUSPEND"
                    const isReactivate = log.action_type === "REACTIVATION"

                    return (
                      <div
                        key={log.id}
                        className={cn(
                          "flex items-start gap-3 py-2.5 transition-colors",
                          i < recentLogs.length - 1 && "border-b border-border/10"
                        )}
                      >
                        <div
                          className={cn(
                            "h-6 w-6 rounded-md flex items-center justify-center shrink-0 mt-0.5",
                            isPayment && "bg-emerald-500/10 ring-1 ring-emerald-500/20",
                            isSuspend && "bg-red-500/10 ring-1 ring-red-500/20",
                            isReactivate && "bg-blue-500/10 ring-1 ring-blue-500/20",
                            !isPayment && !isSuspend && !isReactivate &&
                              "bg-muted/50 ring-1 ring-border/20"
                          )}
                        >
                          {isPayment && (
                            <DollarSign className="h-3 w-3 text-emerald-400" />
                          )}
                          {isSuspend && (
                            <ShieldAlert className="h-3 w-3 text-red-400" />
                          )}
                          {isReactivate && (
                            <CheckCircle2 className="h-3 w-3 text-blue-400" />
                          )}
                          {!isPayment && !isSuspend && !isReactivate && (
                            <Activity className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-foreground truncate">
                              {log.target_user || "System"}
                            </span>
                            <span className="text-[11px] text-muted-foreground/50 font-mono shrink-0">
                              {new Date(log.created_at).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                }
                              )}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground/60 truncate">
                            {log.description || log.action_type}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-10 flex flex-col items-center justify-center text-muted-foreground/40">
                  <Terminal className="h-6 w-6 mb-2" />
                  <p className="text-xs font-medium">No recent events</p>
                  <p className="text-[11px] mt-0.5">System logs will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right: Quick Controls */}
          <Card className="relative overflow-hidden shadow-none border-border/30 bg-card/60 backdrop-blur-md">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center gap-2.5">
                <Command className="h-4 w-4 text-muted-foreground mr-2" />
                <div>
                  <CardTitle className="text-sm font-bold tracking-tight">
                    Quick Controls
                  </CardTitle>
                  <p className="text-xs text-muted-foreground/60">
                    Immediate actions
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <Link href="/users?action=new" className="block">
                  <Button
                    variant="outline"
                    className="w-full h-auto py-4 flex flex-col items-center gap-2.5 border-border/30 bg-background/30 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 transition-all group"
                  >
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:ring-emerald-500/40 group-hover:shadow-[0_0_20px_rgba(52,211,153,0.15)] transition-all">
                      <UserPlus className="h-5 w-5 text-emerald-400" />
                    </div>
                    <span className="text-xs font-bold tracking-wide">
                      Add New User
                    </span>
                  </Button>
                </Link>

                <Link href="/collections" className="block">
                  <Button
                    variant="outline"
                    className="w-full h-auto py-4 flex flex-col items-center gap-2.5 border-border/30 bg-background/30 hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-400 transition-all group"
                  >
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center ring-1 ring-amber-500/20 group-hover:bg-amber-500/20 group-hover:ring-amber-500/40 group-hover:shadow-[0_0_20px_rgba(251,191,36,0.15)] transition-all">
                      <CreditCard className="h-5 w-5 text-amber-400" />
                    </div>
                    <span className="text-xs font-bold tracking-wide">
                      Log Manual Payment
                    </span>
                  </Button>
                </Link>

                <Link href="/communications" className="block">
                  <Button
                    variant="outline"
                    className="w-full h-auto py-4 flex flex-col items-center gap-2.5 border-border/30 bg-background/30 hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-400 transition-all group"
                  >
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center ring-1 ring-blue-500/20 group-hover:bg-blue-500/20 group-hover:ring-blue-500/40 group-hover:shadow-[0_0_20px_rgba(96,165,250,0.15)] transition-all">
                      <MessageSquareText className="h-5 w-5 text-blue-400" />
                    </div>
                    <span className="text-xs font-bold tracking-wide">
                      Broadcast SMS
                    </span>
                  </Button>
                </Link>

                <Link href="/staff" className="block">
                  <Button
                    variant="outline"
                    className="w-full h-auto py-4 flex flex-col items-center gap-2.5 border-border/30 bg-background/30 hover:bg-violet-500/10 hover:border-violet-500/30 hover:text-violet-400 transition-all group"
                  >
                    <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center ring-1 ring-violet-500/20 group-hover:bg-violet-500/20 group-hover:ring-violet-500/40 group-hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] transition-all">
                      <ContactRound className="h-5 w-5 text-violet-400" />
                    </div>
                    <span className="text-xs font-bold tracking-wide">
                      Add Staff
                    </span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
