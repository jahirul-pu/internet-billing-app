"use client"

import { useState } from "react"
import { Database, AlertCircle, Download, RotateCcw, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

const devices = [
  { id: "1", name: "Main Mikrotik CCR", ip: "192.168.88.1", lastBackup: "2026-03-26 02:00 AM", size: "4.2 MB", status: "Success" },
  { id: "2", name: "Zone A OLT", ip: "10.0.1.5", lastBackup: "2026-03-26 02:05 AM", size: "1.1 MB", status: "Success" },
  { id: "3", name: "Zone B OLT", ip: "10.0.2.5", lastBackup: "2026-03-26 02:10 AM", size: "1.2 MB", status: "Success" },
  { id: "4", name: "Core Switch", ip: "10.0.0.2", lastBackup: "2026-03-25 02:00 AM", size: "0.5 MB", status: "Failed" },
]

const getMockHistory = () => {
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date("2026-03-26T02:00:00")
    d.setDate(d.getDate() - i)
    return {
      date: d.toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      size: (Math.random() * (4.5 - 4.0) + 4.0).toFixed(1) + " MB",
      status: i === 3 ? "Failed" : "Success",
      file: `backup_${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.rsc`
    }
  })
}

export function BackupsTab() {
  const [selectedDevice, setSelectedDevice] = useState<typeof devices[0] | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const [restoreVersion, setRestoreVersion] = useState<any>(null)
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false)
  const [confirmDeviceName, setConfirmDeviceName] = useState("")

  const failedBackupsCount = devices.filter(d => d.status === "Failed").length

  const handleRowClick = (device: typeof devices[0]) => {
    setSelectedDevice(device)
    setIsSheetOpen(true)
  }

  const handleRestoreClick = (version: any) => {
    setRestoreVersion(version)
    setConfirmDeviceName("")
    setIsRestoreDialogOpen(true)
  }

  const handleConfirmRestore = () => {
    if (confirmDeviceName === selectedDevice?.name) {
      console.log("Restoring", selectedDevice?.name, "to version", restoreVersion.file)
      setIsRestoreDialogOpen(false)
      setRestoreVersion(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Infrastructure Backups</h3>
        <p className="text-sm text-muted-foreground">
          Manage daily automated configuration backups for your core routers and OLTs.
        </p>
      </div>
      <Separator />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Devices Backed Up
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Last Global Backup Time
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Today, 02:00 AM</div>
          </CardContent>
        </Card>
        <Card className={failedBackupsCount > 0 ? "border-red-500/50 bg-red-500/10 dark:bg-red-950/20" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${failedBackupsCount > 0 ? "text-red-600 dark:text-red-400" : ""}`}>
              Failed Backups
            </CardTitle>
            <AlertCircle className={`h-4 w-4 ${failedBackupsCount > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${failedBackupsCount > 0 ? "text-red-700 dark:text-red-400" : ""}`}>
              {failedBackupsCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight">The Vault - Device Backups</h3>
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device Name</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Latest Backup Date</TableHead>
                <TableHead>Backup File Size</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((device) => (
                <TableRow 
                  key={device.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(device)}
                >
                  <TableCell className="font-medium">{device.name}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{device.ip}</TableCell>
                  <TableCell>{device.lastBackup}</TableCell>
                  <TableCell>{device.size}</TableCell>
                  <TableCell>
                    <Badge variant={device.status === "Success" ? "default" : "destructive"}
                      className={device.status === "Success" ? "bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white" : ""}
                    >
                      {device.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Version Control: {selectedDevice?.name}</SheetTitle>
            <SheetDescription>
              Viewing the last 7 days of backup files for {selectedDevice?.ip}.
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-8 space-y-6">
            {getMockHistory().map((history, idx) => (
              <div key={idx} className="flex flex-col space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{history.date}</div>
                  <Badge variant={history.status === "Success" ? "outline" : "destructive"}
                      className={history.status === "Success" ? "border-green-500 text-green-600 dark:text-green-400" : ""}
                  >
                    {history.status}
                  </Badge>
                </div>
                <div className="text-sm font-mono text-muted-foreground flex items-center justify-between">
                  <span>{history.file}</span>
                  <span>{history.size}</span>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Button variant="outline" size="sm" className="w-full flex items-center gap-2" disabled={history.status === "Failed"}>
                    <Download className="h-4 w-4" /> Download .rsc
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="w-full flex items-center gap-2"
                    disabled={history.status === "Failed"}
                    onClick={() => handleRestoreClick(history)}
                  >
                    <RotateCcw className="h-4 w-4" /> Restore This Version
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-500">Critical Action: Restore Version</DialogTitle>
            <DialogDescription>
              This will overwrite the current configuration on <strong>{selectedDevice?.name}</strong> with the backup from {restoreVersion?.date}.
              This action could cause network interruptions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-4 space-y-4">
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20">
              <p className="font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> Warning
              </p>
              <p className="mt-1">
                Please type the device name <strong>{selectedDevice?.name}</strong> exactly as shown to confirm.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="device-name-confirm">Confirm Device Name</Label>
              <Input 
                id="device-name-confirm"
                value={confirmDeviceName}
                onChange={(e) => setConfirmDeviceName(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestoreDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmRestore}
              disabled={confirmDeviceName !== selectedDevice?.name}
            >
              Confirm Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
