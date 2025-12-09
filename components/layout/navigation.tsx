"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Receipt, CreditCard, Users, Settings, LogOut, TrendingUp, Menu, ShieldCheck, Repeat } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser, useClerk } from "@clerk/nextjs"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { InvitationNotifications } from "@/components/households/invitation-notifications"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useEffect, useState } from "react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/receipts", label: "Receipts", icon: Receipt },
  { href: "/subscriptions", label: "Subscriptions", icon: Repeat },
  { href: "/insights", label: "Insights", icon: TrendingUp },
  { href: "/sharing", label: "Sharing", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()
  const { user } = useUser()
  const { signOut } = useClerk()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function checkAdmin() {
      try {
        const response = await fetch("/api/admin/check")
        if (response.ok) {
          const data = await response.json()
          setIsAdmin(data.isAdmin)
        }
      } catch (error) {
        setIsAdmin(false)
      }
    }
    if (user) {
      checkAdmin()
    }
  }, [user])

  const displayNavItems = [...navItems]
  if (isAdmin) {
    displayNavItems.push({ href: "/admin", label: "Admin", icon: ShieldCheck })
  }

  const handleLogout = async () => {
    await signOut()
  }

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto flex h-16 items-center gap-2 px-3 sm:gap-4 sm:px-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <img src="/logo.png" alt="ReceiptWise" className="h-6 w-auto sm:h-8" />
          <span className="hidden text-xl font-bold text-foreground sm:inline">ReceiptWise</span>
        </Link>

        {/* Mobile Navigation Dropdown */}
        <div className="flex flex-1 items-center justify-start md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Menu className="h-4 w-4" />
                <span className="text-sm">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {displayNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2",
                        isActive && "bg-primary/10 text-primary"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden flex-1 items-center gap-0.5 md:flex sm:gap-1">
          {displayNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors sm:px-3",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            )
          })}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <InvitationNotifications />
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
                <img
                  src={user?.imageUrl || "/placeholder.svg?height=32&width=32&query=user avatar"}
                  alt="User avatar"
                  className="h-8 w-8 rounded-full object-cover"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user?.fullName || user?.firstName || "User"}</p>
                <p className="text-xs text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
