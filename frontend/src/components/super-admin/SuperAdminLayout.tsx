import { useState, useEffect } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { Building2, LayoutGrid, LogOut, Menu, Moon, Sun, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { getInitialTheme, toggleTheme } from "@/lib/theme"

const navItems = [
  { icon: <LayoutGrid />, label: "Buildings", path: "/super-admin" },
]

const SuperAdminLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme)

  useEffect(() => {
    const token = localStorage.getItem("bsms_token")
    if (!token) {
      navigate("/login", { replace: true })
      return
    }
    api.auth.me().then((profile) => {
      if (profile.role !== "super_admin") {
        navigate(profile.role === "admin" ? "/dashboard" : "/notices", { replace: true })
        return
      }
      setUser(profile)
    }).catch(() => {
      localStorage.removeItem("bsms_token")
      navigate("/login", { replace: true })
    })
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem("bsms_token")
    navigate("/login")
  }

  const isActive = (path: string) => {
    if (path === "/super-admin") {
      return location.pathname === "/super-admin" || location.pathname.startsWith("/super-admin/buildings")
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-black/20 backdrop-blur-md border-r border-white/10 flex flex-col
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-9 h-9 bg-primary/20 border border-primary/50 shadow-[0_0_15px_rgba(0,240,255,0.3)] rounded-lg flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]" />
          </div>
          <div>
            <p className="font-bold text-sm text-white tracking-wide">BSMS Platform</p>
            <p className="text-[10px] neon-text uppercase tracking-widest">Super Admin</p>
          </div>
          <button className="lg:hidden ml-auto text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant={isActive(item.path) ? "secondary" : "ghost"}
              className={`w-full justify-start gap-3 transition-all duration-300 ${isActive(item.path) ? "bg-primary/20 text-primary shadow-[0_0_10px_rgba(0,240,255,0.2)] border border-primary/30" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
              onClick={() => { navigate(item.path); setSidebarOpen(false) }}
            >
              {item.icon}
              {item.label}
            </Button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Button variant="ghost" className="w-full justify-start gap-3 text-slate-400 hover:text-white hover:bg-white/5" onClick={handleLogout}>
            <LogOut className="h-5 w-5" /> Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-transparent">
        <header className="h-14 border-b border-white/10 bg-black/20 backdrop-blur-md px-4 flex items-center justify-between shrink-0">
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <p className="text-sm font-bold text-white tracking-wide hidden sm:block">
            {user?.name || "Super Admin"}
          </p>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white glass" onClick={() => setTheme(toggleTheme(theme))}>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </header>
        <div className="flex-1 min-h-0 overflow-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default SuperAdminLayout
