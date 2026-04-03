"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  CreditCard,
  FileText,
  Bot,
  Star,
  ShoppingBag,
  PiggyBank,
  LineChart,
  ChevronLeft,
  ChevronRight,
  Globe,
  LogOut,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface NavItem {
  label: string
  labelEs: string
  href: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { label: "Dashboard", labelEs: "Panel", href: "/dashboard", icon: LayoutDashboard },
  { label: "Income", labelEs: "Ingresos", href: "/income", icon: TrendingUp },
  { label: "Expenses", labelEs: "Gastos", href: "/expenses", icon: TrendingDown },
  { label: "Debts", labelEs: "Deudas", href: "/debts", icon: CreditCard },
  { label: "Documents", labelEs: "Documentos", href: "/documents", icon: FileText },
  { label: "AI Coach", labelEs: "Coach IA", href: "/coach", icon: Bot },
  { label: "Score", labelEs: "Puntaje", href: "/score", icon: Star },
  { label: "Marketplace", labelEs: "Mercado", href: "/marketplace", icon: ShoppingBag },
  { label: "Savings", labelEs: "Ahorros", href: "/savings", icon: PiggyBank },
  { label: "Investments", labelEs: "Inversiones", href: "/investments", icon: LineChart },
]

interface SidebarProps {
  locale?: string
  userName?: string
  userEmail?: string
  userAvatar?: string
}

export function Sidebar({
  locale = "en",
  userName = "User",
  userEmail = "user@flowfi.ai",
  userAvatar,
}: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [lang, setLang] = useState<"en" | "es">(locale === "es" ? "es" : "en")
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleLanguage = () => {
    setLang((prev) => (prev === "en" ? "es" : "en"))
  }

  const isActive = (href: string) => {
    return pathname?.includes(href)
  }

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? (
          <ChevronLeft className="h-5 w-5" />
        ) : (
          <ChevronRight className="h-5 w-5" />
        )}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300",
          collapsed ? "w-[70px]" : "w-[260px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center border-b border-sidebar-border px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              F
            </div>
            {!collapsed && (
              <span className="text-lg font-bold tracking-tight">
                FlowFi <span className="text-primary">AI</span>
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              const label = lang === "es" ? item.labelEs : item.label

              return (
                <li key={item.href}>
                  <Link
                    href={`/${locale}${item.href}`}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{label}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Language toggle */}
        <div className="border-t border-sidebar-border px-3 py-3">
          <button
            onClick={toggleLanguage}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <Globe className="h-5 w-5 shrink-0" />
            {!collapsed && (
              <span>{lang === "en" ? "EN" : "ES"}</span>
            )}
          </button>
        </div>

        {/* Collapse toggle (desktop) */}
        <div className="hidden border-t border-sidebar-border px-3 py-2 lg:block">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center rounded-lg p-2 text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* User section */}
        <div className="border-t border-sidebar-border px-3 py-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <Avatar className="h-8 w-8">
              {userAvatar && <AvatarImage src={userAvatar} alt={userName} />}
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">{userName}</p>
                <p className="truncate text-xs text-sidebar-foreground/50">
                  {userEmail}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
