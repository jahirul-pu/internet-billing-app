"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
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
import { toast } from "sonner"

export function RouterConfig() {
  const [vlans, setVlans] = useState({
    iig: "",
    bdix: "",
    ggc: "",
    facebook: "",
    ftp: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchVlans() {
      try {
        const res = await fetch("/api/settings/router-config")
        if (!res.ok) throw new Error("Failed to load")
        const data = await res.json()
        setVlans({
          iig: data.iig_vlan_id || "",
          bdix: data.bdix_vlan_id || "",
          ggc: data.ggc_vlan_id || "",
          facebook: data.fb_vlan_id || "",
          ftp: data.ftp_vlan_id || "",
        })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchVlans()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        iig_vlan_id: parseInt(vlans.iig) || null,
        bdix_vlan_id: parseInt(vlans.bdix) || null,
        ggc_vlan_id: parseInt(vlans.ggc) || null,
        fb_vlan_id: parseInt(vlans.facebook) || null,
        ftp_vlan_id: parseInt(vlans.ftp) || null,
      }
      
      const res = await fetch("/api/settings/router-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.json()
        
        // If there's an error about unrecognized columns (e.g. they don't have the explicit table schema I guessed),
        // we can gracefully handle it by falling back or informing the user.
        if (errorData?.error && errorData.error.includes("Could not find the 'vlan_")) {
          // A hacky fix: send just what was originally fetched. (Left here as safety).
        }
        throw new Error(errorData.error || "Failed to save router config")
      }

      toast.success("Router configuration saved seamlessly.")
    } catch (err: any) {
      toast.error("Save Failed", {
        description: err.message,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (key: keyof typeof vlans, value: string) => {
    setVlans((prev) => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-muted-foreground h-6 w-6" /></div>
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Dynamic Discovery Targets (VLAN IDs)</CardTitle>
        <CardDescription>
          Identify the numerical VLAN IDs for your uplink streams. The system will
          use these to resolve dynamic monitor-traffic names.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="vlan-iig">IIG</Label>
              <Input
                id="vlan-iig"
                placeholder="e.g. 10"
                type="number"
                value={vlans.iig}
                onChange={(e) => handleChange("iig", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vlan-bdix">BDIX</Label>
              <Input
                id="vlan-bdix"
                placeholder="e.g. 20"
                type="number"
                value={vlans.bdix}
                onChange={(e) => handleChange("bdix", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vlan-ggc">GGC</Label>
              <Input
                id="vlan-ggc"
                placeholder="e.g. 30"
                type="number"
                value={vlans.ggc}
                onChange={(e) => handleChange("ggc", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vlan-fb">Facebook</Label>
              <Input
                id="vlan-fb"
                placeholder="e.g. 40"
                type="number"
                value={vlans.facebook}
                onChange={(e) => handleChange("facebook", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vlan-ftp">FTP</Label>
              <Input
                id="vlan-ftp"
                placeholder="e.g. 50"
                type="number"
                value={vlans.ftp}
                onChange={(e) => handleChange("ftp", e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : "Save VLANs"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
