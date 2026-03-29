"use client"

import { useState } from "react"
import { Plus, Globe, Link, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const providers: any[] = []

const trafficData: any[] = []

export default function UpstreamProvidersPage() {
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false)

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Upstream Providers</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Manage your IIG/ITC uplinks, monitor live BGP traffic, and configure incoming routes.
          </p>
        </div>
        <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
          <DialogTrigger className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border-0">
            <Plus className="h-4 w-4 mr-2" /> Add New Upstream Link
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Upstream Link</DialogTitle>
              <DialogDescription>
                Register a new IIG or ITC provider along with BGP ASN and IP block details.
              </DialogDescription>
            </DialogHeader>
            <form className="grid gap-4 py-4" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <Label htmlFor="providerName">Provider Name</Label>
                <Input id="providerName" placeholder="e.g. Earth Telecommunication" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Purchased Capacity</Label>
                  <Input id="capacity" placeholder="e.g. 500 Mbps" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthlyCost">Monthly Cost</Label>
                  <Input id="monthlyCost" placeholder="e.g. ৳45,000" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact/NOC Number</Label>
                <Input id="contactNumber" placeholder="+880 1XXX-XXXXXX" />
              </div>
              <Separator className="my-2" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignedAsn">Assigned ASN</Label>
                  <Input id="assignedAsn" placeholder="e.g. AS13335" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ipBlock">Allocated IP Block</Label>
                  <Input id="ipBlock" placeholder="e.g. 103.X.X.0/24" />
                </div>
              </div>
            </form>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRegisterDialogOpen(false)}>Cancel</Button>
              <Button type="button" onClick={() => setIsRegisterDialogOpen(false)}>Save Provider</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-indigo-500" />
            Active Providers
          </CardTitle>
          <CardDescription>All established connections with your upstream partners.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider Name</TableHead>
                <TableHead>Purchased Capacity</TableHead>
                <TableHead>Monthly Cost</TableHead>
                <TableHead>Contact/NOC Number</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell className="font-medium">{provider.name}</TableCell>
                  <TableCell className="font-semibold">{provider.capacity}</TableCell>
                  <TableCell>{provider.cost}</TableCell>
                  <TableCell className="font-mono text-sm">{provider.contact}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-indigo-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-500" />
            Live Upstream Traffic (BGP/WAN)
          </CardTitle>
          <CardDescription>Real-time bandwidth pull against your purchased capacity limits.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trafficData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="time" className="text-xs text-muted-foreground" tickLine={false} axisLine={false} />
                <YAxis className="text-xs text-muted-foreground" tickLine={false} axisLine={false} tickFormatter={(value) => `${value} Gbps`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "var(--background)", borderColor: "var(--border)", borderRadius: "8px" }}
                  formatter={(value) => [`${value} Gbps`, undefined]}
                />
                <Line type="monotone" dataKey="Summit" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="FiberAtHome" stroke="#6366f1" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
