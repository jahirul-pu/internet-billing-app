"use client"

import { useState } from "react"
import { AlertCircle, CreditCard, ReceiptText, ShieldAlert } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Separator } from "@/components/ui/separator"

const mockUserState = {
  name: "Rahim Uddin",
  status: "Blocked", // Change to "Active" to test the normal state
  currentPackage: "20 Mbps Standard",
  amountDue: "800 BDT",
  bkashNumber: "01712-345678",
  nagadNumber: "01912-345678",
}

export default function PortalPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const isBlocked = mockUserState.status === "Blocked"

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center pb-4">
        {/* Placeholder Logo */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600/10">
          <ShieldAlert className="h-8 w-8 text-indigo-600" />
        </div>
        <CardTitle className="text-2xl font-bold">Purrfect Universe</CardTitle>
        <CardDescription className="text-base mt-2">
          Hello, {mockUserState.name}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {isBlocked && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Action Required</AlertTitle>
            <AlertDescription>
              Your connection is temporarily suspended due to an unpaid balance.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 rounded-lg border bg-card p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">Current Package</span>
            <span className="text-sm font-semibold">{mockUserState.currentPackage}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">Amount Due</span>
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {mockUserState.amountDue}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button className="w-full" size="lg" />}>
            <CreditCard className="mr-2 h-5 w-5" />
            Pay via bKash / Nagad
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Make a Payment</DialogTitle>
              <DialogDescription>
                Send the due amount to either merchant number below, then submit your Transaction ID for verification.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-pink-600">bKash Merchant</span>
                    <span className="font-mono">{mockUserState.bkashNumber}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-orange-600">Nagad Merchant</span>
                    <span className="font-mono">{mockUserState.nagadNumber}</span>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="grid gap-2 mt-2">
                <Label htmlFor="trxId">Transaction ID (TrxID)</Label>
                <div className="flex relative">
                  <ReceiptText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="trxId" placeholder="e.g. 8NX0S..." className="pl-9" />
                </div>
              </div>
            </div>

            <DialogFooter className="sm:justify-end">
              <DialogTrigger render={<Button variant="secondary" />}>
                Cancel
              </DialogTrigger>
              <Button onClick={() => setDialogOpen(false)}>Submit Payment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
}
