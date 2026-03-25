"use client"

import { useState } from "react"
import { Settings, Router, CreditCard } from "lucide-react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "General", id: "general", icon: Settings },
  { name: "Router Integration", id: "router", icon: Router },
  { name: "Billing Preferences", id: "billing", icon: CreditCard },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your portal configurations, networking rules, and billing
          preferences.
        </p>
      </div>
      <Separator />

      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="lg:w-1/5 overflow-x-auto">
          <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
            {navigation.map((item) => {
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                    isActive
                      ? "bg-muted hover:bg-muted"
                      : "text-muted-foreground hover:bg-transparent hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </button>
              )
            })}
          </nav>
        </aside>

        <div className="flex-1 lg:max-w-2xl">
          {activeTab === "general" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">General Support</h3>
                <p className="text-sm text-muted-foreground">
                  Update your system name, company address, and support
                  contact.
                </p>
              </div>
              <Separator />
              <Card>
                <CardHeader>
                  <CardTitle>System Properties</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => e.preventDefault()}
                    className="space-y-6"
                  >
                    <div className="grid gap-2">
                      <Label htmlFor="system-name">System Name</Label>
                      <Input
                        id="system-name"
                        defaultValue="Purrfect Billing"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="company-address">Company Address</Label>
                      <Input
                        id="company-address"
                        defaultValue="123 Internet Ave, Web City"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="support-phone">Support Phone Number</Label>
                      <Input
                        id="support-phone"
                        type="tel"
                        defaultValue="01712-320098"
                      />
                    </div>
                    <div className="flex justify-start">
                      <Button type="submit">Save Changes</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "router" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-destructive">
                  Router Integration
                </h3>
                <p className="text-sm text-muted-foreground">
                  Carefully configure the API connection to your MikroTik NAS.
                  Incorrect settings will break user provisioning.
                </p>
              </div>
              <Separator />
              <Card className="border-destructive/20">
                <CardHeader>
                  <CardTitle>MikroTik API Configuration</CardTitle>
                  <CardDescription>
                    Requires RouterOS API service enabled on the target router.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => e.preventDefault()}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="router-ip">MikroTik IP Address</Label>
                        <Input
                          id="router-ip"
                          placeholder="e.g. 192.168.88.1"
                          className="font-mono"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="api-port">API Port</Label>
                        <Input
                          id="api-port"
                          type="number"
                          defaultValue="8728"
                          className="font-mono"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="api-user">API Username</Label>
                      <Input id="api-user" placeholder="admin" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="api-password">API Password</Label>
                      <Input
                        id="api-password"
                        type="password"
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t">
                      <Button type="button" variant="secondary">
                        Test Connection
                      </Button>
                      <Button type="submit">Save Configuration</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "billing" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Billing Preferences</h3>
                <p className="text-sm text-muted-foreground">
                  Set default financial parameters and auto-suspension behavior.
                </p>
              </div>
              <Separator />
              <Card>
                <CardHeader>
                  <CardTitle>Policy & Currencies</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => e.preventDefault()}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Default Currency</Label>
                        <Select defaultValue="bdt">
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bdt">BDT (৳)</SelectItem>
                            <SelectItem value="usd">USD ($)</SelectItem>
                            <SelectItem value="eur">EUR (€)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="grace-period">
                          Grace Period (Days)
                        </Label>
                        <Input
                          id="grace-period"
                          type="number"
                          defaultValue="3"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Days after expiry before suspension.
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="grid gap-2">
                      <Label htmlFor="bkash">bKash Merchant Number</Label>
                      <Input
                        id="bkash"
                        placeholder="e.g. 01712-000000"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="nagad">Nagad Merchant Number</Label>
                      <Input
                        id="nagad"
                        placeholder="e.g. 01912-000000"
                      />
                    </div>
                    <div className="flex justify-start">
                      <Button type="submit">Save Preferences</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
