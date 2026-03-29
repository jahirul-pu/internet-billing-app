"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Server,
  Network as NetworkIcon,
  Cable,
  SplitSquareHorizontal,
  Box,
  Activity,
  Cpu,
  Thermometer,
  Wifi,
  Laptop,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  MessageSquare,
  ArrowDown,
  ArrowUp,
  Zap,
  TrendingUp
} from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
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
  Legend,
} from "recharts"

/* ──────────────────────────────────────────────────────────── */
/*  VLAN CONFIG — mirrors src/lib/vlan-config.ts for client    */
/* ──────────────────────────────────────────────────────────── */
const VLANS = [
  { name: 'IIG',      color: '#6366f1' },
  { name: 'BDIX',     color: '#10b981' },
  { name: 'YouTube',  color: '#f59e0b' },
  { name: 'Facebook', color: '#3b82f6' },
  { name: 'FTP',      color: '#ef4444' },
]

/* ── Network Data Interfaces ── */

type NodeType = "router" | "olt" | "pon" | "splitter" | "onu"

interface BaseNode {
  id: string
  label: string
  type: NodeType
}

interface RouterDetails {
  ip: string
  model: string
  uptime: string
}

interface OltDetails {
  ip: string
  firmware: string
  cpu: string
  temp: string
}

interface PonDetails {
  status: string
  txPower: string
  activeOnus: number
}

interface SplitterDetails {
  ratio: string
  location: string
  availablePorts: number
}

interface OnuDetails {
  customer: string
  mac: string
  rxPower: string
}

export type NetworkNode = BaseNode & {
  details: RouterDetails | OltDetails | PonDetails | SplitterDetails | OnuDetails
  children?: NetworkNode[]
}

/* ── Mock Tree Data ── */

const networkTree: NetworkNode[] = [
  {
    id: "rt-core",
    label: "MikroTik Core Router",
    type: "router",
    details: {
      ip: "10.0.0.1",
      model: "CCR1036-8G-2S+",
      uptime: "142d 8h 12m",
    } as RouterDetails,
    children: [
      {
        id: "olt-1",
        label: "V-SOL 4-Port EPS OLT (Mirpur Core)",
        type: "olt",
        details: {
          ip: "10.0.0.5",
          firmware: "V2.0.5B12",
          cpu: "14%",
          temp: "42°C",
        } as OltDetails,
        children: [
          {
            id: "pon-1",
            label: "PON Port 1",
            type: "pon",
            details: {
              status: "Up",
              txPower: "4.5 dBm",
              activeOnus: 62,
            } as PonDetails,
            children: [
              {
                id: "spl-1-1",
                label: "1:8 Splitter (Main Road, Pole #12)",
                type: "splitter",
                details: {
                  ratio: "1:8",
                  location: "Main Road, Pole #12",
                  availablePorts: 2,
                } as SplitterDetails,
                children: [
                  {
                    id: "onu-101",
                    label: "Rahim Uddin (ONU)",
                    type: "onu",
                    details: {
                      customer: "Rahim Uddin",
                      mac: "E0:67:B3:2A:1B:4C",
                      rxPower: "-19.5",
                    } as OnuDetails,
                  },
                  {
                    id: "onu-102",
                    label: "Kamal Hossain (ONU)",
                    type: "onu",
                    details: {
                      customer: "Kamal Hossain",
                      mac: "E0:67:B3:9F:8D:11",
                      rxPower: "-28.2",
                    } as OnuDetails,
                  },
                ],
              },
              {
                id: "spl-1-2",
                label: "1:16 Splitter (Section 6, Block C)",
                type: "splitter",
                details: {
                  ratio: "1:16",
                  location: "Section 6, Block C",
                  availablePorts: 0,
                } as SplitterDetails,
                children: [
                  {
                    id: "onu-201",
                    label: "Sonia Begum (ONU)",
                    type: "onu",
                    details: {
                      customer: "Sonia Begum",
                      mac: "A4:91:C2:55:FF:AA",
                      rxPower: "-22.1",
                    } as OnuDetails,
                  },
                ],
              },
            ],
          },
          {
            id: "pon-2",
            label: "PON Port 2",
            type: "pon",
            details: {
              status: "Down",
              txPower: "-40.0 dBm",
              activeOnus: 0,
            } as PonDetails,
            children: [],
          },
        ],
      },
    ],
  },
]

