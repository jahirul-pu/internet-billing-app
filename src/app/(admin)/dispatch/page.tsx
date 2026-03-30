"use client"

import { useState } from "react"
import { 
  Plus, 
  MapPin, 
  Wrench, 
  UserPlus, 
  Router, 
  MoreHorizontal 
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

/* ── Mock Data ── */

type TaskStatus = "Pending" | "In Progress" | "Completed"
type TaskType = "New Connection" | "Maintenance" | "Device Recovery"

interface DispatchTask {
  id: string
  type: TaskType
  technicianName: string
  technicianInitials: string
  customerName: string
  zone: string
  status: TaskStatus
}

const initialTasks: DispatchTask[] = []

/* ── Helpers ── */

function getTypeIcon(type: TaskType) {
  switch (type) {
    case "New Connection": return <UserPlus className="h-4 w-4" />
    case "Maintenance": return <Wrench className="h-4 w-4" />
    case "Device Recovery": return <Router className="h-4 w-4" />
  }
}

function getTypeColor(type: TaskType) {
  switch (type) {
    case "New Connection": return "text-emerald-700 bg-emerald-500/10 border-emerald-200"
    case "Maintenance": return "text-blue-700 bg-blue-500/10 border-blue-200"
    case "Device Recovery": return "text-orange-700 bg-orange-500/10 border-orange-200"
  }
}


export default function DispatchPage() {
  const [taskOpen, setTaskOpen] = useState(false)
  const [tasks] = useState<DispatchTask[]>(initialTasks)

  const pending = tasks.filter(t => t.status === "Pending")
  const inProgress = tasks.filter(t => t.status === "In Progress")
  const completed = tasks.filter(t => t.status === "Completed")

  const TaskCard = ({ task }: { task: DispatchTask }) => (
    <Card className="shadow-sm border-muted-foreground/20 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing">
      <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
        <Badge variant="outline" className={cn("px-2 py-0.5 text-xs font-semibold shadow-none flex items-center gap-1.5", getTypeColor(task.type))}>
          {getTypeIcon(task.type)}
          {task.type}
        </Badge>
        <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-2 text-muted-foreground">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-4 pt-2 pb-3">
        <h4 className="font-semibold text-base mb-1">{task.customerName}</h4>
        <div className="flex items-start gap-1.5 text-muted-foreground text-sm mt-2">
          <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="line-clamp-2 leading-tight">{task.zone}</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center border-t border-muted/50 mt-3">
         <span className="text-xs text-muted-foreground font-medium pt-3">Assigned To</span>
         <div className="flex items-center gap-2 pt-3">
           <Avatar className="h-6 w-6 border">
             <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">{task.technicianInitials}</AvatarFallback>
           </Avatar>
           <span className="text-sm font-medium">{task.technicianName}</span>
         </div>
      </CardFooter>
    </Card>
  )

  const KanbanColumn = ({ title, count, tasksList, colorClass }: { title: string, count: number, tasksList: DispatchTask[], colorClass: string }) => (
    <div className="flex-1 flex flex-col bg-muted/40 rounded-xl p-4 border border-border/50">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="font-semibold text-sm tracking-tight flex items-center gap-2">
          <div className={cn("h-2 w-2 rounded-full", colorClass)} />
          {title}
        </h3>
        <Badge variant="secondary" className="text-xs">{count}</Badge>
      </div>
      <div className="flex flex-col gap-3 min-h-[150px]">
        {tasksList.map(t => <TaskCard key={t.id} task={t} />)}
        {tasksList.length === 0 && (
          <div className="flex-1 border-2 border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center text-muted-foreground text-sm py-8">
            No tasks
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-6 h-full min-h-[calc(100vh-8rem)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Field Dispatch</h1>
          <p className="text-muted-foreground text-sm">
            Assign and track technician field assignments for connections, repairs, and recoveries.
          </p>
        </div>

        {/* ── New Task Action ── */}
        <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Dispatch Task</DialogTitle>
              <DialogDescription>
                Assign a new field job to a technician.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setTaskOpen(false)
              }}
              className="grid gap-4 py-4"
            >
              <div className="grid gap-2">
                <Label htmlFor="taskType">Task Type</Label>
                <Select defaultValue="new">
                  <SelectTrigger>
                    <SelectValue placeholder="Select type">
                      New Connection
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New Connection</SelectItem>
                    <SelectItem value="maintenance">Maintenance / Repair</SelectItem>
                    <SelectItem value="recovery">Device Recovery</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="technician">Assign Technician</Label>
                <Select defaultValue="arif">
                  <SelectTrigger>
                    <SelectValue placeholder="Select technician">
                      Arif Hossain
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="arif">Arif Hossain</SelectItem>
                    <SelectItem value="sajid">Sajid Ali</SelectItem>
                    <SelectItem value="fahim">Fahim Rahman</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="customer">Customer / Target Name</Label>
                <Input id="customer" placeholder="Search customer or type name..." />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="zone">Area / Zone</Label>
                <Input id="zone" placeholder="e.g. Mirpur 10, Road 5" />
              </div>

              <div className="grid gap-2 border-t pt-4 mt-2">
                <Label htmlFor="details">Job Details / Instructions</Label>
                <Textarea 
                  id="details" 
                  placeholder="Describe the problem or exact instructions for the technician..."
                  className="resize-none h-24"
                />
              </div>

              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setTaskOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Task</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Kanban Board Container ── */}
      <div className="flex flex-col md:flex-row gap-6 mt-2 items-stretch h-full">
        <KanbanColumn 
          title="Pending Tasks" 
          count={pending.length} 
          tasksList={pending} 
          colorClass="bg-amber-500" 
        />
        <KanbanColumn 
          title="In Progress" 
          count={inProgress.length} 
          tasksList={inProgress} 
          colorClass="bg-blue-500" 
        />
        <KanbanColumn 
          title="Completed" 
          count={completed.length} 
          tasksList={completed} 
          colorClass="bg-emerald-500" 
        />
      </div>
    </div>
  )
}
