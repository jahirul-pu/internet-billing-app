import { Users, UserCheck, UserX, BadgeDollarSign, BarChart3 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const summaryCards = [
  {
    title: "Total Users",
    value: "1,024",
    icon: Users,
    valueClass: "text-foreground",
    description: "All registered accounts",
  },
  {
    title: "Active Users",
    value: "980",
    icon: UserCheck,
    valueClass: "text-emerald-500",
    description: "Currently active",
  },
  {
    title: "Blocked / Suspended",
    value: "44",
    icon: UserX,
    valueClass: "text-red-500",
    description: "Restricted accounts",
  },
  {
    title: "Monthly Revenue",
    value: "৳ 500,000",
    icon: BadgeDollarSign,
    valueClass: "text-foreground",
    description: "Revenue this month (BDT)",
  },
]

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">
                {card.title}
              </CardDescription>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.valueClass}`}>
                {card.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Placeholder */}
      <Card className="min-h-[350px]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Network Traffic / Revenue Trend</CardTitle>
              <CardDescription>
                Historical data visualization coming soon
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground py-12">
            <BarChart3 className="h-16 w-16 opacity-20" />
            <p className="text-sm font-medium">Chart will be displayed here</p>
            <p className="text-xs">
              Integrate your preferred charting library to visualize trends
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
