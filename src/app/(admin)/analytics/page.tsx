"use client"

import { useState } from "react"
import { CalendarIcon, LineChart as LineChartIcon, Download, Upload, Activity } from "lucide-react"
import { format, subDays } from "date-fns"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

/* ── Mock Data ── */
const generateData = () => {
  const data = []
  for (let i = 0; i < 24; i++) {
    const hour = i.toString().padStart(2, '0') + ':00'
    // simulate a natural traffic curve (higher in evening)
    const baseTx = 200 + Math.sin(i / 24 * Math.PI * 2 - Math.PI / 2) * 150 + Math.random() * 50
    const baseRx = baseTx * 4 + Math.random() * 200
    
    data.push({
      time: hour,
      Upload: Math.max(0, Math.round(baseTx)),
      Download: Math.max(0, Math.round(baseRx)),
    })
  }
  return data
}

const trafficData = generateData()

export default function AnalyticsPage() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  })

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Network Analytics</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Visualize your bandwidth utilization and traffic trends.
          </p>
        </div>
        
        <div className="flex items-center space-x-2 z-10">
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Traffic</SelectItem>
              <SelectItem value="summit">Summit Communications</SelectItem>
              <SelectItem value="fiber">Fiber@Home</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger
              render={
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-[260px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                />
              }
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date</span>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-50" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Card className="border-indigo-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChartIcon className="h-5 w-5 text-indigo-500" />
            24-Hour Bandwidth Utilization
          </CardTitle>
          <CardDescription>Live telemetry showing Download (Rx) and Upload (Tx) rates.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDownload" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis dataKey="time" className="text-xs text-muted-foreground" tickLine={false} axisLine={false} />
                <YAxis className="text-xs text-muted-foreground" tickLine={false} axisLine={false} tickFormatter={(value) => `${value} Mbps`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "var(--background)", borderColor: "var(--border)", borderRadius: "8px" }}
                  formatter={(value) => [`${value} Mbps`, undefined]}
                />
                <Area type="monotone" dataKey="Download" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorDownload)" activeDot={{ r: 6 }} />
                <Area type="monotone" dataKey="Upload" stroke="#3b82f6" strokeWidth={3} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Download</CardTitle>
            <Download className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2 Gbps</div>
            <p className="text-xs text-muted-foreground">Recorded at 9:30 PM</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Daily Traffic</CardTitle>
            <Upload className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.5 TB</div>
            <p className="text-xs text-muted-foreground">Up 12% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Live Traffic</CardTitle>
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">850 Mbps</div>
            <p className="text-xs text-muted-foreground">System telemetry active</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
