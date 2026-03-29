"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Search, RefreshCcw, ShieldAlert, CheckCircle2, Terminal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [warningMsg, setWarningMsg] = useState<string | null>(null)

  const fetchLogs = async (query = "") => {
    try {
      setLoading(true)
      const res = await fetch(`/api/logs?limit=100&search=${encodeURIComponent(query)}`)
      const json = await res.json()
      
      if (json.success) {
        setLogs(json.data || [])
        // If the table doesn't exist yet, show the warning
        if (json.warning) {
          setWarningMsg(json.warning)
        } else {
          setWarningMsg(null)
        }
      } else {
        console.error(json.error)
      }
    } catch (error) {
      console.error("Failed to load logs:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs(search)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchLogs(search)
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Logs</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Audit trail of automated and manual core system actions.
          </p>
        </div>
      </div>

      <Card className="shadow-none border border-border/60">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-lg">Event History</CardTitle>
              <CardDescription>Showing the last 100 system events.</CardDescription>
            </div>
            
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by target username..."
                  className="pl-9 h-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button type="submit" size="sm" variant="secondary" className="h-9">
                Search
              </Button>
              <Button type="button" size="icon" variant="outline" className="h-9 w-9" onClick={() => fetchLogs(search)}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          {warningMsg ? (
              <div className="h-48 flex flex-col items-center justify-center p-8 text-center bg-red-500/5 border border-dashed border-red-500/20 rounded-lg">
                <Terminal className="h-8 w-8 text-red-500 mb-3" />
                <h3 className="font-bold text-red-600 mb-1">Missing Database Table</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                   You need to run the SQL migration to create the <code className="bg-muted px-1 py-0.5 rounded">system_logs</code> table in Supabase.
                </p>
              </div>
          ) : loading ? (
             <div className="h-48 flex items-center justify-center text-muted-foreground">
                <RefreshCcw className="animate-spin h-6 w-6 mr-3 text-emerald-500/60" /> 
                Fetching Audit Trail...
             </div>
          ) : logs.length === 0 ? (
             <div className="h-48 flex flex-col items-center justify-center text-muted-foreground text-sm">
                <Terminal className="h-8 w-8 mb-3 opacity-20" />
                No system events recorded yet.
             </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead className="w-[150px]">Action Type</TableHead>
                  <TableHead className="w-[180px]">Target User</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right w-[120px]">Triggered By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.created_at), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      {log.action_type === 'AUTO_SUSPEND' ? (
                        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 shadow-none capitalize gap-1.5 h-6">
                            <ShieldAlert className="h-3 w-3" />
                            Suspend
                        </Badge>
                      ) : log.action_type === 'REACTIVATION' ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-none capitalize gap-1.5 h-6">
                            <CheckCircle2 className="h-3 w-3" />
                            Reactivate
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="shadow-none capitalize bg-muted border-border">
                            {log.action_type}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium tracking-wide">
                        {log.target_user}
                    </TableCell>
                    <TableCell className="text-sm text-foreground/80">
                        {log.description}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground uppercase font-semibold">
                        {log.triggered_by}
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
