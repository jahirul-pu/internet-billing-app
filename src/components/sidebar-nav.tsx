"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, CreditCard, Settings, Package, LifeBuoy, MessageSquareText, Network, Archive, Receipt, Truck, Ticket, Activity, Gift, Building2, Globe, LineChart, ContactRound, HandCoins } from "lucide-react"
import { cn } from "@/lib/utils"

const navGroups = [
  {
    title: "CUSTOMERS",
    items: [
      { name: "Users", href: "/users", icon: Users },
      { name: "Staff Directory", href: "/staff", icon: ContactRound },
      { name: "Franchise", href: "/franchise", icon: Building2 },
    ]
  },
  {
    title: "NETWORK",
    items: [
      { name: "Network", href: "/network", icon: Network },
      { name: "Upstream Providers", href: "/upstream", icon: Globe },
      { name: "Hotspot", href: "/hotspot", icon: Ticket },
      { name: "Packages", href: "/packages", icon: Package },
    ]
  },
  {
    title: "FINANCE",
    items: [
      { name: "Billing", href: "/billing", icon: CreditCard },
      { name: "Shift Collections", href: "/collections", icon: HandCoins },
      { name: "Accounting", href: "/accounting", icon: Receipt },
    ]
  },
  {
    title: "OPERATIONS",
    items: [
      { name: "Analytics", href: "/analytics", icon: LineChart },
      { name: "Retention", href: "/retention", icon: Activity },
      { name: "Loyalty & Rewards", href: "/loyalty", icon: Gift },
    ]
  },
  {
    title: "FIELD",
    items: [
      { name: "Dispatch", href: "/dispatch", icon: Truck },
      { name: "Inventory", href: "/inventory", icon: Archive },
    ]
  },
  {
    title: "COMMUNICATION",
    items: [
      { name: "Support", href: "/support", icon: LifeBuoy },
      { name: "Communications", href: "/communications", icon: MessageSquareText },
    ]
  },
  {
    title: "SYSTEM",
    items: [
      { name: "Settings", href: "/settings", icon: Settings },
    ]
  }
]

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-6 p-4">
      {/* Dashboard Item */}
      <Link
        href="/"
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          pathname === "/" 
            ? "bg-indigo-600 text-white" 
            : "text-slate-400 hover:bg-slate-800 hover:text-white"
        )}
      >
        <LayoutDashboard className="h-4 w-4" />
        Dashboard
      </Link>

      {navGroups.map((group) => (
        <div key={group.title} className="flex flex-col gap-1">
          <h3 className="px-3 text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-1">
            {group.title}
          </h3>
          {group.items.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-indigo-600 text-white" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
