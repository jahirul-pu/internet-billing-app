"use client"

import { useState } from "react"
import { Gift, Plus, Trophy, Zap, Coins, Receipt, Network } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

const topUsers = [
  { id: 1, name: "Ali Hossain", phone: "01712-320001", points: 4500 },
  { id: 2, name: "Maria Karim", phone: "01912-320002", points: 4200 },
  { id: 3, name: "Rafiq Ahmed", phone: "01812-320003", points: 3950 },
  { id: 4, name: "Tania Sultana", phone: "01612-320004", points: 3800 },
  { id: 5, name: "Kamrul Islam", phone: "01512-320005", points: 3500 },
  { id: 6, name: "Salma Begum", phone: "01712-320006", points: 3250 },
  { id: 7, name: "Faisal Rahman", phone: "01912-320007", points: 3100 },
  { id: 8, name: "Nusrat Jahan", phone: "01812-320008", points: 2900 },
  { id: 9, name: "Hasan Mahmud", phone: "01612-320009", points: 2750 },
  { id: 10, name: "Sadia Afrin", phone: "01512-320010", points: 2600 },
]

export default function LoyaltyRewardsPage() {
  const [isStoreDialogOpen, setIsStoreDialogOpen] = useState(false)

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Loyalty & Rewards</h2>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 space-y-6">
          {/* Campaign Manager */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-indigo-500" />
                Campaign Manager
              </CardTitle>
              <CardDescription>
                Create new ways for users to earn loyalty points through positive actions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4 md:grid-cols-[1fr_150px_auto] items-end" onSubmit={(e) => e.preventDefault()}>
                <div className="grid gap-2">
                  <Label htmlFor="action-name">Action Name</Label>
                  <Input id="action-name" placeholder="e.g., Pay 3 Days Early" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="points">Points Awarded</Label>
                  <Input id="points" type="number" placeholder="50" />
                </div>
                <div className="flex items-center gap-4 h-10 pb-1">
                  <div className="flex items-center gap-2">
                    <Switch id="enable-campaign" defaultChecked />
                    <Label htmlFor="enable-campaign">Enable</Label>
                  </div>
                  <Button type="button">Create Campaign</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Reward Store */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">The Reward Store</h3>
                <p className="text-sm text-muted-foreground">Define what users can buy with their points inside the app.</p>
              </div>
              <Dialog open={isStoreDialogOpen} onOpenChange={setIsStoreDialogOpen}>
                <DialogTrigger className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                  <Plus className="h-4 w-4 mr-2" /> Add New Reward
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Configure New Reward</DialogTitle>
                    <DialogDescription>
                      Set up a new item for the Reward Store and link it to an automated API action.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="reward-name">Reward Name</Label>
                      <Input id="reward-name" placeholder="e.g. Free Router Reboot" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="reward-cost">Point Cost</Label>
                      <Input id="reward-cost" type="number" placeholder="100" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="api-action">Automated API Action</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an action to trigger" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="speed_boost">Apply Temporary Speed Boost</SelectItem>
                          <SelectItem value="bill_discount">Apply Next Bill Discount</SelectItem>
                          <SelectItem value="router_reboot">Send Reboot Command to Router</SelectItem>
                          <SelectItem value="data_addon">Add 10GB Data Pack</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsStoreDialogOpen(false)}>Cancel</Button>
                    <Button onClick={() => setIsStoreDialogOpen(false)}>Save Reward</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Zap className="h-5 w-5 text-amber-500 mb-2" />
                    <Badge variant="outline" className="border-indigo-500 text-indigo-500">Active</Badge>
                  </div>
                  <CardTitle className="text-base">24-Hour 50Mbps Boost</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="flex items-center gap-2 mt-2 font-bold text-lg">
                    <Coins className="h-4 w-4 text-yellow-500" /> 500 Points
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 font-mono">
                    Action: apply_temp_speed_boost
                  </p>
                </CardContent>
              </Card>

              <Card className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Receipt className="h-5 w-5 text-green-500 mb-2" />
                    <Badge variant="outline" className="border-indigo-500 text-indigo-500">Active</Badge>
                  </div>
                  <CardTitle className="text-base">50 BDT Bill Discount</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="flex items-center gap-2 mt-2 font-bold text-lg">
                    <Coins className="h-4 w-4 text-yellow-500" /> 1000 Points
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 font-mono">
                    Action: apply_bill_discount
                  </p>
                </CardContent>
              </Card>

              <Card className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Network className="h-5 w-5 text-blue-500 mb-2" />
                    <Badge variant="outline" className="border-indigo-500 text-indigo-500">Active</Badge>
                  </div>
                  <CardTitle className="text-base">Free Router Reboot</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="flex items-center gap-2 mt-2 font-bold text-lg">
                    <Coins className="h-4 w-4 text-yellow-500" /> 100 Points
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 font-mono">
                    Action: send_reboot_command
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* User Leaderboard Sidebar */}
        <Card className="w-full xl:w-[350px] shrink-0 h-fit border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <CardTitle>Top Point Earners</CardTitle>
            </div>
            <CardDescription>Highest accumulated loyalty points.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {topUsers.map((user, index) => (
                <div key={user.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      index === 0 ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400" :
                      index === 1 ? "bg-slate-300/20 text-slate-500 dark:text-slate-300" :
                      index === 2 ? "bg-amber-600/20 text-amber-700 dark:text-amber-500" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      #{index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{user.phone}</p>
                    </div>
                  </div>
                  <div className="font-bold text-sm">
                    {user.points.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">pts</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
