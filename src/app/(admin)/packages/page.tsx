"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
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

interface PackageItem {
  id: number
  name: string
  speed: string
  price: string
  mikrotikProfile: string
}

const packages: PackageItem[] = [
  {
    id: 1,
    name: "5 Mbps Home",
    speed: "5M/5M",
    price: "500 BDT",
    mikrotikProfile: "home-5m",
  },
  {
    id: 2,
    name: "10 Mbps Home",
    speed: "10M/10M",
    price: "800 BDT",
    mikrotikProfile: "home-10m",
  },
  {
    id: 3,
    name: "20 Mbps Standard",
    speed: "20M/10M",
    price: "1,200 BDT",
    mikrotikProfile: "std-20m",
  },
  {
    id: 4,
    name: "50 Mbps Premium",
    speed: "50M/20M",
    price: "2,000 BDT",
    mikrotikProfile: "prem-50m",
  },
  {
    id: 5,
    name: "100 Mbps Business",
    speed: "100M/50M",
    price: "5,000 BDT",
    mikrotikProfile: "biz-100m",
  },
]

export default function PackagesPage() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Packages</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Package
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Package</DialogTitle>
              <DialogDescription>
                Define a new internet plan. This will also create a matching MikroTik profile.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setOpen(false)
              }}
              className="grid gap-4"
            >
              <div className="grid gap-2">
                <Label htmlFor="pkg-name">Package Name</Label>
                <Input id="pkg-name" placeholder="e.g. 30 Mbps Standard" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="download-speed">Download Speed</Label>
                  <Input id="download-speed" placeholder="e.g. 30M" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="upload-speed">Upload Speed</Label>
                  <Input id="upload-speed" placeholder="e.g. 15M" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Monthly Price (BDT)</Label>
                <Input id="price" type="number" placeholder="e.g. 1500" />
              </div>
              <DialogFooter showCloseButton>
                <Button type="submit">Save Package</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Internet Plans</CardTitle>
          <CardDescription>
            All available packages and their MikroTik profile mappings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package Name</TableHead>
                <TableHead>Speed Limit</TableHead>
                <TableHead>Monthly Price</TableHead>
                <TableHead>MikroTik Profile</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell className="font-medium">{pkg.name}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {pkg.speed}
                  </TableCell>
                  <TableCell>{pkg.price}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {pkg.mikrotikProfile}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
