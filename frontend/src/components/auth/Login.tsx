import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, Lock, Eye, EyeOff, Building2, ShieldCheck, Wallet, Moon, Sun } from "lucide-react"
import { api } from "@/lib/api"
import { getInitialTheme, toggleTheme } from "@/lib/theme"

const LoginPage = () => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState("resident")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme)

  useEffect(() => {
    const token = localStorage.getItem("bsms_token")
    if (!token) return
    api.auth.me().then((profile) => {
      if (profile.role === "super_admin") navigate("/super-admin", { replace: true })
      else if (profile.role === "admin") navigate("/dashboard", { replace: true })
      else navigate("/notices", { replace: true })
    }).catch(() => localStorage.removeItem("bsms_token"))
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await api.auth.login(email, password, role)
      localStorage.setItem("bsms_token", res.access_token)
      if (role === "super_admin") navigate("/super-admin")
      else if (role === "admin") navigate("/dashboard")
      else navigate("/notices")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-500 hover:text-white glass"
          onClick={() => setTheme(toggleTheme(theme))}
          aria-label="Toggle color mode"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px]" />
      <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-cyan-400/20 blur-[100px]" />

      <Card className="glass-card max-w-5xl w-full grid md:grid-cols-2 min-h-[600px] overflow-hidden border-none z-10 relative">
        <div className="hidden md:flex bg-black/20 flex-col justify-between p-12 relative overflow-hidden border-r border-white/5">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 bg-primary/20 border border-primary/50 rounded-xl flex items-center justify-center text-primary shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                <Building2 className="h-6 w-6 drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]" />
              </div>
              <span className="text-2xl font-bold neon-text tracking-widest uppercase">BSMS.</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
              SYSTEM <br /><span className="neon-text">ACCESS.</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-sm leading-relaxed font-light">
              Secure authentication gateway for building management and operations.
            </p>
          </div>

          <div className="relative z-10 space-y-6">
            <FeatureItem
              icon={<ShieldCheck className="text-primary h-6 w-6 drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]" />}
              title="Secure Gateway"
              description="End-to-end encrypted protocol"
            />
            <FeatureItem
              icon={<Wallet className="text-primary h-6 w-6 drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]" />}
              title="Financial Subsystem"
              description="Real-time transaction tracking"
            />
          </div>
        </div>

        <CardContent className="p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-black/40 backdrop-blur-sm">
          <div className="mb-10 text-center md:text-left">
            <div className="md:hidden flex justify-center mb-6">
              <div className="w-12 h-12 bg-primary/20 border border-primary/50 rounded-xl flex items-center justify-center text-primary shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                <Building2 className="h-6 w-6 drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">AUTHENTICATE</h2>
            <p className="text-slate-400 font-light text-sm">Enter credentials to initialize session</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-sm font-medium">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-sm font-medium tracking-wider text-slate-300">AUTHORIZATION LEVEL</Label>
              <Tabs value={role} onValueChange={setRole} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10 p-1">
                  <TabsTrigger value="resident" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-all">Resident</TabsTrigger>
                  <TabsTrigger value="admin" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-all">Society Admin</TabsTrigger>
                  <TabsTrigger value="super_admin" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-all">Platform</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g. name@society.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="pl-10 pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  type="button"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="remember" />
              <label htmlFor="remember" className="text-sm text-slate-600 dark:text-slate-400 leading-none cursor-pointer">
                Keep me logged in
              </label>
            </div>

            <Button className="w-full py-6 text-base font-bold bg-primary text-black hover:bg-primary/90 shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] transition-all duration-300 uppercase tracking-widest border border-primary" disabled={loading}>
              {loading ? "INITIALIZING..." : "INITIATE SESSION"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

const FeatureItem = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="flex items-center gap-4 group">
    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.2)] flex items-center justify-center flex-shrink-0 group-hover:border-primary/50 group-hover:bg-primary/10 transition-all duration-300">
      {icon}
    </div>
    <div>
      <p className="font-medium text-white tracking-wide">{title}</p>
      <p className="text-sm text-slate-400 font-light">{description}</p>
    </div>
  </div>
)

export default LoginPage
