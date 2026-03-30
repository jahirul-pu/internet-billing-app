"use client"

import { useState } from "react"
import { Send, History, CheckCircle2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

/* ── Mock Data ── */

interface SentMessage {
  id: string
  date: string
  audience: string
  snippet: string
  status: string
  deliveredTo: number
}

const messageHistory: SentMessage[] = [
  {
    id: "MSG-001",
    date: "2026-03-25 10:30 AM",
    audience: "All Users",
    snippet: "Dear customers, our scheduled maintenance tonight from 2 AM to 4 AM...",
    status: "Sent",
    deliveredTo: 1024,
  },
  {
    id: "MSG-002",
    date: "2026-03-20 04:15 PM",
    audience: "Blocked Users",
    snippet: "Reminder: Your internet connection is currently suspended due to...",
    status: "Sent",
    deliveredTo: 44,
  },
  {
    id: "MSG-003",
    date: "2026-03-15 09:00 AM",
    audience: "Active Users",
    snippet: "Happy Independence Day from Purrfect Universe! Enjoy seamless...",
    status: "Sent",
    deliveredTo: 980,
  },
  {
    id: "MSG-004",
    date: "2026-03-10 11:45 AM",
    audience: "Specific Area: Mirpur",
    snippet: "Area update: A major fiber cut has occurred in Mirpur. Our team...",
    status: "Sent",
    deliveredTo: 156,
  },
  {
    id: "MSG-005",
    date: "2026-03-01 08:00 AM",
    audience: "All Users",
    snippet: "Your monthly invoice for March has been generated. Please pay by...",
    status: "Sent",
    deliveredTo: 1018,
  },
]

export default function CommunicationsPage() {
  const [message, setMessage] = useState("")
  const charLimit = 160

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Communications</h1>
        <p className="text-muted-foreground text-sm">
          Send bulk SMS announcements and view message delivery history.
        </p>
      </div>
      <Separator />

      <div className="grid gap-6 md:grid-cols-2">
        {/* ── Left Column: Compose Message ── */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Compose Bulk SMS
              </CardTitle>
              <CardDescription>
                Select your audience and draft your message. Standard standard SMS length is 160 characters.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  setMessage("")
                }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Select defaultValue="all_users">
                    <SelectTrigger>
                      <SelectValue placeholder="Select audience">
                        All Users
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_users">All Users</SelectItem>
                      <SelectItem value="active_users">Active Users</SelectItem>
                      <SelectItem value="blocked_users">Blocked Users</SelectItem>
                      <SelectItem value="specific_area">Specific Area</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message-body">Message Body</Label>
                  <Textarea
                    id="message-body"
                    placeholder="Type your message here..."
                    className="min-h-[150px] resize-none"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <div className="flex justify-between items-center text-xs">
                    <span
                      className={cn(
                        "text-muted-foreground",
                        message.length > charLimit && "text-destructive font-medium"
                      )}
                    >
                      {message.length} / {charLimit} characters
                    </span>
                    {message.length > charLimit && (
                      <span className="text-destructive font-medium">
                        Will be sent as {Math.ceil(message.length / charLimit)} messages
                      </span>
                    )}
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  Send Bulk SMS
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column: Message History ── */}
        <div className="flex flex-col gap-6">
          <Card className="flex flex-col h-[600px] md:h-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Message History
              </CardTitle>
              <CardDescription>
                Recently sent broadcasts and their delivery status.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto pr-2">
              <div className="space-y-6">
                {messageHistory.map((item) => (
                  <div key={item.id} className="flex flex-col gap-2 rounded-lg border p-4 shadow-sm bg-card">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{item.audience}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {item.date}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3" />
                          Sent
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          to {item.deliveredTo} users
                        </span>
                      </div>
                    </div>
                    <p className="text-sm mt-1 text-card-foreground/90 italic border-l-2 border-primary/20 pl-3 py-1">
                      &quot;{item.snippet}&quot;
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
