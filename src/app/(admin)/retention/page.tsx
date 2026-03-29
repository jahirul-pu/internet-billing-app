"use client"

import { useState } from "react"
import { AlertTriangle, Clock, HeartHandshake, MoreHorizontal } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const atRiskCustomers: any[] = []

type ActionType = 
  | "Apply 10% Next Bill Discount"
  | "Send Apology & Free 24h Speed Boost SMS"
  | "Dispatch Technician for Quality Check"

interface SelectedAction {
  customerName: string
  action: ActionType
}

export default function RetentionPage() {
  const [selectedAction, setSelectedAction] = useState<SelectedAction | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleActionClick = (customerName: string, action: ActionType) => {
    setSelectedAction({ customerName, action })
    setIsDialogOpen(true)
  }

  const handleConfirmAction = () => {
    // Here you would typically make an API call to save the action
    console.log("Confirmed action:", selectedAction)
    setIsDialogOpen(false)
    setSelectedAction(null)
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Retention & Analytics</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-red-500/50 bg-red-500/10 dark:bg-red-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">
              High Churn Risk
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">0</div>
            <p className="text-xs text-red-600/80 dark:text-red-400/80">
              +0 from last week
            </p>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/50 bg-yellow-500/10 dark:bg-yellow-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
              Tickets Open &gt; 48 Hrs
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">0</div>
            <p className="text-xs text-yellow-600/80 dark:text-yellow-400/80">
              0 from yesterday
            </p>
          </CardContent>
        </Card>
        <Card className="border-green-500/50 bg-green-500/10 dark:bg-green-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">
              Saved Customers This Month
            </CardTitle>
            <HeartHandshake className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">0</div>
            <p className="text-xs text-green-600/80 dark:text-green-400/80">
              +0% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold tracking-tight">At-Risk Customers</h3>
        <div className="rounded-md border border-slate-800 bg-slate-950/50">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-slate-800/50">
                <TableHead>Customer Name</TableHead>
                <TableHead>Risk Score</TableHead>
                <TableHead>Primary Reason</TableHead>
                <TableHead>Average Daily Usage</TableHead>
                <TableHead className="text-right">Intervention Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {atRiskCustomers.map((customer) => (
                <TableRow key={customer.id} className="border-slate-800 hover:bg-slate-800/50">
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell className="w-[200px]">
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={customer.riskScore} 
                        className="h-2" 
                        indicatorClassName={customer.riskScore > 80 ? 'bg-red-500' : 'bg-yellow-500'} 
                      />
                      <span className="text-xs text-slate-400">{customer.riskScore}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{customer.primaryReason}</TableCell>
                  <TableCell>{customer.averageDailyUsage}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-100">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[280px]">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleActionClick(customer.name, "Apply 10% Next Bill Discount")}>
                          Apply 10% Next Bill Discount
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleActionClick(customer.name, "Send Apology & Free 24h Speed Boost SMS")}>
                          Send Apology & Free 24h Speed Boost SMS
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleActionClick(customer.name, "Dispatch Technician for Quality Check")}>
                          Dispatch Technician for Quality Check
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Intervention Action</DialogTitle>
            <DialogDescription>
              Are you sure you want to proceed with this action for {selectedAction?.customerName}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm font-medium text-slate-200">Selected Action:</p>
            <p className="text-sm text-slate-400 mt-1">{selectedAction?.action}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmAction}>
              Confirm Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
