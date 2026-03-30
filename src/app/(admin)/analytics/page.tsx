"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { 
  Users, 
  UserMinus, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  Zap, 
  Trophy,
  Activity,
  Download,
  Loader2,
  AlertTriangle,
  ShieldAlert,
  Gauge,
  Wallet,
  Target,
  Clock,
  ChevronRight,
  Banknote,
  BarChart3,
  RefreshCw,
  FileDown,
} from "lucide-react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useReactToPrint } from "react-to-print"
import PrintableReport from "./PrintableReport"

// ── Donut chart colors ──
const DONUT_COLORS = ['#10b981', '#f43f5e']  // Collected (green), Outstanding (red)
const LEAKAGE_COLORS = ['#f97316', '#e2e8f0'] // Leakage (orange), Remaining

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [forecast, setForecast] = useState<any>(null)
  const [anomalies, setAnomalies] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [anomalyLoading, setAnomalyLoading] = useState(true)

  // PDF Report
  const printRef = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Purrfect_Universe_Report_${new Date().toISOString().split('T')[0]}`,
    pageStyle: `
      @page { size: A4; margin: 0; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `,
  })

  const fetchBI = useCallback(async () => {
    try {
      const [biRes, forecastRes] = await Promise.all([
        fetch("/api/analytics/bi"),
        fetch("/api/analytics/forecast"),
      ])
      if (!biRes.ok) throw new Error("Failed to fetch BI data")
      if (!forecastRes.ok) throw new Error("Failed to fetch forecast data")
      const biJson = await biRes.json()
      const forecastJson = await forecastRes.json()
      setData(biJson)
      setForecast(forecastJson.forecast)
    } catch (err: any) {
      toast.error("Analytics Error", { description: err.message })
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAnomalies = useCallback(async () => {
    try {
      setAnomalyLoading(true)
      const res = await fetch("/api/network/anomalies")
      const json = await res.json()
      setAnomalies(json)
    } catch (err: any) {
      console.error("Anomaly fetch error:", err)
      setAnomalies({ anomalyCount: 0, anomalies: [], topUsers: [] })
    } finally {
      setAnomalyLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBI()
    fetchAnomalies()
  }, [fetchBI, fetchAnomalies])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">Generating Intelligence Reports...</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { growth, financials, profitability, leakage, staffPerformance, bandwidth, efficiency, leaderboard, revenueTrend } = data

  const latestGrowth = growth[growth.length - 1]
  const lastGrowth = growth[growth.length - 2]

  // Donut chart data for Collected vs Outstanding
  const collectionDonut = [
    { name: 'Collected', value: profitability?.totalCollected || 0 },
    { name: 'Outstanding', value: profitability?.outstanding || 0 },
  ]

  // Leakage Gauge data
  const leakagePct = leakage?.leakagePercentage || 0
  const leakageGauge = [
    { name: 'Leakage', value: leakagePct },
    { name: 'Remaining', value: Math.max(0, 100 - leakagePct) },
  ]

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-background">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 pb-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Business Intelligence</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Actionable insights to drive growth and financial health.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <FileDown className="h-3.5 w-3.5 mr-1.5" />
            Generate PDF Report
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchBI(); fetchAnomalies(); }}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* KPI Row: The Vital Signs                                      */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Gains</CardTitle>
            <Users className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestGrowth.newJoins}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {latestGrowth.newJoins >= lastGrowth.newJoins ? (
                <span className="text-emerald-500 flex items-center gap-0.5 font-medium">
                  <ArrowUpRight className="h-3 w-3" />
                  +{(latestGrowth.newJoins - lastGrowth.newJoins)} from last month
                </span>
              ) : (
                <span className="text-rose-500 flex items-center gap-0.5 font-medium">
                  <ArrowDownRight className="h-3 w-3" />
                  -{(lastGrowth.newJoins - latestGrowth.newJoins)} from last month
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn (Loss)</CardTitle>
            <UserMinus className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestGrowth.churn}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {latestGrowth.churn <= lastGrowth.churn ? (
                <span className="text-emerald-500 flex items-center gap-0.5 font-medium">
                  <ArrowDownRight className="h-3 w-3" />
                  Reduced {- (latestGrowth.churn - lastGrowth.churn)} vs last mo
                </span>
              ) : (
                <span className="text-rose-500 flex items-center gap-0.5 font-medium">
                  <ArrowUpRight className="h-3 w-3" />
                  Increased {(latestGrowth.churn - lastGrowth.churn)} vs last mo
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">৳{financials.gross.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-1">
               <Badge variant="outline" className={cn(
                 "text-[10px] h-4.5 px-1.5",
                 financials.diff >= 0 ? "border-emerald-500/20 text-emerald-500 bg-emerald-500/5" : "border-rose-500/20 text-rose-500 bg-rose-500/5"
               )}>
                 {financials.diffLabel} vs last month
               </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projected Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">৳{financials.projected.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Expected based on active plans</p>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Row 2: Profitability Engine + Collection Donut                 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Revenue Realization Card */}
        <Card className="shadow-none overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-amber-500" />
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Wallet className="h-4 w-4 text-emerald-500" />
              Profitability Engine
            </CardTitle>
            <CardDescription className="text-xs">Revenue realization & profit margin projection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Collection Efficiency */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Collection Efficiency</span>
                <span className={cn(
                  "font-bold font-mono",
                  (profitability?.collectionEfficiency || 0) >= 80 ? "text-emerald-500" : 
                  (profitability?.collectionEfficiency || 0) >= 50 ? "text-amber-500" : "text-rose-500"
                )}>
                  {profitability?.collectionEfficiency || 0}%
                </span>
              </div>
              <Progress 
                value={Math.min(100, profitability?.collectionEfficiency || 0)} 
                className="h-2" 
              />
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Collected: ৳{(profitability?.totalCollected || 0).toLocaleString()}</span>
                <span>Billed: ৳{(profitability?.totalBilled || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Net Profit */}
            <div className="rounded-lg border p-3 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    Estimated Net Profit
                  </span>
                  <div className={cn(
                    "text-2xl font-black font-mono",
                    (profitability?.netProfit || 0) >= 0 ? "text-emerald-500" : "text-rose-500"
                  )}>
                    ৳{(profitability?.netProfit || 0).toLocaleString()}
                  </div>
                </div>
                <div className="text-right space-y-0.5">
                  <span className="text-[10px] text-muted-foreground block">Margin</span>
                  <Badge variant="outline" className={cn(
                    "text-[10px]",
                    (profitability?.profitMargin || 0) >= 30 
                      ? "border-emerald-500/20 text-emerald-500 bg-emerald-500/5" 
                      : "border-rose-500/20 text-rose-500 bg-rose-500/5"
                  )}>
                    {profitability?.profitMargin || 0}%
                  </Badge>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                After static expenses of ৳{(profitability?.staticExpense || 0).toLocaleString()} (IIG + Salaries)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Collection Donut Chart */}
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Banknote className="h-4 w-4 text-emerald-500" />
              Collection Status
            </CardTitle>
            <CardDescription className="text-xs">Collected vs Outstanding this billing cycle</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[200px] w-[200px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={collectionDonut}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {collectionDonut.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={DONUT_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any) => `৳${Number(val).toLocaleString()}`} 
                    contentStyle={{ borderRadius: '8px', fontSize: '11px', border: '1px solid hsl(var(--border))' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] text-muted-foreground font-medium">RATE</span>
                <span className="text-lg font-black font-mono">
                  {profitability?.collectionEfficiency || 0}%
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-medium">Collected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                <span className="text-[11px] font-medium">Outstanding</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Leakage Gauge */}
        <Card className={cn(
          "shadow-none overflow-hidden relative",
          leakage?.isAlert && "ring-1 ring-orange-500/30"
        )}>
          {leakage?.isAlert && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-red-500" />
          )}
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Gauge className="h-4 w-4 text-orange-500" />
              Revenue Leakage
              {leakage?.isAlert && (
                <Badge variant="outline" className="text-[9px] h-4 border-orange-500/30 text-orange-500 bg-orange-500/5 ml-auto">
                  ⚠ EXCESSIVE
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs">Discounts vs Gross Revenue (Alert if &gt;5%)</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[160px] w-[160px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leakageGauge}
                    cx="50%"
                    cy="50%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {leakageGauge.map((_, index) => (
                      <Cell key={`leak-${index}`} fill={LEAKAGE_COLORS[index]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center mt-[-20px]">
                <span className={cn(
                  "text-3xl font-black font-mono",
                  leakage?.isAlert ? "text-orange-500" : "text-emerald-500"
                )}>
                  {leakagePct.toFixed(1)}%
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">of gross revenue</span>
              </div>
            </div>
            <div className="w-full space-y-2 mt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Gross (Before Discount)</span>
                <span className="font-mono font-bold">৳{(leakage?.totalGrossBeforeDiscount || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Total Discounted</span>
                <span className={cn("font-mono font-bold", leakage?.isAlert ? "text-orange-500" : "")}>
                  ৳{(leakage?.totalDiscounted || 0).toLocaleString()}
                </span>
              </div>
              {leakage?.isAlert && (
                <p className="text-[10px] text-orange-500 font-medium pt-1">
                  ⚠ Discounts exceed 5% threshold. Review staff discount approvals.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Row 3: Forecast Card + Growth Chart                           */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Growth Logic Chart */}
        <Card className="lg:col-span-4 shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-500" />
                Customer Growth Logic
            </CardTitle>
            <CardDescription className="text-xs">Stacked analysis of New Joins vs Cancellations (Last 6 Months)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] mt-2">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-[11px] font-mono" />
                    <YAxis axisLine={false} tickLine={false} className="text-[11px] font-mono" />
                    <Tooltip cursor={{fill: 'hsl(var(--muted))', opacity: 0.2}} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                    <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '11px', fontWeight: 'bold'}} />
                    <Bar dataKey="newJoins" name="New Joins" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} barSize={40} />
                    <Bar dataKey="churn" name="Cancellations" fill="#f43f5e" stackId="a" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Forecast Card */}
        <Card className="lg:col-span-3 shadow-none overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-cyan-500" />
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-violet-500" />
              Revenue Forecast
            </CardTitle>
            <CardDescription className="text-xs">Projected revenue based on active subscriptions & growth</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-2">
            {forecast ? (
              <>
                {/* Next Month Expected */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    Next Month Expected Revenue
                  </span>
                  <div className="text-3xl font-black font-mono">
                    ৳{(forecast.nextMonthExpected || 0).toLocaleString()}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {forecast.totalActiveUsers} active subscribers × avg plan fee
                  </p>
                </div>

                {/* Growth Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border p-2.5 text-center bg-emerald-500/5">
                    <span className="text-[10px] text-muted-foreground block">New</span>
                    <span className="text-lg font-bold text-emerald-500">{forecast.newJoins}</span>
                  </div>
                  <div className="rounded-lg border p-2.5 text-center bg-rose-500/5">
                    <span className="text-[10px] text-muted-foreground block">Churn</span>
                    <span className="text-lg font-bold text-rose-500">{forecast.churn}</span>
                  </div>
                  <div className={cn(
                    "rounded-lg border p-2.5 text-center",
                    forecast.netGrowth >= 0 ? "bg-emerald-500/5" : "bg-rose-500/5"
                  )}>
                    <span className="text-[10px] text-muted-foreground block">Net</span>
                    <span className={cn(
                      "text-lg font-bold",
                      forecast.netGrowth >= 0 ? "text-emerald-500" : "text-rose-500"
                    )}>
                      {forecast.netGrowth >= 0 ? '+' : ''}{forecast.netGrowth}
                    </span>
                  </div>
                </div>

                {/* 3-Month Projected */}
                {forecast.isGrowthPositive && (
                  <div className="rounded-lg border p-3 bg-gradient-to-r from-violet-500/5 to-cyan-500/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium block">
                          3-Month Projection
                        </span>
                        <span className="text-xl font-black font-mono text-violet-500">
                          ৳{(forecast.projectedRevenue3M || 0).toLocaleString()}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[9px] border-violet-500/20 text-violet-500 bg-violet-500/5">
                        <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                        +{forecast.growthPercentage}%/mo
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Compounded at current {forecast.growthPercentage}% monthly growth rate
                    </p>
                  </div>
                )}

                {!forecast.isGrowthPositive && (
                  <div className="rounded-lg border p-3 bg-rose-500/5">
                    <div className="flex items-center gap-2 text-rose-500">
                      <ArrowDownRight className="h-4 w-4" />
                      <span className="text-xs font-bold">No Growth Projection Available</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Net growth is negative this month. Focus on retention to improve forecasts.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Row 4: Staff Performance Table                                */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Target className="h-4 w-4 text-indigo-500" />
            Staff Performance — Current Billing Cycle
          </CardTitle>
          <CardDescription className="text-xs">
            Per-collector targets, collection progress, and average days to collect
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Collector</TableHead>
                <TableHead className="text-right">Assigned Target (৳)</TableHead>
                <TableHead className="text-right">Amount Collected (৳)</TableHead>
                <TableHead className="w-[180px]">Progress (%)</TableHead>
                <TableHead className="text-center">Avg Days to Collect</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(staffPerformance || []).length > 0 ? (
                staffPerformance.map((staff: any, idx: number) => (
                  <TableRow key={staff.name}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground/40 w-4">#{idx + 1}</span>
                        <span className="font-semibold text-sm">{staff.name}</span>
                        <Badge variant="outline" className="text-[9px] h-4">
                          {staff.assignedUsers} users
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      ৳{staff.assignedTarget.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-bold text-emerald-600">
                      ৳{staff.collected.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={Math.min(100, staff.progress)} 
                          className="h-2 flex-1" 
                        />
                        <span className={cn(
                          "text-xs font-bold w-10 text-right",
                          staff.progress >= 80 ? "text-emerald-500" :
                          staff.progress >= 50 ? "text-amber-500" :
                          "text-rose-500"
                        )}>
                          {staff.progress.toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className={cn(
                          "font-mono font-bold text-sm",
                          staff.avgDaysToCollect <= 10 ? "text-emerald-500" :
                          staff.avgDaysToCollect <= 20 ? "text-amber-500" :
                          "text-rose-500"
                        )}>
                          {staff.avgDaysToCollect} days
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic">
                    No staff performance data available for this cycle.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Row 5: Heavy User Anomalies Alert                             */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Card className={cn(
        "shadow-none overflow-hidden relative",
        (anomalies?.anomalyCount || 0) > 0 && "ring-1 ring-red-500/20"
      )}>
        {(anomalies?.anomalyCount || 0) > 0 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500" />
        )}
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-500" />
                Heavy User Alert — Anomalous Usage Detector
                {(anomalies?.anomalyCount || 0) > 0 && (
                  <Badge className="bg-red-500 text-white text-[9px] h-4 ml-1">
                    {anomalies.anomalyCount} FLAGGED
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                PPPoE users consuming &gt;20% of total IIG VLAN traffic — potential resellers
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchAnomalies} disabled={anomalyLoading}>
              {anomalyLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {anomalyLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground ml-2">Scanning network interfaces...</span>
            </div>
          ) : (anomalies?.anomalies || []).length > 0 ? (
            <div className="space-y-3">
              {anomalies.anomalies.map((user: any, idx: number) => (
                <div 
                  key={user.username}
                  className="flex items-center justify-between rounded-lg border border-red-500/20 p-3 bg-red-500/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{user.fullName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[9px] h-4">{user.packageName}</Badge>
                        <span className="text-[10px] text-muted-foreground">@{user.username}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black font-mono text-red-500">
                      {user.totalGB} GB
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      {user.percentOfIIG}% of IIG traffic
                    </p>
                  </div>
                </div>
              ))}
              {anomalies.totalIIGTrafficGB > 0 && (
                <p className="text-[10px] text-muted-foreground text-center pt-1">
                  Total IIG traffic this session: {anomalies.totalIIGTrafficGB} GB · Threshold: {anomalies.thresholdGB} GB (20%)
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 mb-2">
                <ShieldAlert className="h-5 w-5 text-emerald-500" />
              </div>
              <p className="text-sm font-medium">No Anomalies Detected</p>
              <p className="text-[10px] mt-1">All users are within normal usage thresholds.</p>
            </div>
          )}

          {/* Top Users Preview */}
          {!anomalyLoading && (anomalies?.topUsers || []).length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs font-bold text-muted-foreground mb-2">Top 5 Consumers</p>
              <div className="space-y-2">
                {anomalies.topUsers.slice(0, 5).map((user: any) => (
                  <div key={user.username} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{user.fullName}</span>
                      <Badge variant="outline" className="text-[8px] h-3.5">{user.packageName}</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-muted-foreground">
                        ↓ {user.downloadGB} GB · ↑ {user.uploadGB} GB
                      </span>
                      <span className="font-mono font-bold">
                        {user.totalGB} GB
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Row 6: Bandwidth, Collection Velocity & Leaderboard          */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Bandwidth Usage vs Last Month */}
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Download className="h-4 w-4 text-blue-500" />
              Bandwidth Utilization (TB)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             {Object.entries(bandwidth).map(([name, stats]: [string, any]) => (
                <div key={name} className="space-y-1.5">
                   <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold">{name}</span>
                      <span className="font-mono text-muted-foreground">
                        {stats.thisMonthTB} TB <span className="text-[10px] opacity-40 mx-1">/</span> {stats.lastMonthTB} TB
                      </span>
                   </div>
                   <div className="flex h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full" style={{ width: `${Math.min(100, (stats.thisMonthTB / (stats.lastMonthTB || 1)) * 50)}%` }} />
                   </div>
                </div>
             ))}
          </CardContent>
        </Card>

        {/* Revenue Velocity Chart */}
        <Card className="shadow-none">
           <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-500" />
                Collection Velocity
            </CardTitle>
            <CardDescription className="text-xs">Daily collections (Last 30 Days)</CardDescription>
          </CardHeader>
          <CardContent className="h-[240px] pt-2">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                   <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.2} />
                         <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                      </linearGradient>
                   </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                    <XAxis dataKey="date" hide />
                    <YAxis axisLine={false} tickLine={false} className="text-[10px] font-mono" />
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
                    <Area type="monotone" dataKey="amount" stroke="#fbbf24" strokeWidth={2} fillOpacity={1} fill="url(#revGrad)" />
                </AreaChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Efficiency Metric */}
        <Card className="shadow-none overflow-hidden relative">
           <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-indigo-500" />
           <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                Efficiency Index
            </CardTitle>
            <CardDescription className="text-xs">Monetization of Bandwidth Infrastructure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-2">
              <div className="flex flex-col gap-1">
                 <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Revenue per Peak Gbps</span>
                 <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black font-mono">৳{efficiency.revenuePerGbps.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">/ Gbps</span>
                 </div>
              </div>

              <div className="rounded-lg border p-2.5 bg-muted/20">
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Revenue per Peak Mbps</span>
                    <span className="text-lg font-black font-mono">
                      ৳{efficiency.peakIIG > 0 ? ((financials.gross || 0) / (efficiency.peakIIG * 1000)).toFixed(2) : '0.00'}
                    </span>
                 </div>
                 <span className="text-[9px] text-muted-foreground">Peak: {(efficiency.peakIIG * 1000).toFixed(0)} Mbps</span>
              </div>

              <div className="space-y-3">
                 <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Peak IIG Utilization</span>
                    <span className="font-bold font-mono">{efficiency.peakIIG} Gbps</span>
                 </div>
                 <Progress value={Math.min(100, efficiency.peakIIG * 5)} className="h-1.5" />
                 <p className="text-[10px] text-muted-foreground leading-relaxed">
                    This metric tracks if customer revenue is outpacing uplink infrastructure costs. Higher is better.
                 </p>
              </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Hidden Printable Report (off-screen for PDF generation) ── */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <PrintableReport ref={printRef} data={data} forecast={forecast} />
      </div>
    </div>
  )
}
