import { SidebarNav } from "./sidebar-nav"

export function Sidebar({ role }: { role?: string }) {
  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-slate-800 bg-slate-950 shrink-0 overflow-y-auto">
      <SidebarNav role={role} />
    </aside>
  )
}
