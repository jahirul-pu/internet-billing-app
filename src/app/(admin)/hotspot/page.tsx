"use client"

import { useState } from "react"
import { format } from "date-fns"
import { 
  Ticket, 
  Printer, 
  Wifi, 
  Clock, 
  Database,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  MoreHorizontal
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

/* ── Mock Data ── */

interface Voucher {
  id: string
  pin: string
  dataLimit: string
  timeLimit: string
  price: string
  status: "Unused" | "Active" | "Expired"    
  createdAt: string
}

const mockVouchers: Voucher[] = [
  { id: "V-101", pin: "8472-9104", dataLimit: "1 GB", timeLimit: "2 Hours", price: "20", status: "Unused", createdAt: "2026-03-26T08:00:00Z" },
  { id: "V-102", pin: "3921-5582", dataLimit: "10 GB", timeLimit: "7 Days", price: "150", status: "Active", createdAt: "2026-03-25T14:30:00Z" },
  { id: "V-103", pin: "9912-4410", dataLimit: "Unlimited", timeLimit: "1 Hour", price: "10", status: "Expired", createdAt: "2026-03-24T09:15:00Z" },
  { id: "V-104", pin: "1104-5829", dataLimit: "1 GB", timeLimit: "2 Hours", price: "20", status: "Unused", createdAt: "2026-03-26T08:00:00Z" },
  { id: "V-105", pin: "7742-1092", dataLimit: "5 GB", timeLimit: "1 Day", price: "50", status: "Unused", createdAt: "2026-03-26T08:00:00Z" },
]

export default function HotspotPage() {
  const [vouchers] = useState<Voucher[]>(mockVouchers)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
    }, 800)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex flex-col gap-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hotspot Vouchers</h1>
          <p className="text-muted-foreground text-sm">
            Generate printable PIN codes for pre-paid Wi-Fi access.
          </p>
        </div>
        <Button onClick={handlePrint} variant="outline" className="border-primary/20 hover:bg-primary/5">
          <Printer className="mr-2 h-4 w-4" />
          Print Vouchers
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-start print:hidden">
        
        {/* ── Generation Form Card ── */}
        <Card className="md:col-span-1 shadow-sm border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              Generate PINs
            </CardTitle>
            <CardDescription>
              Create a batch of new hotspot vouchers.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleGenerate}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Vouchers to Generate</Label>
                <Input id="amount" type="number" placeholder="e.g. 50" defaultValue={50} min={1} required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dataLimit">Data Limit</Label>
                <div className="relative">
                  <Database className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="dataLimit" className="pl-9" placeholder="e.g. 1GB, 500MB, Unlimited" defaultValue="1 GB" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeLimit">Time Limit</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="timeLimit" className="pl-9" placeholder="e.g. 2 Hours, 1 Day" defaultValue="2 Hours" required />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <Label htmlFor="price">Retail Price (BDT)</Label>
                <Input id="price" type="number" placeholder="e.g. 20" defaultValue={20} required />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isGenerating}>
                {isGenerating ? (
                  <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Ticket className="mr-2 h-4 w-4" />
                )}
                {isGenerating ? "Generating Database..." : "Generate Batch"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* ── Voucher Ledger Table ── */}
        <Card className="md:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Voucher Registry</CardTitle>
            <CardDescription>
              Monitor generated PINs, package details, and ticket status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PIN Code</TableHead>
                  <TableHead>Package Details</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Creation Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vouchers.map((voucher) => (
                  <TableRow key={voucher.id}>
                    <TableCell className="font-mono font-bold text-base tracking-widest text-primary">
                      {voucher.pin}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-sm">{voucher.dataLimit} / {voucher.timeLimit}</span>
                        <span className="text-xs text-muted-foreground">{voucher.price} ৳</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          "shadow-none font-medium text-xs",
                          voucher.status === "Unused" && "bg-muted text-muted-foreground border-border",
                          voucher.status === "Active" && "bg-emerald-500/15 text-emerald-700 border-emerald-200",
                          voucher.status === "Expired" && "bg-destructive/10 text-destructive border-destructive/20"
                        )}
                      >
                        {voucher.status === "Active" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                        {voucher.status === "Expired" && <XCircle className="mr-1 h-3 w-3" />}
                        {voucher.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {format(new Date(voucher.createdAt), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                       <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" />}>
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Mark as Expired</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Delete PIN</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* ── Thermal Printer Output Area (Hidden on Web, Visible on Print) ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
            margin: 0;
            padding: 0;
          }
          aside, nav, header {
            display: none !important;
          }
          #thermal-print-area, #thermal-print-area * {
            visibility: visible;
          }
          #thermal-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 58mm; /* standard POS thermal paper width */
            padding: 2mm;
            display: flex !important;
            flex-direction: column;
            gap: 15px;
          }
          .voucher-ticket {
            border-top: 1px dashed black;
            border-bottom: 1px dashed black;
            padding: 10px 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            font-family: monospace;
          }
          .voucher-pin {
            font-size: 1.25rem;
            font-weight: bold;
            margin: 8px 0;
            letter-spacing: 2px;
          }
        }
      `}} />

      <div id="thermal-print-area" className="hidden">
        {vouchers.filter(v => v.status === "Unused").map((voucher) => (
          <div key={voucher.id} className="voucher-ticket">
            <h3 className="font-bold text-sm">Purrfect Wi-Fi</h3>
            <p className="text-xs uppercase mt-1">{voucher.dataLimit} • {voucher.timeLimit}</p>
            <div className="voucher-pin">
              {voucher.pin}
            </div>
            <p className="text-[10px] mt-1">Connect to 'Purrfect Portal'</p>
            <p className="text-[10px]">Enter PIN on login page</p>
            <p className="text-[10px] font-bold mt-2">Price: {voucher.price} ৳</p>
          </div>
        ))}
      </div>
    </div>
  )
}