/* ── Tree Icons By Type ── */
function NodeIcon({ type, className }: { type: NodeType; className?: string }) {
  switch (type) {
    case "router": return <Server className={cn("text-blue-500", className)} />
    case "olt": return <NetworkIcon className={cn("text-indigo-500", className)} />
    case "pon": return <Cable className={cn("text-amber-500", className)} />
    case "splitter": return <SplitSquareHorizontal className={cn("text-emerald-500", className)} />
    case "onu": return <Box className={cn("text-orange-500", className)} />
  }
}

/* ── Specific Detail Renders ── */

function RenderDetails({ node }: { node: NetworkNode }) {
  if (node.type === "router") {
    const d = node.details as RouterDetails
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Server className="h-3 w-3"/> Model</span>
          <p className="font-semibold">{d.model}</p>
        </div>
        <div className="space-y-1">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Activity className="h-3 w-3"/> Uptime</span>
          <p className="font-semibold">{d.uptime}</p>
        </div>
        <div className="space-y-1 col-span-2">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Wifi className="h-3 w-3"/> IP Address</span>
          <p className="font-mono bg-muted py-1 px-2 rounded-md inline-block">{d.ip}</p>
        </div>
      </div>
    )
  }

  if (node.type === "olt") {
    const d = node.details as OltDetails
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Wifi className="h-3 w-3"/> IP Address</span>
          <p className="font-mono bg-muted py-1 px-2 rounded-md inline-block">{d.ip}</p>
        </div>
        <div className="space-y-1">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Activity className="h-3 w-3"/> Firmware</span>
          <p className="font-mono text-sm">{d.firmware}</p>
        </div>
        <div className="space-y-1">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Cpu className="h-3 w-3"/> CPU Usage</span>
          <p className="font-semibold">{d.cpu}</p>
        </div>
        <div className="space-y-1">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Thermometer className="h-3 w-3"/> Temperature</span>
          <p className="font-semibold text-orange-600">{d.temp}</p>
        </div>
      </div>
    )
  }

  if (node.type === "pon") {
    const d = node.details as PonDetails
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1 col-span-2">
          <span className="text-sm font-medium text-muted-foreground">Admin Status</span>
          <div>
            <Badge variant={d.status === "Up" ? "default" : "destructive"}>
              {d.status}
            </Badge>
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-sm font-medium text-muted-foreground">Tx Power</span>
          <p className="font-semibold">{d.txPower}</p>
        </div>
        <div className="space-y-1">
          <span className="text-sm font-medium text-muted-foreground">Active ONUs</span>
          <p className="font-semibold">{d.activeOnus}</p>
        </div>
      </div>
    )
  }

  if (node.type === "splitter") {
    const d = node.details as SplitterDetails
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <span className="text-sm font-medium text-muted-foreground">Splitter Ratio</span>
          <p className="font-mono font-bold text-lg">{d.ratio}</p>
        </div>
        <div className="space-y-1">
          <span className="text-sm font-medium text-muted-foreground">Available Ports</span>
          <p className={cn("font-semibold text-lg", d.availablePorts === 0 ? "text-destructive" : "text-emerald-600")}>
            {d.availablePorts}
          </p>
        </div>
        <div className="space-y-1 col-span-2">
          <span className="text-sm font-medium text-muted-foreground">Physical Location</span>
          <p className="bg-muted py-2 px-3 rounded-md text-sm">{d.location}</p>
        </div>
      </div>
    )
  }

  if (node.type === "onu") {
    const d = node.details as OnuDetails
    const rx = parseFloat(d.rxPower)
    const isBadPower = rx < -27 || rx > -8
    
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1 col-span-2">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Laptop className="h-3 w-3"/> Customer Name</span>
          <p className="font-semibold text-lg">{d.customer}</p>
        </div>
        <div className="space-y-1">
          <span className="text-sm font-medium text-muted-foreground">MAC Address</span>
          <p className="font-mono bg-muted py-1 px-2 rounded-md inline-block text-sm">{d.mac}</p>
        </div>
        <div className="space-y-1">
          <span className="text-sm font-medium text-muted-foreground">Optical Power (Rx)</span>
          <div>
             <Badge className={cn(
               "text-sm px-2 py-0.5", 
               isBadPower ? "bg-red-500 hover:bg-red-600 text-white shadow-none" : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-none"
             )}>
              {d.rxPower} dBm
             </Badge>
          </div>
        </div>
      </div>
    )
  }

  return null
}


