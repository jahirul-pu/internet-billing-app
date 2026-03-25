"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, CreditCard, Settings, Package, LifeBuoy, MessageSquareText, Briefcase, Network, Archive, Receipt, Truck, Ticket } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Users", href: "/users", icon: Users },
  { name: "Agents", href: "/agents", icon: Briefcase },
  { name: "Network", href: "/network", icon: Network },
  { name: "Hotspot", href: "/hotspot", icon: Ticket },
  { name: "Inventory", href: "/inventory", icon: Archive },
  { name: "Packages", href: "/packages", icon: Package },
  { name: "Support", href: "/support", icon: LifeBuoy },
  { name: "Dispatch", href: "/dispatch", icon: Truck },
  { name: "Communications", href: "/communications", icon: MessageSquareText },
  { name: "Billing", href: "/billing", icon: CreditCard },
  { name: "Accounting", href: "/accounting", icon: Receipt },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-2 p-4">
      {navItems.map((item) => {
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
    </nav>
  )
}
