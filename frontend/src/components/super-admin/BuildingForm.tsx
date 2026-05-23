import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Building2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { api } from "@/lib/api"

const BuildingForm = () => {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [postalCode, setPostalCode] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      const result = await api.superAdmin.buildings.create({
        name: name.trim(),
        code: code.trim().toLowerCase().replace(/\s+/g, "-"),
        address: address.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        postal_code: postalCode.trim() || null,
      })
      navigate(`/super-admin/buildings/${result.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create building")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/super-admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Create Building</h1>
            <p className="text-sm text-slate-500">Register a new society / building on the platform</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-violet-600" /> Building Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">{error}</div>}

              <div className="space-y-2">
                <Label htmlFor="name">Building / Society Name</Label>
                <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} disabled={submitting} placeholder="Sunrise Towers" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Code (URL-safe, lowercase)</Label>
                <Input id="code" required pattern="[a-z0-9-]+" value={code} onChange={(e) => setCode(e.target.value.toLowerCase())} disabled={submitting} placeholder="sunrise-towers" />
                <p className="text-xs text-slate-500">Letters, numbers, and hyphens only</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} disabled={submitting} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} disabled={submitting} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" value={state} onChange={(e) => setState(e.target.value)} disabled={submitting} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal">Postal Code</Label>
                  <Input id="postal" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} disabled={submitting} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => navigate("/super-admin")} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 gap-2 bg-violet-600 hover:bg-violet-700" disabled={submitting}>
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : "Create Building"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}

export default BuildingForm
