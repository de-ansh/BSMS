import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Building2, Plus, Eye, Power, PowerOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { api } from "@/lib/api"

interface Building {
  id: string
  name: string
  code: string
  city: string | null
  is_active: boolean
  admin_count: number
  unit_count: number
}

const BuildingsOverview = () => {
  const navigate = useNavigate()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = () => {
    setLoading(true)
    api.superAdmin.buildings.list()
      .then(setBuildings)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load buildings"))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const toggleActive = async (building: Building) => {
    try {
      await api.superAdmin.buildings.update(building.id, { is_active: !building.is_active })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update building")
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-wide uppercase">Buildings</h1>
            <p className="text-sm text-slate-400 mt-1 font-light tracking-wider uppercase">Manage societies and their admin accounts</p>
          </div>
          <Button className="gap-2 font-bold tracking-widest uppercase bg-primary text-black hover:bg-primary/90 shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] border border-primary transition-all duration-300" onClick={() => navigate("/super-admin/buildings/new")}>
            <Plus className="h-4 w-4" /> Add Building
          </Button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm shadow-[0_0_10px_rgba(239,68,68,0.2)]">{error}</div>
        )}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-40 bg-white/5 border border-white/10 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : buildings.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-16 flex flex-col items-center text-slate-400">
              <div className="w-16 h-16 mb-4 bg-primary/20 border border-primary/50 shadow-[0_0_15px_rgba(0,240,255,0.3)] rounded-2xl flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]" />
              </div>
              <p className="font-bold text-lg mb-2 text-white tracking-widest uppercase">No buildings yet</p>
              <p className="text-sm mb-6 font-light">Create your first building to onboard a society admin.</p>
              <Button className="gap-2 font-bold tracking-widest uppercase bg-primary text-black hover:bg-primary/90 shadow-[0_0_15px_rgba(0,240,255,0.3)] border border-primary transition-all" onClick={() => navigate("/super-admin/buildings/new")}>
                <Plus className="h-4 w-4" /> Add Building
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {buildings.map((building) => (
              <Card key={building.id} className={`glass-card hover:border-white/30 transition-all ${!building.is_active ? "opacity-50 grayscale" : ""}`}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-white tracking-wide uppercase">{building.name}</h2>
                      <p className="text-xs font-mono neon-text">{building.code}</p>
                      {building.city && <p className="text-sm text-slate-400 mt-1 uppercase tracking-widest font-light">{building.city}</p>}
                    </div>
                    <Badge variant="secondary" className={building.is_active ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_10px_rgba(52,211,153,0.3)] uppercase tracking-widest text-[10px]" : "bg-slate-800/50 text-slate-500 border border-slate-700 uppercase tracking-widest text-[10px]"}>
                      {building.is_active ? "Active" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-sm text-slate-500">
                    <span>{building.admin_count} admin{building.admin_count !== 1 ? "s" : ""}</span>
                    <span>{building.unit_count} unit{building.unit_count !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="gap-1 glass hover:border-primary/50 text-slate-300 text-xs tracking-widest uppercase font-bold" onClick={() => navigate(`/super-admin/buildings/${building.id}`)}>
                      <Eye className="h-3.5 w-3.5" /> Manage
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 glass hover:border-primary/50 text-slate-300 text-xs tracking-widest uppercase font-bold"
                      onClick={() => toggleActive(building)}
                    >
                      {building.is_active ? (
                        <><PowerOff className="h-3.5 w-3.5 text-red-400" /> Disable</>
                      ) : (
                        <><Power className="h-3.5 w-3.5 text-emerald-400" /> Enable</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  )
}

export default BuildingsOverview
