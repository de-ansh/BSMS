import { useState, useEffect } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import {
  BarChart, Building2, Users, CreditCard, Bell, Settings, HelpCircle,
  Search, ChevronDown, LogOut, BadgeInfo, ShieldCheck, Menu, X, Moon, Sun
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { api } from "@/lib/api"
import { getInitialTheme, toggleTheme } from "@/lib/theme"

const navItems = [
  { icon: <BarChart />, label: "Dashboard", path: "/dashboard", adminOnly: true },
  { icon: <Building2 />, label: "Units & Members", path: "/members", adminOnly: true },
  { icon: <BadgeInfo />, label: "Staff", path: "/staff", adminOnly: true },
  { icon: <CreditCard />, label: "Billing", path: "/billing", adminOnly: true },
  { icon: <Bell />, label: "Notices", path: "/notices", adminOnly: false },
  { icon: <ShieldCheck />, label: "Audit Log", path: "/audit-log", adminOnly: true },
]

const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null)
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme)

  useEffect(() => {
    const token = localStorage.getItem("bsms_token")
    if (!token) {
      navigate("/login", { replace: true })
      return
    }
    api.auth.me().then((profile) => {
      setUser(profile)
      const adminPaths = ["/dashboard", "/members", "/staff", "/billing", "/audit-log"]
      const isAdminRoute = adminPaths.some((p) => location.pathname === p || location.pathname.startsWith(`${p}/`))
      if (profile.role !== "admin" && isAdminRoute) {
        navigate("/notices", { replace: true })
      }
    }).catch(() => {
      localStorage.removeItem("bsms_token")
      navigate("/login", { replace: true })
    })
  }, [navigate, location.pathname])

  const handleLogout = () => {
    localStorage.removeItem("bsms_token")
    navigate("/login")
  }

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard"
    return location.pathname.startsWith(path)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 lg:w-20 lg:hover:w-64 group
        transition-all duration-300 ease-in-out
        bg-white dark:bg-slate-900 border-r
        flex flex-col overflow-hidden
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="p-6 flex items-center justify-between lg:justify-start gap-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center shrink-0">
              <Building2 className="text-white h-5 w-5" />
            </div>
            <span className="font-bold text-xl tracking-tight lg:opacity-0 lg:group-hover:opacity-100 transition-opacity whitespace-nowrap">BSMS Admin</span>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto overflow-x-hidden">
          {navItems.filter((item) => user?.role === "admin" || !item.adminOnly).map((item) => (
            <Button
              key={item.path}
              variant={isActive(item.path) ? "secondary" : "ghost"}
              className={`w-full justify-start gap-4 p-6 rounded-lg transition-all ${
                isActive(item.path)
                  ? "bg-primary/10 text-primary hover:bg-primary/15"
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50"
              }`}
              onClick={() => { navigate(item.path); setSidebarOpen(false) }}
            >
              {item.icon}
              <span className="lg:opacity-0 lg:group-hover:opacity-100 transition-all font-medium whitespace-nowrap">{item.label}</span>
            </Button>
          ))}
        </nav>

        <div className="p-4 border-t flex-shrink-0 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-4 p-6 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50 opacity-50 cursor-not-allowed"
            disabled
            title="Settings coming soon"
          >
            <Settings className="h-5 w-5 shrink-0" />
            <span className="lg:opacity-0 lg:group-hover:opacity-100 transition-all font-medium whitespace-nowrap">Settings</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-4 p-6 rounded-lg text-slate-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="lg:opacity-0 lg:group-hover:opacity-100 transition-all font-medium whitespace-nowrap">Logout</span>
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-transparent overflow-hidden">
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden md:flex relative max-w-sm w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input placeholder="Search..." className="pl-10 bg-slate-100/50 border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary h-10 w-48 lg:w-64" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-500 hidden sm:flex"
              onClick={() => setTheme(toggleTheme(theme))}
              aria-label="Toggle color mode"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" className="text-slate-500 hidden sm:flex">
              <HelpCircle className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none">{user?.name || "User"}</p>
                <p className="text-xs text-slate-500">{user?.email || ""}</p>
              </div>
              <Avatar className="h-9 w-9 border-2 border-transparent">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {user?.name?.split(" ").map(n => n[0]).join("") || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout
