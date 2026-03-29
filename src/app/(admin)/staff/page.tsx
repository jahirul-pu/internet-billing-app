"use client"

import { useState, useEffect, useCallback } from "react"
import { MoreHorizontal, Plus, ContactRound, Phone, MapPin, Loader2, UserRound, Pencil, ShieldOff, ShieldCheck, Trash2, AlertTriangle } from "lucide-react"
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

/* ── Types ── */

interface StaffMember {
  id: string
  name: string
  roles: string[]
  phone: string
  zone: string
  status: "Active" | "Inactive"
  created_at?: string
  updated_at?: string
}

const roleColors: Record<string, string> = {
  Admin: "border-indigo-400 bg-indigo-500/10 text-indigo-600",
  Technician: "border-sky-400 bg-sky-500/10 text-sky-600",
  Support: "border-amber-400 bg-amber-500/10 text-amber-600",
  "Billing Staff": "border-emerald-400 bg-emerald-500/10 text-emerald-600",
}

const ALL_ROLES = ["Admin", "Technician", "Support", "Billing Staff"]

export default function StaffDirectoryPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [registerOpen, setRegisterOpen] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  /* ── Add-form field state ── */
  const [formName, setFormName] = useState("")
  const [formPhone, setFormPhone] = useState("")
  const [formZone, setFormZone] = useState("")

  /* ── View Profile dialog ── */
  const [viewMember, setViewMember] = useState<StaffMember | null>(null)

  /* ── Edit dialog ── */
  const [editMember, setEditMember] = useState<StaffMember | null>(null)
  const [editName, setEditName] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editZone, setEditZone] = useState("")
  const [editRoles, setEditRoles] = useState<string[]>([])

  /* ── Confirmation dialogs ── */
  const [confirmDeactivate, setConfirmDeactivate] = useState<StaffMember | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<StaffMember | null>(null)
  const [isActionLoading, setIsActionLoading] = useState(false)

  const totalActive = staff.filter((s) => s.status === "Active").length

  /* ── Fetch staff on mount ── */
  const fetchStaff = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/staff")
      if (!res.ok) throw new Error("Failed to fetch staff")
      const json = await res.json()
      setStaff(json.data || [])
    } catch (err) {
      console.error("Error fetching staff:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  /* ── Reset add-form ── */
  const resetForm = () => {
    setFormName("")
    setFormPhone("")
    setFormZone("")
    setSelectedRoles([])
  }

  /* ── Handle add employee ── */
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formPhone.trim()) return

    try {
      setIsSubmitting(true)
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          phone: formPhone.trim(),
          roles: selectedRoles,
          zone: formZone.trim() || "Unassigned",
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to add employee")
      }

      await fetchStaff()
      setRegisterOpen(false)
      resetForm()
    } catch (err: any) {
      console.error("Error adding employee:", err)
      alert(err.message || "Failed to add employee")
    } finally {
      setIsSubmitting(false)
    }
  }

  /* ── Handle confirmed toggle status ── */
  const executeToggleStatus = async () => {
    if (!confirmDeactivate) return
    const newStatus = confirmDeactivate.status === "Active" ? "Inactive" : "Active"

    try {
      setIsActionLoading(true)
      const res = await fetch(`/api/staff/${confirmDeactivate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to update status")
      }

      await fetchStaff()
      setConfirmDeactivate(null)
    } catch (err: any) {
      console.error("Error toggling status:", err)
      alert(err.message || "Failed to update status")
    } finally {
      setIsActionLoading(false)
    }
  }

  /* ── Handle confirmed delete ── */
  const executeDelete = async () => {
    if (!confirmDelete) return

    try {
      setIsActionLoading(true)
      const res = await fetch(`/api/staff/${confirmDelete.id}`, { method: "DELETE" })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to delete employee")
      }

      await fetchStaff()
      setConfirmDelete(null)
    } catch (err: any) {
      console.error("Error deleting employee:", err)
      alert(err.message || "Failed to delete employee")
    } finally {
      setIsActionLoading(false)
    }
  }

  /* ── Open edit dialog ── */
  const openEdit = (member: StaffMember) => {
    setEditMember(member)
    setEditName(member.name)
    setEditPhone(member.phone)
    setEditZone(member.zone)
    setEditRoles(member.roles || [])
  }

  /* ── Handle save edit ── */
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editMember || !editName.trim() || !editPhone.trim()) return

    try {
      setIsSubmitting(true)
      const res = await fetch(`/api/staff/${editMember.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          phone: editPhone.trim(),
          roles: editRoles,
          zone: editZone.trim() || "Unassigned",
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to update employee")
      }

      await fetchStaff()
      setEditMember(null)
    } catch (err: any) {
      console.error("Error updating employee:", err)
      alert(err.message || "Failed to update employee")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff Directory</h1>
          <p className="text-muted-foreground text-sm">
            Manage your in-house salaried employees and their zone assignments.
          </p>
        </div>

        {/* ── Add Employee Dialog ── */}
        <Dialog open={registerOpen} onOpenChange={(open) => {
          setRegisterOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription>
                Register a new staff member into the system.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddEmployee} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Abdul Karim"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="01XXX-XXXXXX"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Roles</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {ALL_ROLES.map((r) => {
                      const isSelected = selectedRoles.includes(r)
                      return (
                        <Badge
                          key={r}
                          variant={isSelected ? "default" : "outline"}
                          className={cn(
                            "cursor-pointer transition-colors shadow-none font-medium",
                            isSelected ? "" : "text-muted-foreground hover:bg-muted"
                          )}
                          onClick={() => {
                            setSelectedRoles(prev =>
                              prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]
                            )
                          }}
                        >
                          {r}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="zone">Assigned Zone</Label>
                  <Input
                    id="zone"
                    placeholder="e.g. Mirpur-10"
                    value={formZone}
                    onChange={(e) => setFormZone(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Employee
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Overview Cards ── */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <ContactRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length}</div>
            <p className="text-xs text-muted-foreground">Registered employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active On Duty</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActive}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zones Covered</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(staff.map(s => s.zone)).size}</div>
            <p className="text-xs text-muted-foreground">Unique areas serviced</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Staff Table ── */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Roster</CardTitle>
          <CardDescription>
            Full list of in-house staff, their roles, and zone assignments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading staff…
            </div>
          ) : staff.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No employees found. Click &quot;Add Employee&quot; to register your first staff member.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Assigned Zone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member) => (
                  <TableRow key={member.id} className={member.status === "Inactive" ? "opacity-60" : ""}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {member.roles?.map(r => (
                          <Badge
                            key={r}
                            variant="outline"
                            className={cn("shadow-none text-[11px] px-2", roleColors[r] || "bg-muted")}
                          >
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{member.phone}</TableCell>
                    <TableCell>{member.zone}</TableCell>
                    <TableCell>
                      <Badge
                        variant={member.status === "Active" ? "default" : "secondary"}
                        className={
                          member.status === "Active"
                            ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 shadow-none"
                            : ""
                        }
                      >
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewMember(member)}>
                            <UserRound className="mr-2 h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(member)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setConfirmDeactivate(member)}>
                            {member.status === "Active" ? (
                              <><ShieldOff className="mr-2 h-4 w-4" /> Deactivate</>
                            ) : (
                              <><ShieldCheck className="mr-2 h-4 w-4" /> Activate</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setConfirmDelete(member)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove Permanently
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── View Profile Dialog ── */}
      <Dialog open={!!viewMember} onOpenChange={(open) => !open && setViewMember(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Employee Profile</DialogTitle>
            <DialogDescription>Full details for this staff member.</DialogDescription>
          </DialogHeader>
          {viewMember && (
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold">
                  {viewMember.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-lg font-semibold">{viewMember.name}</p>
                  <Badge
                    variant={viewMember.status === "Active" ? "default" : "secondary"}
                    className={
                      viewMember.status === "Active"
                        ? "bg-emerald-500/15 text-emerald-600 shadow-none"
                        : ""
                    }
                  >
                    {viewMember.status}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Phone</span>
                  <span className="font-mono text-sm font-medium">{viewMember.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Zone</span>
                  <span className="text-sm font-medium">{viewMember.zone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Roles</span>
                  <div className="flex flex-wrap gap-1">
                    {viewMember.roles?.map(r => (
                      <Badge
                        key={r}
                        variant="outline"
                        className={cn("shadow-none text-[11px] px-2", roleColors[r] || "bg-muted")}
                      >
                        {r}
                      </Badge>
                    ))}
                    {(!viewMember.roles || viewMember.roles.length === 0) && (
                      <span className="text-sm text-muted-foreground">None assigned</span>
                    )}
                  </div>
                </div>
                {viewMember.created_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Joined</span>
                    <span className="text-sm font-medium">
                      {new Date(viewMember.created_at).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric"
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="w-full" onClick={() => setViewMember(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Details Dialog ── */}
      <Dialog open={!!editMember} onOpenChange={(open) => {
        if (!open) setEditMember(null)
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>
              Update details for {editMember?.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Roles</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {ALL_ROLES.map((r) => {
                    const isSelected = editRoles.includes(r)
                    return (
                      <Badge
                        key={r}
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer transition-colors shadow-none font-medium",
                          isSelected ? "" : "text-muted-foreground hover:bg-muted"
                        )}
                        onClick={() => {
                          setEditRoles(prev =>
                            prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]
                          )
                        }}
                      >
                        {r}
                      </Badge>
                    )
                  })}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-zone">Assigned Zone</Label>
                <Input
                  id="edit-zone"
                  value={editZone}
                  onChange={(e) => setEditZone(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Confirm Deactivate/Activate Dialog ── */}
      <Dialog open={!!confirmDeactivate} onOpenChange={(open) => !open && setConfirmDeactivate(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <DialogTitle>
                {confirmDeactivate?.status === "Active" ? "Deactivate" : "Activate"} Employee
              </DialogTitle>
            </div>
            <DialogDescription>
              Are you sure you want to {confirmDeactivate?.status === "Active" ? "deactivate" : "activate"}{" "}
              <span className="font-semibold text-foreground">{confirmDeactivate?.name}</span>?
              {confirmDeactivate?.status === "Active"
                ? " They will be marked as inactive and removed from active duty."
                : " They will be restored to active duty."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmDeactivate(null)} disabled={isActionLoading}>
              Cancel
            </Button>
            <Button
              variant={confirmDeactivate?.status === "Active" ? "default" : "default"}
              className={confirmDeactivate?.status === "Active" ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"}
              onClick={executeToggleStatus}
              disabled={isActionLoading}
            >
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {confirmDeactivate?.status === "Active" ? "Deactivate" : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirm Delete Dialog ── */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <DialogTitle>Remove Employee</DialogTitle>
            </div>
            <DialogDescription>
              Are you sure you want to permanently remove{" "}
              <span className="font-semibold text-foreground">{confirmDelete?.name}</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmDelete(null)} disabled={isActionLoading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={executeDelete}
              disabled={isActionLoading}
            >
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
