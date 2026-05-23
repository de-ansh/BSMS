import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Building2, Loader2, Plus, UserPlus, Power, PowerOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { api } from "@/lib/api"

interface Building {
  id: string
  name: string
  code: string
  address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  is_active: boolean
  admin_count: number
  unit_count: number
}

interface Admin {
  id: string
  name: string
  email: string
  is_active: boolean
  created_at: string
}

const BuildingDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [building, setBuilding] = useState<Building | null>(null)
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [adminName, setAdminName] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")

  const load = () => {
    if (!id) return
    setLoading(true)
    Promise.all([api.superAdmin.buildings.get(id), api.superAdmin.buildings.admins(id)])
      .then(([b, a]) => {
        setBuilding(b)
        setAdmins(a)
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [id])

  const toggleBuilding = async () => {
    if (!building) return
    try {
      await api.superAdmin.buildings.update(building.id, { is_active: !building.is_active })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed")
    }
  }

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setSubmitting(true)
    setError("")
    try {
      await api.superAdmin.buildings.createAdmin(id, {
        name: adminName.trim(),
        email: adminEmail.trim(),
        password: adminPassword,
      })
      setAdminName("")
      setAdminEmail("")
      setAdminPassword("")
      setShowForm(false)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create admin")
    } finally {
      setSubmitting(false)
    }
  }

  const toggleAdmin = async (admin: Admin) => {
    try {
      await api.superAdmin.setAdminStatus(admin.id, !admin.is_active)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update admin")
    }
  }

  if (loading) {
    return <div className="p-8 animate-pulse h-64 bg-slate-200 dark:bg-slate-800 rounded-xl m-8" />
  }

  if (!building) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error || "Building not found"}</p>
        <Button variant="outline" onClick={() => navigate("/super-admin")}>Back</Button>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/super-admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold truncate">{building.name}</h1>
            <p className="text-sm text-slate-500 font-mono">{building.code}</p>
          </div>
          <Badge className={building.is_active ? "bg-emerald-100 text-emerald-700" : ""}>
            {building.is_active ? "Active" : "Disabled"}
          </Badge>
        </div>

        {error && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">{error}</div>}

        <Card>
          <CardContent className="p-6 space-y-3">
            {building.address && <p className="text-sm">{building.address}</p>}
            <p className="text-sm text-slate-500">
              {[building.city, building.state, building.postal_code].filter(Boolean).join(", ")}
            </p>
            <div className="flex gap-4 text-sm">
              <span>{building.unit_count} units</span>
              <span>{building.admin_count} admins</span>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={toggleBuilding}>
              {building.is_active ? <><PowerOff className="h-4 w-4" /> Disable building</> : <><Power className="h-4 w-4" /> Enable building</>}
            </Button>
            {!building.is_active && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Disabled buildings block society admins from signing in.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Society Admins</CardTitle>
            <Button size="sm" className="gap-2 bg-violet-600 hover:bg-violet-700" onClick={() => setShowForm(!showForm)} disabled={!building.is_active}>
              <Plus className="h-4 w-4" /> Add Admin
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {showForm && (
              <form onSubmit={createAdmin} className="p-4 border rounded-lg space-y-4 bg-slate-50 dark:bg-slate-800/50">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input required value={adminName} onChange={(e) => setAdminName(e.target.value)} disabled={submitting} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" required value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} disabled={submitting} />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" required minLength={6} value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} disabled={submitting} />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} disabled={submitting}>Cancel</Button>
                  <Button type="submit" className="gap-2 bg-violet-600 hover:bg-violet-700" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4" /> Create Admin</>}
                  </Button>
                </div>
              </form>
            )}

            {admins.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No admins yet. Create one so they can manage this building.</p>
            ) : (
              <div className="space-y-2">
                {admins.map((admin) => (
                  <div key={admin.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-semibold text-sm">{admin.name}</p>
                      <p className="text-xs text-slate-500">{admin.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={admin.is_active ? "" : "opacity-60"}>
                        {admin.is_active ? "Active" : "Disabled"}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => toggleAdmin(admin)}>
                        {admin.is_active ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}

export default BuildingDetail