const securityAlerts = [
  { id: "1", timestamp: "Today, 10:45 AM", type: "Rogue DHCP Detected", location: "10.0.1.15", severity: "High", action: "Suspend Rogue ONU", customerName: "Rahim Uddin", onuMac: "E0:67:B3:2A:1B:4C" },
  { id: "2", timestamp: "Today, 09:12 AM", type: "MAC Loop Detected", location: "Splitter Section 6", severity: "High", action: "Suspend Rogue ONU", customerName: "Sonia Begum", onuMac: "A4:91:C2:55:FF:AA" },
  { id: "3", timestamp: "Yesterday, 11:30 PM", type: "MAC Spoofing Attempt", location: "10.0.0.210", severity: "High", action: "Force PPPoE Re-authentication", customerName: "Kamal Hossain", onuMac: "E0:67:B3:9F:8D:11" }
]


/* ──────────────────────────────────────────────────────────── */
/*  CORE UPLINKS — live telemetry + historical charts          */
/* ──────────────────────────────────────────────────────────── */

const MAX_CHART_POINTS = 30 // rolling window for live area charts

interface VlanLiveData {
  rx_mbps: number
  tx_mbps: number
}

interface LiveSnapshot {
  time: string
  [key: string]: number | string // rx_IIG, tx_IIG, etc.
}

