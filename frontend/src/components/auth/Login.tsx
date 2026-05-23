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
    if (localStorage.getItem("bsms_token")) {
      navigate("/dashboard", { replace: true })
    }
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await api.auth.login(email, password, role)
      localStorage.setItem("bsms_token", res.access_token)
      navigate("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-slate-500"
        onClick={() => setTheme(toggleTheme(theme))}
        aria-label="Toggle color mode"
      >
        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>
      <Card className="max-w-5xl w-full grid md:grid-cols-2 min-h-[600px] overflow-hidden shadow-2xl border-none">
        <div className="hidden md:flex bg-blue-50/50 dark:bg-blue-900/10 flex-col justify-between p-12 relative overflow-hidden border-r">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-12">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-lg">
                <Building2 className="h-6 w-6" />
              </div>
              <span className="text-2xl font-bold text-primary tracking-tight">BSMS</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white leading-tight mb-6">
              Manage Your <br /><span className="text-primary">Building.</span> Effortlessly.
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
              One system for members, staff, and society finances. Modern solutions for urban living.
            </p>
          </div>

          <div className="relative z-10 space-y-6">
            <FeatureItem
              icon={<ShieldCheck className="text-primary h-6 w-6" />}
              title="Secure Access"
              description="End-to-end encrypted portal"
            />
            <FeatureItem
              icon={<Wallet className="text-primary h-6 w-6" />}
              title="Financial Transparency"
              description="Real-time maintenance tracking"
            />
          </div>
        </div>

        <CardContent className="p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-background">
          <div className="mb-10 text-center md:text-left">
            <div className="md:hidden flex justify-center mb-6">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-lg">
                <Building2 className="h-6 w-6" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome Back</h2>
            <p className="text-slate-500 dark:text-slate-400">Enter your credentials to access the portal</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-sm font-medium">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Select Role</Label>
              <Tabs value={role} onValueChange={setRole} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-800">
                  <TabsTrigger value="resident">Resident</TabsTrigger>
                  <TabsTrigger value="admin">Admin</TabsTrigger>
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

            <Button className="w-full py-6 text-base font-bold shadow-xl shadow-primary/20" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

const FeatureItem = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="flex items-center gap-4 group">
    <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center flex-shrink-0 border">
      {icon}
    </div>
    <div>
      <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  </div>
)

export default LoginPage
