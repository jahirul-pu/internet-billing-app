import { SidebarNav } from "./sidebar-nav"

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-slate-800 bg-slate-950 shrink-0">
      <SidebarNav />
    </aside>
  )
}
