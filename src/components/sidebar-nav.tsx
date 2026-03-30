"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, CreditCard, Settings, Package, LifeBuoy, MessageSquareText, Network, Archive, Receipt, Truck, Ticket, Activity, Gift, Building2, Globe, LineChart, ContactRound, HandCoins, TerminalSquare } from "lucide-react"
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
      { name: "Staff Access", href: "/settings/staff", icon: ContactRound },
      { name: "System Logs", href: "/logs", icon: TerminalSquare },
    ]
  }
]

export function SidebarNav({ onNavigate, role = 'SUPER_ADMIN' }: { onNavigate?: () => void, role?: string }) {
  const pathname = usePathname()

  const DashboardIcon = LayoutDashboard
  const isDashboardActive = pathname === "/"

  return (
    <nav className="flex flex-col gap-5 py-4">
      {/* Dashboard Item */}
      <div className="flex flex-col gap-0.5">
        <Link
          href="/"
          onClick={onNavigate}
          className={cn(
            "group flex items-center gap-3 px-4 py-[6px] text-[13px] font-medium transition-all relative border-l-[3px]",
            isDashboardActive 
              ? "border-indigo-500 bg-indigo-500/10 text-white" 
              : "border-transparent text-slate-400 hover:bg-slate-800/30 hover:text-slate-200"
          )}
        >
          <DashboardIcon className={cn(
            "h-4 w-4 transition-all duration-300",
            isDashboardActive 
              ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" 
              : "text-slate-500 group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
          )} />
          Dashboard
        </Link>
      </div>

      {navGroups.map((group) => {
        // Pre-filter items based on role
        const visibleItems = group.items.filter(item => {
          if (role === 'MANAGER') {
            if (item.name === 'Staff Access' || item.name === 'System Logs' || item.name === 'Settings') {
              return false
            }
          }
          return true
        })

        if (visibleItems.length === 0) return null

        return (
          <div key={group.title} className="flex flex-col gap-0.5">
            <h3 className="px-4 text-[10px] font-semibold tracking-[0.15em] text-slate-400/50 uppercase mb-1">
              {group.title}
            </h3>
            {visibleItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-3 px-4 py-[6px] text-[13px] font-medium transition-all relative border-l-[3px]",
                    isActive 
                      ? "border-indigo-500 bg-indigo-500/10 text-white" 
                      : "border-transparent text-slate-400 hover:bg-slate-800/30 hover:text-slate-200"
                  )}
                >
                  <item.icon className={cn(
                    "h-4 w-4 transition-all duration-300",
                    isActive 
                      ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" 
                      : "text-slate-500 group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                  )} />
                  {item.name}
                </Link>
              )
            })}
          </div>
        )
      })}
    </nav>
  )
}
