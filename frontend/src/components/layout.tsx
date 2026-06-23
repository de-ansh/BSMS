import { useState, useEffect } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import {
  BarChart, Building2, Users, CreditCard, Bell, Settings, HelpCircle,
  Search, ChevronDown, LogOut, BadgeInfo, ShieldCheck, Menu, X, Moon, Sun, Calendar
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
  { icon: <Users />, label: "Visitors", path: "/visitors", adminOnly: false },
  { icon: <Bell />, label: "Notices", path: "/notices", adminOnly: false },
  { icon: <HelpCircle />, label: "Helpdesk", path: "/helpdesk", adminOnly: false },
  { icon: <Calendar />, label: "Amenities", path: "/amenities", adminOnly: false },
  { icon: <ShieldCheck />, label: "Audit Log", path: "/audit-log", adminOnly: true },
]

const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<{ name: string; email: string; role: string; building_name?: string | null } | null>(null)
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme)

  useEffect(() => {
    const token = localStorage.getItem("bsms_token")
    if (!token) {
      navigate("/login", { replace: true })
      return
    }
    api.auth.me().then((profile) => {
      if (profile.role === "super_admin") {
        navigate("/super-admin", { replace: true })
        return
      }
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
    <div className="flex h-screen overflow-hidden bg-transparent">
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
        bg-black/20 backdrop-blur-md border-r border-white/10
        flex flex-col overflow-hidden
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="p-6 flex items-center justify-between lg:justify-start gap-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-primary/20 border border-primary/50 shadow-[0_0_15px_rgba(0,240,255,0.3)] rounded flex items-center justify-center shrink-0">
              <Building2 className="text-primary drop-shadow-[0_0_5px_rgba(0,240,255,0.8)] h-5 w-5" />
            </div>
            <span className="font-bold text-xl text-white tracking-widest uppercase lg:opacity-0 lg:group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {user?.building_name || "BSMS Admin"}
            </span>
          </div>
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto overflow-x-hidden">
          {navItems.filter((item) => user?.role === "admin" || !item.adminOnly).map((item) => (
            <Button
              key={item.path}
              variant={isActive(item.path) ? "secondary" : "ghost"}
              className={`w-full justify-start gap-4 p-6 rounded-lg transition-all duration-300 ${
                isActive(item.path)
                  ? "bg-primary/20 text-primary shadow-[0_0_10px_rgba(0,240,255,0.2)] border border-primary/30"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
              onClick={() => { navigate(item.path); setSidebarOpen(false) }}
            >
              {item.icon}
              <span className="lg:opacity-0 lg:group-hover:opacity-100 transition-all font-medium whitespace-nowrap">{item.label}</span>
            </Button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 flex-shrink-0 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-4 p-6 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white opacity-50 cursor-not-allowed"
            disabled
            title="Settings coming soon"
          >
            <Settings className="h-5 w-5 shrink-0" />
            <span className="lg:opacity-0 lg:group-hover:opacity-100 transition-all font-medium whitespace-nowrap">Settings</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-4 p-6 rounded-lg text-slate-400 hover:bg-red-500/20 hover:text-red-400"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="lg:opacity-0 lg:group-hover:opacity-100 transition-all font-medium whitespace-nowrap">Logout</span>
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-transparent overflow-hidden">
        <header className="h-16 bg-black/20 backdrop-blur-md border-b border-white/10 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden md:flex relative max-w-sm w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input placeholder="Search..." className="pl-10 bg-white/5 border border-white/10 text-white placeholder:text-slate-500 shadow-none focus-visible:ring-1 focus-visible:ring-primary h-10 w-48 lg:w-64" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-white hidden sm:flex glass"
              onClick={() => setTheme(toggleTheme(theme))}
              aria-label="Toggle color mode"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hidden sm:flex glass">
              <HelpCircle className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white tracking-wide leading-none">{user?.name || "User"}</p>
                <p className="text-xs text-slate-400 mt-1">{user?.email || ""}</p>
              </div>
              <Avatar className="h-9 w-9 border border-primary/50 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
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
