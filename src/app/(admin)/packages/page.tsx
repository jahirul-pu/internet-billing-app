"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Loader2, RefreshCw, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface Package {
  id: string
  name: string
  price: number
  mikrotik_profile: string
  speed_raw_iig: number
  speed_ggc: number
  speed_fb: number
  speed_bdix: number
  address_list: string
}

export default function PackagesPage() {
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<Package | null>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Fetch packages from Supabase ──
  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/packages")
      if (!res.ok) throw new Error("Failed to fetch packages")
      const data = await res.json()
      setPackages(data)
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch packages")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPackages()
  }, [fetchPackages])

  // ── Create a new package ──
  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)

    const form = e.currentTarget
    const formData = new FormData(form)

    const payload = {
      name: formData.get("name") as string,
      price: Number(formData.get("price")),
      mikrotik_profile: formData.get("mikrotik_profile") as string,
      speed_raw_iig: Number(formData.get("speed_raw_iig")),
      speed_ggc: Number(formData.get("speed_ggc")),
      speed_fb: Number(formData.get("speed_fb")),
      speed_bdix: Number(formData.get("speed_bdix")),
    }

    try {
      const res = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create package")
      }

      setOpen(false)
      form.reset()
      toast.success("Package synced to router and database successfully.")
      await fetchPackages() // Refresh the table
    } catch (err: any) {
      toast.error(err.message || "An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  // ── Edit package ──
  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editingPackage) return
    setSubmitting(true)

    const form = e.currentTarget
    const formData = new FormData(form)

    const payload = {
      speed_raw_iig: Number(formData.get("speed_raw_iig")),
      speed_ggc: Number(formData.get("speed_ggc")),
      speed_fb: Number(formData.get("speed_fb")),
      speed_bdix: Number(formData.get("speed_bdix")),
      price: Number(formData.get("price")),
      address_list: formData.get("address_list") as string
    }

    try {
      const res = await fetch(`/api/packages/${editingPackage.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to update package")
      }

      setEditOpen(false)
      setEditingPackage(null)
      toast.success("Package updated successfully.")
      await fetchPackages() // Refresh the table
    } catch (err: any) {
      toast.error(err.message || "An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Packages</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={syncing}
            onClick={async () => {
              setSyncing(true)
              setError(null)
              try {
                const res = await fetch("/api/mikrotik/sync-packages", { method: "POST" })
                let data;
                try {
                   data = await res.json()
                } catch {
                   throw new Error("Server returned an invalid response (HTML/Text). Please check backend logs.")
                }

                if (!res.ok) {
                   const errorMsg = typeof data.error === 'object' ? data.error.message || JSON.stringify(data.error) : data.error
                   throw new Error(errorMsg || "Sync failed")
                }

                toast.success("Sync Complete", {
                   description: data.message || "Profiles synced successfully.",
                   duration: 5000
                })
                await fetchPackages()
              } catch (err: any) {
                console.error('Sync Error:', err)
                toast.error("Sync Failed", {
                   description: err.message || "Failed to sync packages from router.",
                   duration: 8000
                })
              } finally {
                setSyncing(false)
              }
            }}
          >
            {syncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {syncing ? "Syncing..." : "Sync from MikroTik"}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create New Package
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Package</DialogTitle>
              <DialogDescription>
                Define a new internet plan. This will also create a matching MikroTik profile.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="pkg-name">Package Name</Label>
                <Input id="pkg-name" name="name" placeholder="e.g. 30 Mbps Standard" required />
              </div>
              <Card className="border-border/60 shadow-none -mx-2 px-2 py-4 bg-muted/20">
                <CardHeader className="p-0 mb-4 px-2">
                  <CardTitle className="text-sm font-medium">Bandwidth Split Configuration</CardTitle>
                </CardHeader>
                <CardContent className="p-0 grid grid-cols-2 gap-4 px-2">
                  <div className="grid gap-2">
                    <Label htmlFor="speed-raw-iig">Raw Internet (Mbps)</Label>
                    <Input id="speed-raw-iig" name="speed_raw_iig" type="number" placeholder="e.g. 10" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="speed-ggc">YouTube/GGC (Mbps)</Label>
                    <Input id="speed-ggc" name="speed_ggc" type="number" placeholder="e.g. 40" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="speed-fb">Facebook/Meta (Mbps)</Label>
                    <Input id="speed-fb" name="speed_fb" type="number" placeholder="e.g. 40" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="speed-bdix">BDIX / Local (Mbps)</Label>
                    <Input id="speed-bdix" name="speed_bdix" type="number" placeholder="e.g. 100" required />
                  </div>
                </CardContent>
              </Card>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Monthly Price (BDT)</Label>
                  <Input id="price" name="price" type="number" placeholder="e.g. 1500" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mikrotik-profile">MikroTik Profile</Label>
                  <Input id="mikrotik-profile" name="mikrotik_profile" placeholder="e.g. std-30m" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {submitting ? "Saving..." : "Save Package"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
          </Dialog>

          {/* ── Edit Package Dialog ── */}
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Package: {editingPackage?.name}</DialogTitle>
              <DialogDescription>
                Manually enrich profile data. These values are NOT overwritten during MikroTik sync.
              </DialogDescription>
            </DialogHeader>
            <form key={editingPackage?.id || 'empty_form'} onSubmit={handleEdit} className="grid gap-4">
              <Card className="border-border/60 shadow-none -mx-2 px-2 py-4 bg-muted/20">
                <CardHeader className="p-0 mb-4 px-2">
                  <CardTitle className="text-sm font-medium">Speeds (Mbps)</CardTitle>
                </CardHeader>
                <CardContent className="p-0 grid grid-cols-2 gap-4 px-2">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-speed-raw-iig">Raw IIG</Label>
                    <Input id="edit-speed-raw-iig" name="speed_raw_iig" type="number" defaultValue={editingPackage?.speed_raw_iig} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-speed-ggc">GGC</Label>
                    <Input id="edit-speed-ggc" name="speed_ggc" type="number" defaultValue={editingPackage?.speed_ggc} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-speed-fb">Facebook</Label>
                    <Input id="edit-speed-fb" name="speed_fb" type="number" defaultValue={editingPackage?.speed_fb} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-speed-bdix">BDIX</Label>
                    <Input id="edit-speed-bdix" name="speed_bdix" type="number" defaultValue={editingPackage?.speed_bdix} required />
                  </div>
                </CardContent>
              </Card>
              <div className="grid gap-2">
                <Label htmlFor="edit-address-list">Address List Name</Label>
                <Input id="edit-address-list" name="address_list" placeholder="e.g. 5mbps_customers" defaultValue={editingPackage?.address_list || ''} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-price">Monthly Price (BDT)</Label>
                <Input id="edit-price" name="price" type="number" defaultValue={editingPackage?.price} required />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {submitting ? "Updating..." : "Update Package"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Internet Plans</CardTitle>
          <CardDescription>
            All available packages and their MikroTik profile mappings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading packages...</span>
            </div>
          ) : packages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No packages found. Create your first internet plan above.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package Name</TableHead>
                  <TableHead>Raw (IIG)</TableHead>
                  <TableHead>GGC</TableHead>
                  <TableHead>Facebook</TableHead>
                  <TableHead>BDIX</TableHead>
                  <TableHead>Address List</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Profile</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">{pkg.name}</TableCell>
                    <TableCell className="font-mono text-xs">{pkg.speed_raw_iig}M</TableCell>
                    <TableCell className="font-mono text-xs">{pkg.speed_ggc}M</TableCell>
                    <TableCell className="font-mono text-xs">{pkg.speed_fb}M</TableCell>
                    <TableCell className="font-mono text-xs">{pkg.speed_bdix}M</TableCell>
                    <TableCell className="text-xs">{pkg.address_list || "—"}</TableCell>
                    <TableCell className="font-medium whitespace-nowrap">
                      {Number(pkg.price).toLocaleString()} ৳
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {pkg.mikrotik_profile}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingPackage(pkg)
                          setEditOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
