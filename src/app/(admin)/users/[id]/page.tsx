"use client"

import { use } from "react"
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

/* ── Mock Data ── */

interface UserProfile {
  id: string
  name: string
  phone: string
  address: string
  status: "Online" | "Offline" | "Suspended"
  avatar: string
  package: string
  monthlyBill: string
  nextDue: string
  ip: string
  pppoeUser: string
  pppoePwd: string
  mac: string
}

const mockUsers: Record<string, UserProfile> = {
  "1": {
    id: "1",
    name: "Rahim Uddin",
    phone: "01712-345678",
    address: "House 12, Road 5, Dhanmondi, Dhaka",
    status: "Online",
    avatar: "",
    package: "20 Mbps Standard",
    monthlyBill: "1,200 BDT",
    nextDue: "2026-04-01",
    ip: "10.0.0.12",
    pppoeUser: "rahim_uddin",
    pppoePwd: "r@him2026",
    mac: "AA:BB:CC:11:22:33",
  },
  "2": {
    id: "2",
    name: "Fatima Akter",
    phone: "01812-987654",
    address: "Flat 3B, Green View, Uttara, Dhaka",
    status: "Online",
    avatar: "",
    package: "10 Mbps Home",
    monthlyBill: "800 BDT",
    nextDue: "2026-04-05",
    ip: "10.0.0.34",
    pppoeUser: "fatima_akter",
    pppoePwd: "f@t1ma",
    mac: "DD:EE:FF:44:55:66",
  },
  "3": {
    id: "3",
    name: "Kamal Hossain",
    phone: "01912-111222",
    address: "45 College Road, Chittagong",
    status: "Offline",
    avatar: "",
    package: "50 Mbps Premium",
    monthlyBill: "2,000 BDT",
    nextDue: "2026-04-10",
    ip: "10.0.0.57",
    pppoeUser: "kamal_hossain",
    pppoePwd: "k@m@l50",
    mac: "11:22:33:AA:BB:CC",
  },
  "4": {
    id: "4",
    name: "Nasrin Sultana",
    phone: "01612-333444",
    address: "12/A Mirpur Road, Dhaka",
    status: "Suspended",
    avatar: "",
    package: "20 Mbps Standard",
    monthlyBill: "1,200 BDT",
    nextDue: "2026-03-15",
    ip: "10.0.0.88",
    pppoeUser: "nasrin_sultana",
    pppoePwd: "n@sr1n",
    mac: "77:88:99:DD:EE:FF",
  },
  "5": {
    id: "5",
    name: "Tanvir Ahmed",
    phone: "01512-555666",
    address: "78 Station Road, Sylhet",
    status: "Suspended",
    avatar: "",
    package: "10 Mbps Home",
    monthlyBill: "800 BDT",
    nextDue: "2026-03-20",
    ip: "10.0.0.103",
    pppoeUser: "tanvir_ahmed",
    pppoePwd: "t@nv1r",
    mac: "CC:DD:EE:11:22:33",
  },
}

interface Payment {
  date: string
  amount: string
  method: string
  status: "Paid" | "Pending"
}

const mockPayments: Record<string, Payment[]> = {
  "1": [
    { date: "2026-03-01", amount: "1,200 BDT", method: "bKash", status: "Paid" },
    { date: "2026-02-01", amount: "1,200 BDT", method: "Cash", status: "Paid" },
    { date: "2026-01-02", amount: "1,200 BDT", method: "bKash", status: "Paid" },
  ],
  "2": [
    { date: "2026-03-05", amount: "800 BDT", method: "Cash", status: "Paid" },
    { date: "2026-02-03", amount: "800 BDT", method: "Bank", status: "Paid" },
  ],
  "3": [
    { date: "2026-03-10", amount: "2,000 BDT", method: "Bank", status: "Paid" },
    { date: "2026-02-08", amount: "2,000 BDT", method: "bKash", status: "Paid" },
  ],
  "4": [
    { date: "2026-03-15", amount: "1,200 BDT", method: "Cash", status: "Pending" },
    { date: "2026-02-14", amount: "1,200 BDT", method: "Cash", status: "Paid" },
  ],
  "5": [
    { date: "2026-03-20", amount: "800 BDT", method: "bKash", status: "Pending" },
  ],
}

/* ── Status Badge ── */

function StatusBadge({ status }: { status: UserProfile["status"] }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "shadow-none",
        status === "Online" &&
          "border-emerald-300 bg-emerald-500/10 text-emerald-600",
        status === "Offline" &&
          "border-slate-300 bg-slate-500/10 text-slate-500",
        status === "Suspended" &&
          "border-red-300 bg-red-500/10 text-red-600"
      )}
    >
      {status}
    </Badge>
  )
}

/* ── Page ── */

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const user = mockUsers[id] ?? mockUsers["1"]
  const payments = mockPayments[id] ?? mockPayments["1"]

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")

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
            <Avatar className="h-16 w-16 text-lg">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight">
                  {user.name}
                </h1>
                <StatusBadge status={user.status} />
              </div>
              <p className="text-sm text-muted-foreground">{user.phone}</p>
              <p className="text-xs text-muted-foreground">{user.address}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm">
              <Edit className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
              <WifiOff className="mr-1.5 h-3.5 w-3.5" />
              Disable Connection
            </Button>
            <Button size="sm">
              <CreditCard className="mr-1.5 h-3.5 w-3.5" />
              Add Payment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Tabs ── */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="billing">Billing History</TabsTrigger>
          <TabsTrigger value="network">Network Settings</TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-sm font-medium">
                  Current Package
                </CardDescription>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{user.package}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-sm font-medium">
                  Monthly Bill
                </CardDescription>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{user.monthlyBill}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-sm font-medium">
                  Next Due Date
                </CardDescription>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{user.nextDue}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-sm font-medium">
                  IP Address
                </CardDescription>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold font-mono">{user.ip}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Billing History Tab ── */}
        <TabsContent value="billing">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                All recorded payments for {user.name}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground">
                        {p.date}
                      </TableCell>
                      <TableCell className="font-medium">{p.amount}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "shadow-none",
                            p.method === "bKash" &&
                              "border-pink-300 bg-pink-500/10 text-pink-600",
                            p.method === "Cash" &&
                              "border-emerald-300 bg-emerald-500/10 text-emerald-600",
                            p.method === "Bank" &&
                              "border-blue-300 bg-blue-500/10 text-blue-600"
                          )}
                        >
                          {p.method}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={p.status === "Paid" ? "default" : "destructive"}
                          className={
                            p.status === "Paid"
                              ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 shadow-none"
                              : ""
                          }
                        >
                          {p.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Network Settings Tab ── */}
        <TabsContent value="network">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Network Configuration</CardTitle>
              <CardDescription>
                PPPoE credentials and MAC binding. Changes will be pushed to
                the router.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="grid gap-6 max-w-lg"
              >
                <div className="grid gap-2">
                  <Label htmlFor="pppoe-user">PPPoE Username</Label>
                  <Input id="pppoe-user" defaultValue={user.pppoeUser} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pppoe-pwd">PPPoE Password</Label>
                  <Input
                    id="pppoe-pwd"
                    type="password"
                    defaultValue={user.pppoePwd}
                  />
                </div>
                <Separator />
                <div className="grid gap-2">
                  <Label htmlFor="mac-addr">MAC Address Binding</Label>
                  <Input
                    id="mac-addr"
                    defaultValue={user.mac}
                    placeholder="e.g. AA:BB:CC:DD:EE:FF"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Bind this connection to a specific device MAC address.
                  </p>
                </div>
                <Button type="submit" className="w-fit">
                  <Wifi className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
