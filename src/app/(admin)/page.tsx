"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { 
  Users, 
  Cpu, 
  Activity, 
  Clock, 
  AlertTriangle,
  Loader2,
  Wifi,
  Zap,
  ShieldAlert,
  ArrowUpRight,
  Database,
  DollarSign,
  CheckCircle2,
  RefreshCcw,
  ArrowDown,
  ArrowUp
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { toast } from "sonner"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

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

interface GraphDataPoint {
  time: string
  wan1_rx: number
  wan1_tx: number
  wan2_rx: number
  wan2_tx: number
}

const bandwidthChartConfig = {
  wan1_rx: {
    label: "WAN1 Download",
    color: "hsl(var(--chart-1))",
  },
  wan1_tx: {
    label: "WAN1 Upload",
    color: "hsl(var(--chart-2))",
  },
  wan2_rx: {
    label: "WAN2 Download",
    color: "hsl(var(--chart-3))",
  },
  wan2_tx: {
    label: "WAN2 Upload",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig

const statusChartConfig = {
  online: { label: "Online", color: "#10b981" },
  offline: { label: "Offline", color: "#94a3b8" },
  deactivated: { label: "Deactivated", color: "#ef4444" },
} satisfies ChartConfig

/* ── Core VLAN Uplinks Config ── */
const DASHBOARD_VLANS = [
  { name: 'IIG',      color: '#6366f1' },
  { name: 'BDIX',     color: '#10b981' },
  { name: 'YouTube',  color: '#f59e0b' },
  { name: 'Facebook', color: '#3b82f6' },
  { name: 'FTP',      color: '#ef4444' },
]
const MAX_VLAN_POINTS = 30

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsStats | null>(null)
  const [graphData, setGraphData] = useState<GraphDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [topConsumers, setTopConsumers] = useState<any[]>([])
  const [consumersLoading, setConsumersLoading] = useState(true)
  const [consumersTimeout, setConsumersTimeout] = useState(false)
  const [revenue, setRevenue] = useState({ expected: 0, collected: 0, collected_field: 0, collected_office: 0, collected_today: 0, outstanding: 0 })
  const [errorCount, setErrorCount] = useState(0)

  // VLAN uplink state
  const [vlanLive, setVlanLive] = useState<Record<string, { rx_mbps: number; tx_mbps: number }>>({})
  const [vlanHistory, setVlanHistory] = useState<Record<string, { time: string; rx: number; tx: number }[]>>(() => {
    const init: Record<string, { time: string; rx: number; tx: number }[]> = {}
    DASHBOARD_VLANS.forEach(v => { init[v.name] = [] })
    return init
  })
  
  const bandwidthPollRef = useRef<NodeJS.Timeout | null>(null)
  const analyticsPollRef = useRef<NodeJS.Timeout | null>(null)
  const topConsumersPollRef = useRef<NodeJS.Timeout | null>(null)
  const revenuePollRef = useRef<NodeJS.Timeout | null>(null)
  const vlanPollRef = useRef<NodeJS.Timeout | null>(null)

  // ── Fetch Throughput Stats (1s polling) ──
  const fetchThroughput = async () => {
    try {
      const res = await fetch("/api/mikrotik/dashboard")
      if (!res.ok) {
        setErrorCount(prev => prev + 1)
        return
      }
      const data = await res.json()

      const newStats: DashboardStats = data.stats
      setStats(newStats)
      setErrorCount(0)

      // Add to graph data
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      setGraphData(prev => {
        const newData = [...prev, { 
          time: now, 
          wan1_rx: newStats.traffic.wan1.rx, 
          wan1_tx: newStats.traffic.wan1.tx,
          wan2_rx: newStats.traffic.wan2.rx,
          wan2_tx: newStats.traffic.wan2.tx
        }]
        return newData.slice(-30) 
      })
    } catch (err: any) {
      console.error("Bandwidth Poll Error:", err)
      setErrorCount(prev => prev + 1)
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

  // ── Fetch Top Consumers (60s polling) ──
  const fetchTopConsumers = async () => {
    const timer = setTimeout(() => setConsumersTimeout(true), 5000)
    try {
      const res = await fetch("/api/analytics/top-consumers")
      if (!res.ok) return
      const data = await res.json()
      if (data.success) {
        setTopConsumers(data.top_consumers || [])
        setConsumersTimeout(false) // Reset if we got data
      }
    } catch (err) {
      console.error("Top consumers fetch fail", err)
    } finally {
      clearTimeout(timer)
      setConsumersLoading(false)
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
      const res = await fetch('/api/mikrotik/uplink-live', { cache: 'no-store' })
      if (!res.ok) return
      const json = await res.json()
      if (!json.success) return
      const vlans: Record<string, { rx_mbps: number; tx_mbps: number }> = json.vlans || {}
      setVlanLive(vlans)
      const now = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      setVlanHistory(prev => {
        const next = { ...prev }
        DASHBOARD_VLANS.forEach(v => {
          const point = { time: now, rx: vlans[v.name]?.rx_mbps ?? 0, tx: vlans[v.name]?.tx_mbps ?? 0 }
          const arr = [...(next[v.name] || []), point]
          next[v.name] = arr.slice(-MAX_VLAN_POINTS)
        })
        return next
      })
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchThroughput()
    fetchAnalytics()
    fetchTopConsumers()
    fetchRevenue()
    fetchVlanLive()
    bandwidthPollRef.current = setInterval(fetchThroughput, 2000)
    analyticsPollRef.current = setInterval(fetchAnalytics, 10000)
    topConsumersPollRef.current = setInterval(fetchTopConsumers, 60000)
    revenuePollRef.current = setInterval(fetchRevenue, 60000)
    vlanPollRef.current = setInterval(fetchVlanLive, 2000)

    return () => {
      if (bandwidthPollRef.current) clearInterval(bandwidthPollRef.current)
      if (analyticsPollRef.current) clearInterval(analyticsPollRef.current)
      if (topConsumersPollRef.current) clearInterval(topConsumersPollRef.current)
      if (revenuePollRef.current) clearInterval(revenuePollRef.current)
      if (vlanPollRef.current) clearInterval(vlanPollRef.current)
    }
  }, [])

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Initializing Dual-WAN Monitor...</p>
        </div>
      </div>
    )
  }

  const cards = [
    {
      title: "Total Subscribers",
      value: analytics?.total ?? 0,
      icon: Users,
      description: "Database census",
      color: "text-foreground"
    },
    {
      title: "Online Users",
      value: analytics?.online ?? 0,
      icon: Wifi,
      description: "Active sessions",
      color: "text-emerald-500",
      pulse: true
    },
    {
      title: "Offline",
      value: analytics?.offline ?? 0,
      icon: Activity,
      description: "Inactive accounts",
      color: "text-slate-400"
    },
    {
      title: "Deactivated",
      value: analytics?.deactivated ?? 0,
      icon: ShieldAlert,
      description: "Disabled secrets",
      color: "text-red-500"
    },
    {
      title: "Load Factor",
      value: `${analytics?.load_factor ?? 0} Mbps`,
      icon: Zap,
      description: "Throughput per user",
      color: "text-amber-600"
    }
  ]

  const pieData = analytics ? [
    { name: "Online", value: analytics.online, color: "#10b981" },
    { name: "Offline", value: analytics.offline, color: "#94a3b8" },
    { name: "Deactivated", value: analytics.deactivated, color: "#ef4444" },
  ] : []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground">
            Multi-Source Statistics: MikroTik & Supabase Sync
          </p>
        </div>
        {errorCount > 0 && (
          <Badge variant="destructive" className="h-7 px-3 gap-2 text-xs font-semibold uppercase animate-pulse">
            <AlertTriangle className="h-3.5 w-3.5" />
            INTERFACE ERROR ({errorCount})
          </Badge>
        )}
      </div>

      {/* Revenue Snapshot Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         <Card className="shadow-none border border-blue-200 bg-blue-50/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Expected Collection</CardTitle>
               <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Database className="h-4 w-4 text-blue-600" />
               </div>
            </CardHeader>
            <CardContent>
               <div className="text-3xl font-bold text-blue-600">৳ {(revenue.expected || 0).toLocaleString()}</div>
               <p className="text-[11px] text-muted-foreground mt-1 font-medium flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-blue-500" /> Monthly dues for active accounts
               </p>
            </CardContent>
         </Card>

         <Card className="shadow-none border border-emerald-200 bg-emerald-50/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Collected This Month</CardTitle>
               <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
               </div>
            </CardHeader>
            <CardContent>
               <div className="text-3xl font-bold text-emerald-600">৳ {revenue.collected.toLocaleString()}</div>
               <p className="text-[11px] text-muted-foreground mt-1 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> 
                  (F: ৳ {revenue.collected_field?.toLocaleString() || 0} | O: ৳ {revenue.collected_office?.toLocaleString() || 0})
               </p>
            </CardContent>
         </Card>

         <Card className="shadow-none border border-violet-200 bg-violet-50/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-violet-600">Today's Collection</CardTitle>
               <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-violet-600" />
               </div>
            </CardHeader>
            <CardContent>
               <div className="text-3xl font-bold text-violet-600">৳ {revenue.collected_today?.toLocaleString() || 0}</div>
               <p className="text-[11px] text-muted-foreground mt-1 font-medium flex items-center gap-1.5">
                  <Activity className="h-3.3 w-3.3 text-violet-500" /> Real-time daily earnings
               </p>
            </CardContent>
         </Card>

         <Card className="shadow-none border border-red-200 bg-red-50/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-red-600">Total Outstanding</CardTitle>
               <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
               </div>
            </CardHeader>
            <CardContent>
               <div className="text-3xl font-bold text-red-600">৳ {revenue.outstanding.toLocaleString()}</div>
               <p className="text-[11px] text-muted-foreground mt-1 font-medium flex items-center gap-1.5">
                  <Activity className="h-3.3 w-3.3" /> Potential revenue from overdue users
               </p>
            </CardContent>
         </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <Card key={card.title} className="shadow-none border border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={cn("h-4 w-4 text-muted-foreground", card.pulse && "animate-pulse text-emerald-500")} />
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", card.color)}>
                {card.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Core VLAN Uplinks ── */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-1.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg border border-indigo-500/20">
            <Zap className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight">Core VLAN Uplinks</h3>
            <p className="text-[10px] text-muted-foreground">Live bandwidth · 2s polling</p>
          </div>
          <Badge variant="outline" className="ml-auto text-[10px] border-emerald-500/50 text-emerald-400 bg-emerald-500/10 h-5">
            <Activity className="h-2.5 w-2.5 mr-1 animate-pulse" />
            Live
          </Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {DASHBOARD_VLANS.map(vlan => {
            const data = vlanHistory[vlan.name] || []
            const current = vlanLive[vlan.name]
            const rx = current?.rx_mbps ?? 0
            const tx = current?.tx_mbps ?? 0
            return (
              <Card key={vlan.name} className="relative overflow-hidden shadow-none border-border/50 bg-card/50 group hover:border-border/80 transition-colors">
                <div className="absolute top-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, transparent, ${vlan.color}, transparent)` }} />
                <CardHeader className="pb-1 pt-3 px-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: vlan.color }} />
                      {vlan.name}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-0.5 text-[10px]">
                      <ArrowDown className="h-2.5 w-2.5 text-emerald-400" />
                      <span className="font-mono font-bold text-emerald-400">{rx.toFixed(1)}</span>
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px]">
                      <ArrowUp className="h-2.5 w-2.5 text-blue-400" />
                      <span className="font-mono font-bold text-blue-400">{tx.toFixed(1)}</span>
                    </span>
                    <span className="text-[9px] text-muted-foreground">Mbps</span>
                  </div>
                </CardHeader>
                <CardContent className="px-1 pb-1 pt-0">
                  <div className="h-[60px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data} margin={{ top: 2, right: 2, left: -24, bottom: 0 }}>
                        <defs>
                          <linearGradient id={`dg-rx-${vlan.name}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id={`dg-tx-${vlan.name}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="time" hide />
                        <YAxis tick={{ fontSize: 8 }} tickLine={false} axisLine={false} />
                        <Area type="monotone" dataKey="rx" stroke="#10b981" strokeWidth={1.5} fill={`url(#dg-rx-${vlan.name})`} dot={false} isAnimationActive={false} />
                        <Area type="monotone" dataKey="tx" stroke="#3b82f6" strokeWidth={1} fill={`url(#dg-tx-${vlan.name})`} dot={false} isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Main Dual-WAN Bandwidth Graph - Takes up 8 cols */}
        <Card className="lg:col-span-8 shadow-none border border-border/60">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6">
                <div className="space-y-1">
                    <CardTitle className="text-lg font-medium">Throughput Analytics</CardTitle>
                    <CardDescription>Live real-time concurrency · 1s frequency</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 sm:mt-0 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-[hsl(var(--chart-1))]" />
                        <span className="font-medium">WAN1 RX: <span className="font-bold">{stats?.traffic.wan1.rx.toFixed(2)} M</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-[hsl(var(--chart-3))]" />
                        <span className="font-medium">WAN2 RX: <span className="font-bold">{stats?.traffic.wan2.rx.toFixed(2)} M</span></span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer config={bandwidthChartConfig} className="h-[400px] w-full">
                    <AreaChart data={graphData} accessibilityLayer>
                        <defs>
                            <linearGradient id="colorWan1Rx" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-wan1_rx)" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="var(--color-wan1_rx)" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorWan2Rx" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-wan2_rx)" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="var(--color-wan2_rx)" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="time" hide={true} />
                        <YAxis 
                            orientation="right"
                            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                            tickFormatter={(val) => `${val}M`}
                            domain={[0, 'auto']}
                            axisLine={false}
                            tickLine={false}
                        />
                        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                        <Area 
                            type="monotone" 
                            dataKey="wan1_rx" 
                            stroke="var(--color-wan1_rx)" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorWan1Rx)" 
                            name="WAN1 Download" 
                            isAnimationActive={false}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="wan2_rx" 
                            stroke="var(--color-wan2_rx)" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorWan2Rx)" 
                            name="WAN2 Download" 
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>

        {/* Status Distribution - Takes up 4 cols */}
        <Card className="lg:col-span-4 shadow-none border border-border/60">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Status Distribution</CardTitle>
            <CardDescription>Network health overview</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ChartContainer config={statusChartConfig} className="aspect-square w-full max-h-[250px]">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={80}
                  strokeWidth={5}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="grid grid-cols-1 gap-2 w-full mt-4">
               {pieData.map((item) => (
                 <div key={item.name} className="flex items-center justify-between text-xs px-3 py-1.5 rounded-md hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-medium text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-bold">{item.value}</span>
                 </div>
               ))}
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2 pt-4 border-t text-sm font-medium">
            <div className="flex items-center justify-between w-full">
                <span>Healthy Connect</span>
                <span className="text-emerald-600 flex items-center">
                    {( (analytics?.online || 0) / Math.max(1, analytics?.total || 1) * 100).toFixed(1)}%
                    <ArrowUpRight className="h-3 w-3 ml-1" />
                </span>
            </div>
          </CardFooter>
        </Card>

        {/* Top Subscribers Leaderboard */}
        <Card className="shadow-none border border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              Top Subscribers
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-0 h-5">
                Current Month
              </Badge>
            </CardTitle>
            <CardDescription className="text-[10px]">Heaviest data consumers in GB</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
              <div className="flex flex-col gap-3">
                {topConsumers.length > 0 ? topConsumers.map((user, idx) => (
                  <div key={user.username} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                       <div className="h-6 w-6 rounded bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          #{idx + 1}
                       </div>
                       <span className="text-sm font-medium tracking-tight">{user.username}</span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                       <span className="text-sm font-bold">{user.totalGB} <span className="text-[10px] font-normal text-muted-foreground">GB</span></span>
                       <Progress 
                          value={(user.totalGB / (topConsumers[0]?.totalGB || 1)) * 100} 
                          className="h-1 w-20 bg-muted rounded-full"
                       />
                    </div>
                  </div>
                )) : consumersLoading && !consumersTimeout ? (
                   <div className="py-8 flex flex-col items-center justify-center opacity-40 italic">
                      <RefreshCcw className="h-5 w-5 mb-2 animate-spin" />
                      <p className="text-[10px]">Analyzing usage logs...</p>
                   </div>
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center opacity-40 italic">
                    <Database className="h-5 w-5 mb-2" />
                    <p className="text-[10px] font-medium">Logging in progress...</p>
                    <p className="text-[9px] text-center mt-1">(Data will appear after the first hourly sync)</p>
                  </div>
                )}
              </div>
          </CardContent>
        </Card>

        {/* System Health Cards (Bottom Row) */}
        <Card className="lg:col-span-12 shadow-none border border-border/60">
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 items-center">
                <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">CPU Load</p>
                    <div className="flex flex-col gap-2">
                        <span className="text-xl font-bold">{stats?.cpu_load}%</span>
                        <Progress value={stats?.cpu_load || 0} className="h-1.5" />
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Router Memory</p>
                    <div className="flex flex-col gap-2">
                        <span className="text-xl font-bold">{stats?.mem_usage}%</span>
                        <Progress value={stats?.mem_usage || 0} className="h-1.5 bg-blue-500/20" />
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">System Uptime</p>
                    <div className="text-xl font-bold">{stats?.uptime}</div>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Router Status</p>
                    <div className="flex items-center gap-1.5 text-xl font-bold text-emerald-600">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                        Synced
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
