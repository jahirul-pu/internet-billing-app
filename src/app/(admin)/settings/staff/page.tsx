"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, Plus, ShieldOff, ShieldCheck, Mail, Lock, UserRound, ContactRound } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface StaffMember {
  id: string
  full_name: string
  email: string
  role: 'SUPER_ADMIN' | 'MANAGER' | 'COLLECTOR'
  status: 'active' | 'inactive'
  created_at: string
}

export default function StaffDirectoryPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formName, setFormName] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formPassword, setFormPassword] = useState("")
  const [formRole, setFormRole] = useState<'SUPER_ADMIN' | 'MANAGER' | 'COLLECTOR'>('MANAGER')

  const fetchStaff = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/staff-profiles")
      if (!res.ok) throw new Error("Failed to fetch staff")
      const json = await res.json()
      setStaff(json.data || [])
    } catch (err) {
      console.error("Error fetching staff:", err)
      toast.error("Failed to load the staff directory.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  const resetForm = () => {
    setFormName("")
    setFormEmail("")
    setFormPassword("")
    setFormRole("MANAGER")
  }

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName || !formEmail || !formPassword) return

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/staff-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          password: formPassword,
          role: formRole
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to add employee")
      }

      toast.success(`${formName} has been successfully added as ${formRole}.`)
      await fetchStaff()
      setRegisterOpen(false)
      resetForm()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleAccess = async (member: StaffMember) => {
    const newStatus = member.status === 'active' ? 'inactive' : 'active'
    
    try {
      const res = await fetch(`/api/staff-profiles/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to update status")
      }

      toast.success(`${member.full_name}'s access is now ${newStatus}.`)
      await fetchStaff()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch(role) {
      case 'SUPER_ADMIN': return 'destructive' // Red tone
      case 'MANAGER': return 'default' // Blue/indigo tone
      case 'COLLECTOR': return 'secondary' // Green tone
      default: return 'outline'
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground text-sm">
            Manage administrative access and define roles across the system.
          </p>
        </div>

        <Dialog open={registerOpen} onOpenChange={(open) => {
          setRegisterOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger render={<Button variant="default" />}>
            <Plus className="mr-2 h-4 w-4" />
            Add Staff
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription>
                Create a new staff account and assign an RBAC level.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddEmployee} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <UserRound className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="e.g. System Administrator"
                    className="pl-9"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email / Login ID</Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@isp.com"
                    className="pl-9"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Temporary Password</Label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimal 6 characters"
                    className="pl-9"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">System Role</Label>
                <Select value={formRole} onValueChange={(val: any) => setFormRole(val)}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPER_ADMIN">SUPER_ADMIN (Full Access)</SelectItem>
                    <SelectItem value="MANAGER">MANAGER (Dashboard & Billing)</SelectItem>
                    <SelectItem value="COLLECTOR">COLLECTOR (Mobile Field App only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="mt-4">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Staff Account
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ContactRound className="h-5 w-5 text-muted-foreground" />
            Registered Staff
          </CardTitle>
          <CardDescription>
            List of all users with access to administrative systems.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading staff directory…
            </div>
          ) : staff.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No staff members found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email / Login ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Access Control</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member) => (
                  <TableRow key={member.id} className={member.status === 'inactive' ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">{member.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{member.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`shadow-none text-xs font-semibold ${
                        member.role === 'SUPER_ADMIN' ? 'bg-red-500/10 text-red-600 border-red-200' :
                        member.role === 'MANAGER' ? 'bg-blue-500/10 text-blue-600 border-blue-200' :
                        'bg-emerald-500/10 text-emerald-600 border-emerald-200'
                      }`}>
                        {member.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.status === 'active' ? 'default' : 'secondary'} className={
                        member.status === 'active' ? 'bg-emerald-500/15 text-emerald-600 shadow-none' : ''
                      }>
                        {member.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={member.status === 'active' ? "outline" : "secondary"}
                        size="sm"
                        className={member.status === 'active' ? "text-destructive border-destructive/20 hover:bg-destructive/10" : "text-emerald-600"}
                        onClick={() => handleToggleAccess(member)}
                      >
                        {member.status === 'active' ? (
                          <><ShieldOff className="mr-2 h-3 w-3" /> Revoke Access</>
                        ) : (
                          <><ShieldCheck className="mr-2 h-3 w-3" /> Restore Access</>
                        )}
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
