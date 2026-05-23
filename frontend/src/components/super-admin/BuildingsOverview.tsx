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
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Buildings</h1>
            <p className="text-sm text-slate-500 mt-1">Manage societies and their admin accounts</p>
          </div>
          <Button className="gap-2 bg-violet-600 hover:bg-violet-700" onClick={() => navigate("/super-admin/buildings/new")}>
            <Plus className="h-4 w-4" /> Add Building
          </Button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-40 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : buildings.length === 0 ? (
          <Card>
            <CardContent className="py-16 flex flex-col items-center text-slate-400">
              <Building2 className="h-16 w-16 mb-4 text-slate-300" />
              <p className="font-semibold text-lg mb-2">No buildings yet</p>
              <p className="text-sm mb-6">Create your first building to onboard a society admin.</p>
              <Button className="gap-2 bg-violet-600 hover:bg-violet-700" onClick={() => navigate("/super-admin/buildings/new")}>
                <Plus className="h-4 w-4" /> Add Building
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {buildings.map((building) => (
              <Card key={building.id} className={`shadow-sm ${!building.is_active ? "opacity-75" : ""}`}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">{building.name}</h2>
                      <p className="text-xs font-mono text-slate-500">{building.code}</p>
                      {building.city && <p className="text-sm text-slate-500 mt-1">{building.city}</p>}
                    </div>
                    <Badge variant="secondary" className={building.is_active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-600"}>
                      {building.is_active ? "Active" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-sm text-slate-500">
                    <span>{building.admin_count} admin{building.admin_count !== 1 ? "s" : ""}</span>
                    <span>{building.unit_count} unit{building.unit_count !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate(`/super-admin/buildings/${building.id}`)}>
                      <Eye className="h-3.5 w-3.5" /> Manage
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => toggleActive(building)}
                    >
                      {building.is_active ? (
                        <><PowerOff className="h-3.5 w-3.5" /> Disable</>
                      ) : (
                        <><Power className="h-3.5 w-3.5" /> Enable</>
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