function CoreUplinksSection() {
  /* === LIVE POLLING STATE === */
  const [liveData, setLiveData] = useState<Record<string, VlanLiveData>>({})
  const [liveHistory, setLiveHistory] = useState<Record<string, LiveSnapshot[]>>(() => {
    const initial: Record<string, LiveSnapshot[]> = {}
    VLANS.forEach(v => { initial[v.name] = [] })
    return initial
  })
  const [liveError, setLiveError] = useState<string | null>(null)
  const [isLiveLoading, setIsLiveLoading] = useState(true)

  /* === HISTORICAL STATE === */
  const [histPeriod, setHistPeriod] = useState<'today' | 'week' | 'month'>('today')
  const [histData, setHistData] = useState<any[]>([])
  const [isHistLoading, setIsHistLoading] = useState(true)

  /* ── Live Polling ── */
  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch('/api/mikrotik/uplink-live', { cache: 'no-store' })
      const json = await res.json()
      if (!json.success) {
        setLiveError(json.error || 'Unknown error')
        return
      }
      setLiveError(null)
      const vlans: Record<string, VlanLiveData> = json.vlans || {}
      setLiveData(vlans)

      const now = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })

      setLiveHistory(prev => {
        const next = { ...prev }
        VLANS.forEach(v => {
          const point: LiveSnapshot = {
            time: now,
            rx: vlans[v.name]?.rx_mbps ?? 0,
            tx: vlans[v.name]?.tx_mbps ?? 0,
          }
          const arr = [...(next[v.name] || []), point]
          next[v.name] = arr.slice(-MAX_CHART_POINTS)
        })
        return next
      })
    } catch (err: any) {
      setLiveError(err.message)
    } finally {
      setIsLiveLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLive()
    const interval = setInterval(fetchLive, 1000)
    return () => clearInterval(interval)
  }, [fetchLive])

  /* ── Historical Data ── */
  const fetchHistorical = useCallback(async () => {
    setIsHistLoading(true)
    try {
      const res = await fetch(`/api/mikrotik/uplink-history?period=${histPeriod}`, { cache: 'no-store' })
      const json = await res.json()
      if (json.success) {
        setHistData(json.data || [])
      }
    } catch {
      // silently fail — chart will be empty
    } finally {
      setIsHistLoading(false)
    }
  }, [histPeriod])

  useEffect(() => {
    fetchHistorical()
  }, [fetchHistorical])

  /* ── Custom Tooltip ── */
  const LiveTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-xl p-3 text-xs min-w-[140px]">
        <p className="text-muted-foreground font-medium mb-1.5">{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
              {p.dataKey === 'rx' ? 'Download' : 'Upload'}
            </span>
            <span className="font-mono font-semibold">{p.value.toFixed(1)} Mbps</span>
          </div>
        ))}
      </div>
    )
  }

  const HistTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-xl p-3 text-xs min-w-[160px]">
        <p className="text-muted-foreground font-medium mb-1.5">{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: p.fill || p.color }} />
              {p.name}
            </span>
            <span className="font-mono font-semibold">{p.value.toFixed(2)} GB</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Section Header ── */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg border border-indigo-500/20">
          <Zap className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Core VLAN Uplinks — Live Telemetry</h3>
          <p className="text-xs text-muted-foreground">Real-time bandwidth monitoring across 5 core VLANs. Polling every 2s.</p>
        </div>
        {liveError && (
          <Badge variant="destructive" className="ml-auto text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {liveError}
          </Badge>
        )}
        {!liveError && !isLiveLoading && (
          <Badge variant="outline" className="ml-auto text-xs border-emerald-500/50 text-emerald-400 bg-emerald-500/10">
            <Activity className="h-3 w-3 mr-1 animate-pulse" />
            Live
          </Badge>
        )}
      </div>

      {/* ── Live Area Charts Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-4">
        {VLANS.map(vlan => {
          const data = liveHistory[vlan.name] || []
          const current = liveData[vlan.name]
          const rx = current?.rx_mbps ?? 0
          const tx = current?.tx_mbps ?? 0

          return (
            <Card key={vlan.name} className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm group hover:border-border transition-colors">
              {/* Glow accent */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity"
                style={{ background: `linear-gradient(90deg, transparent, ${vlan.color}, transparent)` }}
              />
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: vlan.color }} />
                    {vlan.name}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs">
                    <ArrowDown className="h-3 w-3 text-emerald-400" />
                    <span className="font-mono font-bold text-emerald-400">{rx.toFixed(1)}</span>
                    <span className="text-muted-foreground">Mbps</span>
                  </span>
                  <span className="flex items-center gap-1 text-xs">
                    <ArrowUp className="h-3 w-3 text-blue-400" />
                    <span className="font-mono font-bold text-blue-400">{tx.toFixed(1)}</span>
                    <span className="text-muted-foreground">Mbps</span>
                  </span>
                </div>
              </CardHeader>
              <CardContent className="px-2 pb-2 pt-0">
                <div className="h-[100px]">
                  {isLiveLoading && data.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id={`grad-rx-${vlan.name}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id={`grad-tx-${vlan.name}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="time" hide />
                        <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                        <Tooltip content={<LiveTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="rx"
                          stroke="#10b981"
                          strokeWidth={1.5}
                          fill={`url(#grad-rx-${vlan.name})`}
                          dot={false}
                          isAnimationActive={false}
                        />
                        <Area
                          type="monotone"
                          dataKey="tx"
                          stroke="#3b82f6"
                          strokeWidth={1.5}
                          fill={`url(#grad-tx-${vlan.name})`}
                          dot={false}
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ── Historical Consumption Chart ── */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg border border-amber-500/20">
                <TrendingUp className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-base">Historical VLAN Consumption</CardTitle>
                <CardDescription className="text-xs">
                  Delta-based bandwidth usage per VLAN — calculated from <code className="text-[10px] bg-muted px-1 py-0.5 rounded">vlan_logs</code> snapshots.
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-1 p-1 bg-muted/50 rounded-lg border border-border/50">
              {(['today', 'week', 'month'] as const).map(period => (
                <Button
                  key={period}
                  size="sm"
                  variant={histPeriod === period ? "default" : "ghost"}
                  className={cn(
                    "h-7 text-xs font-medium px-3 rounded-md",
                    histPeriod === period && "shadow-sm"
                  )}
                  onClick={() => setHistPeriod(period)}
                >
                  {period === 'today' ? 'Today' : period === 'week' ? 'This Week' : 'This Month'}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] w-full">
            {isHistLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : histData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                <TrendingUp className="h-10 w-10 opacity-30" />
                <p className="text-sm">No historical data yet.</p>
                <p className="text-xs">Start the uplink logger cron to populate this chart.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="vlan"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v} GB`}
                  />
                  <Tooltip content={<HistTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 11 }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Bar name="Download (GB)" dataKey="download_gb" radius={[4, 4, 0, 0]} maxBarSize={48}>
                    {histData.map((entry: any, idx: number) => {
                      const vlan = VLANS.find(v => v.name === entry.vlan)
                      return (
                        <rect key={idx} fill={vlan?.color || '#6366f1'} />
                      )
                    })}
                  </Bar>
                  <Bar name="Upload (GB)" dataKey="upload_gb" radius={[4, 4, 0, 0]} maxBarSize={48} opacity={0.6}>
                    {histData.map((entry: any, idx: number) => {
                      const vlan = VLANS.find(v => v.name === entry.vlan)
                      return (
                        <rect key={idx} fill={vlan?.color || '#6366f1'} />
                      )
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


/* ──────────────────────────────────────────────────────────── */
/*  MAIN PAGE COMPONENT                                        */
/* ──────────────────────────────────────────────────────────── */

export default function NetworkTopologyPage() {
  const [selectedNode, setSelectedNode] = useState<NetworkNode>(networkTree[0])
  const [mitigatingAlert, setMitigatingAlert] = useState<any>(null)
  const [mitigationStep, setMitigationStep] = useState(0)
  const [isMitigateDialogOpen, setIsMitigateDialogOpen] = useState(false)

  const handleMitigate = (alert: any) => {
    setMitigatingAlert(alert)
    setMitigationStep(0)
    setIsMitigateDialogOpen(true)

    setTimeout(() => {
      setMitigationStep(1)
      setTimeout(() => {
        setMitigationStep(2)
        setTimeout(() => {
          setMitigationStep(3)
        }, 1200)
      }, 1200)
    }, 1200)
  }

  const renderTree = (nodes: NetworkNode[]) => {
    return (
      <Accordion className="w-full space-y-1" defaultValue={networkTree.map(n => n.id)}>
        {nodes.map(node => {
          const hasChildren = node.children && node.children.length > 0

          if (!hasChildren) {
            const isSelected = selectedNode.id === node.id
            return (
              <div
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className={cn(
                  "flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer text-sm font-medium hover:bg-muted ml-6 transition-colors",
                  isSelected && "bg-primary/10 text-primary border border-primary/20"
                )}
              >
                <NodeIcon type={node.type} className="h-4 w-4" />
                <span className="truncate">{node.label}</span>
              </div>
            )
          }

          const isSelected = selectedNode.id === node.id
          return (
            <AccordionItem value={node.id} key={node.id} className="border-none">
              <AccordionTrigger 
                className={cn(
                  "py-2 px-3 rounded-md hover:no-underline hover:bg-muted transition-colors data-[state=open]:pb-2",
                  isSelected && "bg-primary/10 text-primary border border-primary/20"
                )}
                onClick={() => setSelectedNode(node)}
              >
                <div className="flex items-center gap-2 text-sm text-left font-medium">
                  <NodeIcon type={node.type} className="h-4 w-4" />
                  <span className="truncate">{node.label}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-0 pt-1 pl-4 border-l ml-3 mt-1 border-muted-foreground/20">
                {renderTree(node.children!)}
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">Network Topology</h1>
        <p className="text-muted-foreground text-sm">
          Visualize your fiber GPON/EPON infrastructure to quickly identify faults.
        </p>
      </div>
      <Separator className="shrink-0" />

      <Tabs defaultValue="uplinks" className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-fit shrink-0 mb-4">
          <TabsTrigger value="uplinks">Core Uplinks</TabsTrigger>
          <TabsTrigger value="topology">Topology</TabsTrigger>
          <TabsTrigger value="alerts">Security Alerts</TabsTrigger>
        </TabsList>

        {/* ── NEW: Core Uplinks Tab ── */}
        <TabsContent value="uplinks" className="flex-1 min-h-0 m-0 border-0 p-0 outline-none">
          <CoreUplinksSection />
        </TabsContent>

        <TabsContent value="topology" className="flex-1 min-h-0 m-0 border-0 p-0 outline-none">
          <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-14rem)] md:h-full">
            {/* ── Left Column: Fiber Tree ── */}
        <Card className="md:w-1/2 lg:w-2/5 flex flex-col h-full bg-card/50">
          <CardHeader className="py-4 shrink-0 border-b">
            <CardTitle className="text-lg">Network Map</CardTitle>
          </CardHeader>
          <CardContent className="p-4 overflow-y-auto flex-1">
            {renderTree(networkTree)}
          </CardContent>
        </Card>

        {/* ── Right Column: Device Details Panel ── */}
        <Card className="flex-1 flex flex-col h-full border-primary/20 shadow-lg relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 opacity-[0.03] pointer-events-none">
             <NodeIcon type={selectedNode.type} className="w-64 h-64" />
          </div>

          <CardHeader className="bg-muted/30 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-background rounded-md shadow-sm border">
                <NodeIcon type={selectedNode.type} className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl">{selectedNode.label}</CardTitle>
                <CardDescription className="uppercase tracking-wider font-semibold text-xs mt-1">
                  Device Type: <span className="text-primary">{selectedNode.type}</span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8 flex-1 overflow-y-auto z-10">
            <RenderDetails node={selectedNode} />
          </CardContent>
        </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="flex-1 min-h-0 m-0 border-0 p-0 outline-none">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold tracking-tight">Active Infrastructure Threats</h3>
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Threat Type</TableHead>
                    <TableHead>Location/IP</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {securityAlerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="text-muted-foreground">{alert.timestamp}</TableCell>
                      <TableCell className="font-medium">{alert.type}</TableCell>
                      <TableCell className="font-mono text-sm">{alert.location}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          alert.severity === "High" ? "border-red-500 text-red-500 bg-red-50 dark:bg-red-500/10" : "border-amber-500 text-amber-500 bg-amber-50 dark:bg-amber-500/10"
                        )}>
                          {alert.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="font-medium"
                          onClick={() => handleMitigate(alert)}
                        >
                          {alert.action}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isMitigateDialogOpen} onOpenChange={setIsMitigateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Mitigating Threat: {mitigatingAlert?.type}</DialogTitle>
            <DialogDescription>
              Executing automated security protocols for {mitigatingAlert?.customerName || "Device"}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div className="flex items-center gap-4">
              {mitigationStep >= 1 ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Loader2 className="h-5 w-5 text-primary animate-spin" />}
              <div className="flex-1">
                <p className="text-sm font-medium">Surgical Strike: {mitigatingAlert?.action}</p>
                <p className="text-xs text-muted-foreground">Targeting MAC: {mitigatingAlert?.onuMac} on {mitigatingAlert?.location}</p>
              </div>
            </div>
            
            <div className={cn("flex items-center gap-4 transition-opacity", mitigationStep >= 1 ? "opacity-100" : "opacity-40")}>
              {mitigationStep >= 2 ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : (mitigationStep === 1 ? <Loader2 className="h-5 w-5 text-primary animate-spin" /> : <AlertTriangle className="h-5 w-5 text-muted-foreground" />)}
              <div className="flex-1">
                <p className="text-sm font-medium">Auto-Ticketing</p>
                <p className="text-xs text-muted-foreground">Generating High Priority Ticket: Rogue Device Isolated - {mitigatingAlert?.customerName}</p>
              </div>
            </div>

            <div className={cn("flex items-center gap-4 transition-opacity", mitigationStep >= 2 ? "opacity-100" : "opacity-40")}>
              {mitigationStep >= 3 ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : (mitigationStep === 2 ? <Loader2 className="h-5 w-5 text-primary animate-spin" /> : <MessageSquare className="h-5 w-5 text-muted-foreground" />)}
              <div className="flex-1">
                <p className="text-sm font-medium">Customer Alert SMS</p>
                <p className="text-xs text-muted-foreground">Dispatching notification to {mitigatingAlert?.customerName}: "Security Alert: A router misconfiguration has been detected..."</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button 
              disabled={mitigationStep < 3} 
              onClick={() => setIsMitigateDialogOpen(false)}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
