import Link from "next/link"
import { Menu, Plus, Bell, User as UserIcon, Settings, LogOut, UserPlus, CreditCard, MessageSquareText, ContactRound, ScrollText, Banknote, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { SidebarNav } from "./sidebar-nav"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { LiveClock } from "@/components/live-clock"

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
        
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <span className="text-xl">🐱</span>
          <span className="hidden sm:inline-block">Purrfect Portal</span>
        </div>
      </div>
      
      {/* Centered Clock */}
      <div className="flex-1 flex justify-center h-full items-center mr-auto px-4">
         <LiveClock />
      </div>

      <div className="flex items-center gap-2 sm:gap-4 pr-2">
        {/* Quick Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="hidden sm:flex items-center gap-1.5 h-8" />}>
              <Plus className="h-4 w-4" />
              <span>Quick Action</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Management</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/users?action=new" />}>
                <UserPlus />
                New Customer
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/collections" />}>
                <CreditCard />
                Log Payment
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/staff" />}>
                <ContactRound />
                Add Staff
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Communications</DropdownMenuLabel>
              <DropdownMenuItem render={<Link href="/communications" />}>
                <MessageSquareText />
                Broadcast SMS
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/support" />}>
                <Ticket />
                Open Ticket
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Operations</DropdownMenuLabel>
              <DropdownMenuItem render={<Link href="/logs" />}>
                <ScrollText />
                System Logs
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/billing" />}>
                <Banknote />
                Billing Summary
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full focus-visible:ring-0">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute top-[6px] right-[8px] h-2 w-2 rounded-full bg-red-600 border-[1.5px] border-background animate-pulse"></span>
        </Button>

        {/* Admin Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="relative h-8 w-8 rounded-full outline-none ring-0 focus-visible:ring-0 p-0 ml-1" />}>
              <Avatar className="h-8 w-8 border border-border">
                <AvatarImage src="https://api.dicebear.com/7.x/notionists/svg?seed=Admin&backgroundColor=e0e7ff" alt="Admin user" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Super Admin</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    admin@purrfect.portal
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/settings" />}>
                <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/settings" />}>
                <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Settings</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/" />} className="text-red-500 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
