"use client"

import { useState } from "react"
import Link from "next/link"
import {
  MoreHorizontal,
  Briefcase,
  Wallet,
  Users as UsersIcon,
  Plus,
  Banknote,
  UserSearch
} from "lucide-react"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

/* ── Mock Data ── */

interface AgentData {
  id: string
  name: string
  zone: string
  users: number
  balance: number
  status: "Active" | "Inactive"
}

const mockAgents: AgentData[] = [
  {
    id: "AGT-001",
    name: "Tariqul Islam",
    zone: "Mirpur-10",
    users: 245,
    balance: 15400,
    status: "Active",
  },
  {
    id: "AGT-002",
    name: "Sonia Begum",
    zone: "Uttara Sector 4",
    users: 112,
    balance: 8500,
    status: "Active",
  },
  {
    id: "AGT-003",
    name: "Mohammad Ali",
    zone: "Dhanmondi",
    users: 480,
    balance: 24000,
    status: "Active",
  },
  {
    id: "AGT-004",
    name: "Rezaul Karim",
    zone: "Gulshan-1",
    users: 85,
    balance: -500,
    status: "Inactive",
  },
  {
    id: "AGT-005",
    name: "Shirin Akhter",
    zone: "Banani",
    users: 320,
    balance: 12100,
    status: "Active",
  },
]

export default function AgentsPage() {
  const [registerOpen, setRegisterOpen] = useState(false)
  const [rechargeAgent, setRechargeAgent] = useState<AgentData | null>(null)

  // Calcs for Overview
  const totalActive = mockAgents.filter(a => a.status === "Active").length
  const totalBalance = mockAgents.reduce((sum, a) => sum + a.balance, 0)
  const totalManagedUsers = mockAgents.reduce((sum, a) => sum + a.users, 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agents & Resellers</h1>
          <p className="text-muted-foreground text-sm">
            Manage your reseller network, their wallets, and user allocations.
          </p>
        </div>
        
        <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            Register Agent
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Register New Agent</DialogTitle>
              <DialogDescription>
                Add a new reseller to your network.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setRegisterOpen(false)
              }}
              className="grid gap-4 py-4"
            >
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="e.g. Abdul Karim" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" placeholder="01XXX-XXXXXX" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nid">National ID (NID)</Label>
                <Input id="nid" placeholder="10-digit or 13-digit NID" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="zone">Assigned Zone</Label>
                  <Input id="zone" placeholder="e.g. Mirpur-10" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="balance">Starting Balance (BDT)</Label>
                  <Input id="balance" type="number" defaultValue="0" />
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button type="submit" className="w-full">Create Agent</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Overview Cards ── */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Active Agents</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActive}</div>
            <p className="text-xs text-muted-foreground">Out of {mockAgents.length} registered</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agent Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBalance.toLocaleString()} BDT</div>
            <p className="text-xs text-muted-foreground">Held across all agent wallets</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Managed Users</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalManagedUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total users under resellers</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Agent Ledger Table ── */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Ledger</CardTitle>
          <CardDescription>
            Detailed list of resellers, their zones, and current wallet balances.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent Name</TableHead>
                <TableHead>Zone / Area</TableHead>
                <TableHead className="text-right">Assigned Users</TableHead>
                <TableHead className="text-right">Wallet Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAgents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium">{agent.name}</TableCell>
                  <TableCell>{agent.zone}</TableCell>
                  <TableCell className="text-right">{agent.users}</TableCell>
                  <TableCell className={cn(
                    "text-right font-mono",
                    agent.balance < 0 ? "text-destructive font-medium" : "text-emerald-600 font-medium"
                  )}>
                    {agent.balance.toLocaleString()} ৳
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={agent.status === "Active" ? "default" : "secondary"}
                      className={
                        agent.status === "Active"
                          ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 shadow-none"
                          : ""
                      }
                    >
                      {agent.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setRechargeAgent(agent)}>
                          <Banknote className="mr-2 h-4 w-4" />
                          Recharge Wallet
                        </DropdownMenuItem>
                        <DropdownMenuItem render={<Link href={`/users?agent=${agent.id}`} />}>
                          <UserSearch className="mr-2 h-4 w-4" />
                          View Assigned Users
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Global Recharge Dialog ── */}
      <Dialog 
        open={rechargeAgent !== null} 
        onOpenChange={(isOpen) => {
          if (!isOpen) setRechargeAgent(null)
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Recharge Wallet</DialogTitle>
            <DialogDescription>
              Add funds to {rechargeAgent?.name}&apos;s wallet.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setRechargeAgent(null)
            }}
            className="grid gap-4 py-4"
          >
            <div className="grid gap-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Current Balance:</span>
                <span className="font-medium">{rechargeAgent?.balance.toLocaleString()} ৳</span>
              </div>
              <Label htmlFor="amount">Recharge Amount (BDT)</Label>
              <Input id="amount" type="number" placeholder="e.g. 5000" autoFocus />
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setRechargeAgent(null)}>
                Cancel
              </Button>
              <Button type="submit">Add Funds</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
