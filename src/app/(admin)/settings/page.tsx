"use client"

import { useState, useEffect } from "react"
import { Settings, Router, CreditCard, HardDrive, Loader2 } from "lucide-react"
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
import { BackupsTab } from "./components/backups-tab"
import { RouterConfig } from "./components/router-config"
import { toast } from "sonner"

const navigation = [
  { name: "General", id: "general", icon: Settings },
  { name: "Router Integration", id: "router", icon: Router },
  { name: "Infrastructure Backups", id: "backups", icon: HardDrive },
  { name: "Billing Preferences", id: "billing", icon: CreditCard },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general")

  // Router integration state
  const [routerIp, setRouterIp] = useState("")
  const [apiPort, setApiPort] = useState("9394")
  const [apiUser, setApiUser] = useState("")
  const [apiPassword, setApiPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  // Load settings from Supabase on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings")
        if (!res.ok) return
        const data = await res.json()
        if (data.mikrotik_ip) setRouterIp(data.mikrotik_ip)
        if (data.mikrotik_api_port) setApiPort(String(data.mikrotik_api_port))
        if (data.mikrotik_api_user) setApiUser(data.mikrotik_api_user)
        if (data.mikrotik_api_password) setApiPassword(data.mikrotik_api_password)
      } catch {
        // Silently fail on first load
      }
    }
    loadSettings()
  }, [])

  // Save router credentials
  async function handleSaveRouter(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mikrotik_ip: routerIp,
          mikrotik_api_port: parseInt(apiPort) || 9394,
          mikrotik_api_user: apiUser,
          mikrotik_api_password: apiPassword,
        }),
      })
      
      let data;
      try {
        data = await res.json()
      } catch {
        throw new Error("Server returned an invalid response (HTML/Text). Please check backend logs.")
      }

      if (!res.ok) {
        const errorMsg = typeof data.error === 'object' ? data.error.message || JSON.stringify(data.error) : data.error
        throw new Error(errorMsg || "Failed to save configuration.")
      }

      toast.success("Router configuration saved successfully.")
    } catch (err: any) {
      console.error('Save Settings Error:', err)
      toast.error("Save Failed", {
        description: err.message || "Unknown error occurred.",
        duration: 5000,
      })
    } finally {
      setSaving(false)
    }
  }

  // Test MikroTik connection
  async function handleTestConnection(e: React.MouseEvent) {
    e.preventDefault()
    setTesting(true)
    try {
      const res = await fetch("/api/mikrotik/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: routerIp,
          port: apiPort,
          user: apiUser,
          password: apiPassword,
        }),
      })

      let data;
      try {
        data = await res.json()
      } catch {
        throw new Error("Server returned an invalid response (HTML/Text). Please check backend logs.")
      }

      if (!res.ok) {
        const errorMsg = typeof data.error === 'object' ? data.error.message || JSON.stringify(data.error) : data.error
        throw new Error(errorMsg || "Connection Failed")
      }

      toast.success("MikroTik Connection Successful!", {
        description: `Uptime: ${data.uptime} · CPU Load: ${data.cpu_load}% · ${data.board_name} (ROS ${data.version})`,
        duration: 5000,
      })
    } catch (err: any) {
      console.error('Test Connection Error:', err)
      toast.error("MikroTik Connection Failed", {
        description: err.message || "Unknown error occurred.",
        duration: 8000,
      })
    } finally {
      setTesting(false)
    }
  }

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
                  <form onSubmit={handleSaveRouter} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="router-ip">MikroTik IP Address</Label>
                        <Input
                          id="router-ip"
                          placeholder="e.g. 192.168.88.1"
                          className="font-mono"
                          value={routerIp}
                          onChange={(e) => setRouterIp(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="api-port">API Port</Label>
                        <Input
                          id="api-port"
                          type="number"
                          className="font-mono"
                          value={apiPort}
                          onChange={(e) => setApiPort(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="api-user">API Username</Label>
                      <Input
                        id="api-user"
                        placeholder="admin"
                        value={apiUser}
                        onChange={(e) => setApiUser(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="api-password">API Password</Label>
                      <Input
                        id="api-password"
                        type="password"
                        placeholder="••••••••"
                        value={apiPassword}
                        onChange={(e) => setApiPassword(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t">
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={testing}
                        onClick={(e) => handleTestConnection(e)}
                      >
                        {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {testing ? "Testing..." : "Test Connection"}
                      </Button>
                      <Button type="submit" disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {saving ? "Saving..." : "Save Configuration"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Dynamic Discovery Targets */}
              <RouterConfig />
            </div>
          )}

          {activeTab === "backups" && (
            <BackupsTab />
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
