import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { SidebarNav } from "./sidebar-nav"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b px-4 md:px-6 bg-background shrink-0">
      <div className="flex items-center gap-4">
        <Sheet>
          <SheetTrigger render={<Button variant="outline" size="icon" className="md:hidden" />}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-slate-950 border-r-slate-800 text-slate-50">
            <SheetTitle className="sr-only">Mobile Navigation</SheetTitle>
            <div className="flex h-16 items-center px-6 border-b border-slate-800">
              <span className="font-bold text-lg text-white">🐱 Purrfect Portal</span>
            </div>
            <SidebarNav />
          </SheetContent>
        </Sheet>
        
        <div className="flex items-center gap-2 font-bold flex-1 text-lg tracking-tight">
          <span className="text-xl">🐱</span>
          <span className="hidden sm:inline-block">Purrfect Portal</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="Admin user" />
          <AvatarFallback>AD</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
