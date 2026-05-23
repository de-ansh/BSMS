import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Building2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { api } from "@/lib/api"

const UnitForm = () => {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [unitNumber, setUnitNumber] = useState("")
  const [building, setBuilding] = useState("")
  const [floor, setFloor] = useState("1")
  const [bedrooms, setBedrooms] = useState("1")
  const [bathrooms, setBathrooms] = useState("1")
  const [maintenanceFee, setMaintenanceFee] = useState("0")
  const [status, setStatus] = useState("vacant")

  useEffect(() => {
    if (!id) return
    api.units.get(id)
      .then((data) => {
        setUnitNumber(String(data.unit_number || ""))
        setBuilding(String(data.building || ""))
        setFloor(String(data.floor ?? 1))
        setBedrooms(String(data.bedrooms ?? 1))
        setBathrooms(String(data.bathrooms ?? 1))
        setMaintenanceFee(String(data.maintenance_fee ?? "0"))
        setStatus(String(data.status || "vacant"))
      })
      .catch(() => setError("Failed to load unit."))
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    const payload = {
      unit_number: unitNumber.trim(),
      building: building.trim(),
      floor: Number(floor),
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      maintenance_fee: Number(maintenanceFee),
      status,
    }
    try {
      const result = isEdit && id
        ? await api.units.update(id, payload)
        : await api.units.create(payload)
      navigate(`/units/${result.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save unit")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-2xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-48" />
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
    )
  }

  return (
    <ScrollArea className="h-full overflow-y-auto">
      <div className="p-4 md:p-8 max-w-2xl mx-auto w-full space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(isEdit && id ? `/units/${id}` : "/members")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
              {isEdit ? "Edit Unit" : "Add Unit"}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {isEdit ? "Update unit information" : "Register a new unit in the society"}
            </p>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Unit Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unitNumber">Unit Number</Label>
                  <Input id="unitNumber" required value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} disabled={submitting} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="building">Building</Label>
                  <Input id="building" required value={building} onChange={(e) => setBuilding(e.target.value)} disabled={submitting} />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="floor">Floor</Label>
                  <Input id="floor" type="number" min="0" required value={floor} onChange={(e) => setFloor(e.target.value)} disabled={submitting} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input id="bedrooms" type="number" min="0" required value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} disabled={submitting} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input id="bathrooms" type="number" min="0" required value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} disabled={submitting} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fee">Maint. Fee ($)</Label>
                  <Input id="fee" type="number" min="0" step="0.01" required value={maintenanceFee} onChange={(e) => setMaintenanceFee(e.target.value)} disabled={submitting} />
                </div>
              </div>

              {isEdit && (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus} disabled={submitting}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vacant">Vacant</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(isEdit && id ? `/units/${id}` : "/members")} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 gap-2" disabled={submitting}>
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : isEdit ? "Save Changes" : "Create Unit"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}

export default UnitForm
